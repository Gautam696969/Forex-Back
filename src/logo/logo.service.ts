import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CUSTOM_FOURX_ICONS } from './data/custom-icons.js';
import { TOP_STOCK_LOGOS } from './data/seed-logos.js';
import { LOGO_OVERRIDES } from './data/logo-overrides.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YahooFinancePkg from 'yahoo-finance2';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const yf = new (YahooFinancePkg as any)({ suppressNotices: ['yahooSurvey'] });

export function getISTTimeString(): string {
  return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
}

export function cleanCompanyName(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\b(Industries|Enterprise|Enterprises|Solutions|Technologies|Holdings|Group|Company|Corporation)\s+(Limited|Ltd|Pvt\.?|Private\s+Limited)\b/gi, '')
    .replace(/\b(India\s+Limited|India\s+Ltd)\b/gi, 'India')
    .replace(/\b(Private\s+Limited|Pvt\.?\s*Ltd\.?|Pvt\.?|Limited|Ltd\.?)\b/gi, '')
    .replace(/[\(\)\[\],.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeIpoKey(nameOrSymbol: string): string {
  const clean = cleanCompanyName(nameOrSymbol);
  const slug = clean
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `ipo:${slug}`;
}

const SYMBOL_ALIASES: Record<string, string> = {
  'MM': 'M&M',
  'MAHINDRA': 'M&M',
  'BAJAJFINANCE': 'BAJFINANCE',
  'BAJAJ_FINANCE': 'BAJFINANCE',
  'TATAMOTOR': 'TATAMOTORS',
  'HDFC': 'HDFCBANK',
  'KOTAK': 'KOTAKBANK',
  'AIRTEL': 'BHARTIARTL',
  'BHARTI': 'BHARTIARTL',
  'SBI': 'SBIN',
  'STATEBANK': 'SBIN',
  'MARUTISUZUKI': 'MARUTI',
  'INFOSYS': 'INFY',
  'HINDUNILEVER': 'HINDUNILVR',
  'HUL': 'HINDUNILVR',
  'ASIANPAINTS': 'ASIANPAINT',
  'TITANCOMPANY': 'TITAN',
  'SUNPHARMACEUTICAL': 'SUNPHARMA',
};

interface LogoOverrideEntry {
  domain?: string;
  image_path?: string;
}

@Injectable()
export class LogoService implements OnModuleInit {
  private readonly logger = new Logger(LogoService.name);
  private overrides: Record<string, LogoOverrideEntry> = {};
  private storageDir: string;

  public lastError: string | null = null;
  public lastFailureTimeIST: string | null = null;

  constructor(private prisma: PrismaService) {
    this.storageDir = path.resolve(process.cwd(), 'storage/logos');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    this.loadOverrides();
  }

  async onModuleInit() {
    // Ensure all built-in top stock logos and indices have status 'found' in DB
    try {
      const topSymbols = [
        ...Object.keys(CUSTOM_FOURX_ICONS),
        ...Object.keys(TOP_STOCK_LOGOS),
      ];
      await this.prisma.companyLogo.updateMany({
        where: {
          symbol: { in: topSymbols },
          status: 'missing',
        },
        data: {
          status: 'found',
        },
      });
    } catch {}
  }

  private loadOverrides() {
    this.overrides = { ...LOGO_OVERRIDES };

    try {
      const overridesPath = path.resolve(__dirname, 'data/logo-overrides.json');
      if (fs.existsSync(overridesPath)) {
        const raw = fs.readFileSync(overridesPath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.overrides = { ...this.overrides, ...parsed };
      }
    } catch {}
  }

  public logSuccess(symbol: string, source: string) {
    console.log(`\x1b[32m[OK] api=logo symbol=${symbol} source=${source}\x1b[0m`);
  }

  public logFailure(symbol: string, domain: string | null, reason: string, elapsedMs?: number) {
    const timeIST = getISTTimeString();
    const ms = elapsedMs !== undefined ? `${elapsedMs}ms` : '0ms';
    console.error(
      `\x1b[31m[API FAILED] ${timeIST} api=logo symbol=${symbol} domain=${domain || 'N/A'} ${ms} reason=${reason}\x1b[0m`,
    );
    this.lastError = `symbol=${symbol} reason=${reason}`;
    this.lastFailureTimeIST = timeIST;
  }

  /**
   * Health status for GET /api/logo/health
   */
  async getHealth() {
    const total = await this.prisma.companyLogo.count();
    const found = await this.prisma.companyLogo.count({ where: { status: 'found' } });
    const missing = await this.prisma.companyLogo.count({ where: { status: 'missing' } });
    const coveragePercent = total > 0 ? `${((found / total) * 100).toFixed(1)}%` : '0%';

    return {
      ok: true,
      api: 'logo',
      total,
      found,
      missing,
      coveragePercent,
      lastError: this.lastError,
      lastFailureTimeIST: this.lastFailureTimeIST,
    };
  }

  /**
   * Trim white/transparent margins with sharp and resize to square
   */
  async trimImageBuffer(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      const isSvg = buffer.slice(0, 100).toString('utf-8').includes('<svg');
      if (isSvg) {
        return { buffer, contentType: 'image/svg+xml' };
      }

      const trimmed = await sharp(buffer)
        .trim() // removes solid white or transparent margin
        .resize(128, 128, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      return { buffer: trimmed, contentType: 'image/png' };
    } catch {
      return { buffer, contentType: 'image/png' };
    }
  }

  /**
   * Resolve company domain from symbol via overrides, DB cache or Yahoo Finance
   */
  async resolveDomain(rawSymbol: string): Promise<string | null> {
    let norm = (rawSymbol || '').toUpperCase().trim();
    if (SYMBOL_ALIASES[norm]) {
      norm = SYMBOL_ALIASES[norm];
    }

    if (this.overrides[norm]?.domain) {
      return this.overrides[norm].domain!;
    }
    if (LOGO_OVERRIDES[norm]?.domain) {
      return LOGO_OVERRIDES[norm].domain!;
    }

    // Check database company_logos cache
    try {
      const existing = await this.prisma.companyLogo.findUnique({
        where: { symbol: norm },
      });
      if (existing) {
        if (existing.domain) return existing.domain;
        if (existing.status === 'missing') return null;
      }
    } catch {}

    // Query Yahoo Finance
    const suffixes = ['.NS', '.BO', ''];
    for (const suffix of suffixes) {
      try {
        const querySymbol = norm + suffix;
        const result = await Promise.race([
          yf.quoteSummary(querySymbol, { modules: ['assetProfile'] }),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
        ]);
        const website = result?.assetProfile?.website;
        if (website) {
          const parsedUrl = new URL(website.startsWith('http') ? website : `https://${website}`);
          const cleanDomain = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
          return cleanDomain;
        }
      } catch {}
    }

    return null;
  }

  /**
   * Search domain by company name (used for IPOs)
   */
  async searchCompanyDomain(companyName: string): Promise<string | null> {
    const clean = cleanCompanyName(companyName);
    if (!clean) return null;

    // 1. Check overrides by slug
    const slug = normalizeIpoKey(companyName);
    if (this.overrides[slug]?.domain) {
      return this.overrides[slug].domain!;
    }

    // 2. Clearbit company autocomplete (free, fast, no auth required)
    try {
      const res = await fetch(
        `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(clean)}`,
        { signal: AbortSignal.timeout(2500) },
      );
      if (res.ok) {
        const items = (await res.json()) as Array<{ domain?: string }>;
        if (Array.isArray(items) && items.length > 0 && items[0]?.domain) {
          return items[0].domain.toLowerCase().replace(/^www\./, '');
        }
      }
    } catch {}

    // 3. Provider Search (Brandfetch) if LOGO_API_KEY is configured
    const apiKey = (process.env.LOGO_API_KEY || '').trim();
    if (apiKey) {
      try {
        const res = await fetch(
          `https://api.brandfetch.io/v2/search/${encodeURIComponent(clean)}`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(3000),
          },
        );
        if (res.ok) {
          const items = (await res.json()) as Array<{ domain?: string }>;
          if (Array.isArray(items) && items.length > 0 && items[0]?.domain) {
            return items[0].domain.toLowerCase().replace(/^www\./, '');
          }
        }
      } catch {}
    }

    return null;
  }

  /**
   * Background resolver for IPOs: runs after IPO list fetch, never blocks IPO API
   */
  resolveIpoLogosBackground(ipos: Array<{ symbol?: string; companyName?: string }>) {
    if (!Array.isArray(ipos) || ipos.length === 0) return;
    setImmediate(async () => {
      for (const ipo of ipos) {
        try {
          const sym = ipo.symbol?.trim();
          const name = ipo.companyName?.trim();
          if (sym) {
            const upperSym = sym.toUpperCase();
            const exists = await this.prisma.companyLogo.findUnique({
              where: { symbol: upperSym },
              select: { status: true },
            }).catch(() => null);
            if (!exists) {
              await this.getLogo(sym).catch(() => {});
            }
          }
          if (name) {
            const ipoKey = normalizeIpoKey(name);
            const upperKey = ipoKey.toUpperCase();
            const exists = await this.prisma.companyLogo.findUnique({
              where: { symbol: upperKey },
              select: { status: true },
            }).catch(() => null);
            if (!exists) {
              await this.getLogo(ipoKey).catch(() => {});
            }
          }
        } catch {}
      }
    });
  }

  /**
   * Main GET /api/logo/:symbol handler: image buffer and content-type
   */
  async getLogo(rawSymbol: string): Promise<{ buffer: Buffer; contentType: string }> {
    const startTime = Date.now();
    let symbol = (rawSymbol || '').trim();
    if (symbol.startsWith('IPO_')) {
      symbol = symbol.substring(4);
    }

    const upperSymbol = symbol.toUpperCase();
    const normalizedAlias = SYMBOL_ALIASES[upperSymbol] || upperSymbol;

    // 1. Check FourX-styled custom SVG icons (Indices & Commodities)
    if (CUSTOM_FOURX_ICONS[upperSymbol] || CUSTOM_FOURX_ICONS[normalizedAlias] || CUSTOM_FOURX_ICONS[symbol]) {
      const svg = CUSTOM_FOURX_ICONS[upperSymbol] || CUSTOM_FOURX_ICONS[normalizedAlias] || CUSTOM_FOURX_ICONS[symbol];
      this.prisma.companyLogo
        .upsert({
          where: { symbol: upperSymbol },
          update: { source: 'fourx_custom_svg', status: 'found' },
          create: { symbol: upperSymbol, source: 'fourx_custom_svg', status: 'found' },
        })
        .catch(() => {});
      this.logSuccess(symbol, 'fourx_custom_svg');
      return {
        buffer: Buffer.from(svg, 'utf-8'),
        contentType: 'image/svg+xml',
      };
    }

    // 2. Check Top Indian Stock & IPO Verified SVG Vectors
    const seedSvg =
      TOP_STOCK_LOGOS[upperSymbol] ||
      TOP_STOCK_LOGOS[normalizedAlias] ||
      TOP_STOCK_LOGOS[symbol] ||
      TOP_STOCK_LOGOS[symbol.toLowerCase()];

    if (seedSvg) {
      const domain =
        this.overrides[upperSymbol]?.domain ||
        this.overrides[symbol]?.domain ||
        LOGO_OVERRIDES[upperSymbol]?.domain ||
        null;

      this.prisma.companyLogo
        .upsert({
          where: { symbol: upperSymbol },
          update: { source: 'verified_seed_svg', status: 'found', domain: domain ?? undefined },
          create: { symbol: upperSymbol, source: 'verified_seed_svg', status: 'found', domain },
        })
        .catch(() => {});
      this.logSuccess(symbol, 'verified_seed_svg');
      return {
        buffer: Buffer.from(seedSvg, 'utf-8'),
        contentType: 'image/svg+xml',
      };
    }

    // 3. Check local disk cache (storage/logos/<symbol>.png or .svg)
    const diskFileName = symbol.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cachedFiles = [
      path.join(this.storageDir, `${diskFileName}.png`),
      path.join(this.storageDir, `${diskFileName}.svg`),
      path.join(this.storageDir, `${diskFileName}.webp`),
      path.join(this.storageDir, `${upperSymbol}.png`),
      path.join(this.storageDir, `${upperSymbol}.svg`),
      path.join(__dirname, 'data/logos', `${upperSymbol}.png`),
      path.join(__dirname, 'data/logos', `${upperSymbol}.svg`),
    ];

    for (const filePath of cachedFiles) {
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const rawBuffer = fs.readFileSync(filePath);
        const { buffer, contentType } = await this.trimImageBuffer(rawBuffer);
        this.logSuccess(symbol, 'disk_cache');
        return { buffer, contentType };
      }
    }

    // 4. Check Database cache for missing
    try {
      const existing = await this.prisma.companyLogo.findUnique({
        where: { symbol: upperSymbol },
      });
      if (existing?.status === 'missing') {
        throw new NotFoundException({
          ok: false,
          api: 'logo',
          error: `Logo not available for symbol '${symbol}'`,
        });
      }
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
    }

    // 5. Domain Resolution (Stock vs IPO)
    let domain: string | null = null;
    if (symbol.startsWith('ipo:')) {
      // IPO name-based lookup
      const namePart = symbol.substring(4).replace(/-/g, ' ');
      domain = (await this.searchCompanyDomain(namePart)) || this.overrides[symbol]?.domain || null;
    } else {
      // Standard stock symbol lookup
      domain = await this.resolveDomain(normalizedAlias);
      // Fallback: check if symbol exists in IPO DB to resolve by IPO company name
      if (!domain) {
        try {
          const ipoItem = await this.prisma.ipo.findFirst({
            where: { symbol: upperSymbol },
          });
          if (ipoItem?.companyName) {
            domain = await this.searchCompanyDomain(ipoItem.companyName);
          }
        } catch {}
      }
    }

    if (!domain) {
      this.logFailure(symbol, null, 'Domain could not be resolved from Yahoo Finance or overrides', Date.now() - startTime);
      await this.prisma.companyLogo
        .upsert({
          where: { symbol: upperSymbol },
          update: { status: 'missing' },
          create: { symbol: upperSymbol, status: 'missing' },
        })
        .catch(() => {});
      throw new NotFoundException({
        ok: false,
        api: 'logo',
        error: `No domain found for symbol '${symbol}'`,
      });
    }

    // 6. Fetch from Provider (Logo.dev / Brandfetch)
    const apiKey = (process.env.LOGO_API_KEY || '').trim();
    if (!apiKey) {
      // Try unauthenticated Clearbit / Google favicon fallback if available
      try {
        const fallbackUrl = `https://logo.clearbit.com/${domain}`;
        const fbRes = await fetch(fallbackUrl, {
          headers: { Accept: 'image/png,image/*,*/*' },
          signal: AbortSignal.timeout(3000),
        });
        if (fbRes.ok) {
          const rawBuf = Buffer.from(await fbRes.arrayBuffer());
          const { buffer, contentType } = await this.trimImageBuffer(rawBuf);
          const savePath = path.join(this.storageDir, `${diskFileName}.png`);
          fs.writeFileSync(savePath, buffer);
          await this.prisma.companyLogo
            .upsert({
              where: { symbol: upperSymbol },
              update: { domain, logo_url: `/storage/logos/${diskFileName}.png`, source: 'clearbit_public', status: 'found' },
              create: { symbol: upperSymbol, domain, logo_url: `/storage/logos/${diskFileName}.png`, source: 'clearbit_public', status: 'found' },
            })
            .catch(() => {});
          this.logSuccess(symbol, 'clearbit_public');
          return { buffer, contentType };
        }
      } catch {}

      this.logFailure(symbol, domain, 'LOGO_API_KEY missing or not configured in .env', Date.now() - startTime);
      await this.prisma.companyLogo
        .upsert({
          where: { symbol: upperSymbol },
          update: { domain, status: 'missing' },
          create: { symbol: upperSymbol, domain, status: 'missing' },
        })
        .catch(() => {});
      throw new NotFoundException({
        ok: false,
        api: 'logo',
        error: `LOGO_API_KEY is not configured in .env for domain '${domain}'`,
      });
    }

    // Determine Provider URL
    const provider = process.env.LOGO_PROVIDER || (apiKey.startsWith('pk_') ? 'logo.dev' : 'brandfetch');
    let logoUrl = '';
    if (provider === 'logo.dev') {
      logoUrl = `https://img.logo.dev/${domain}?token=${apiKey}&size=128&format=png&fallback=404`;
    } else {
      logoUrl = `https://cdn.brandfetch.io/${domain}?c=${apiKey}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(logoUrl, {
        signal: controller.signal,
        headers: { Accept: 'image/png,image/svg+xml,image/*,*/*' },
      });
      clearTimeout(timeout);

      if (response.status === 401 || response.status === 403) {
        this.logFailure(symbol, domain, `Invalid logo API key or unauthorized (HTTP ${response.status})`, Date.now() - startTime);
        await this.prisma.companyLogo
          .upsert({
            where: { symbol: upperSymbol },
            update: { domain, status: 'missing' },
            create: { symbol: upperSymbol, domain, status: 'missing' },
          })
          .catch(() => {});
        throw new NotFoundException({
          ok: false,
          api: 'logo',
          error: `Logo API key is invalid or unauthorized (HTTP ${response.status})`,
        });
      }

      if (response.status === 429) {
        this.logFailure(symbol, domain, 'Logo provider rate limit exceeded (HTTP 429)', Date.now() - startTime);
        throw new NotFoundException({
          ok: false,
          api: 'logo',
          error: 'Logo provider rate limit reached (HTTP 429)',
        });
      }

      if (!response.ok) {
        this.logFailure(symbol, domain, `Logo not found on provider (HTTP ${response.status})`, Date.now() - startTime);
        await this.prisma.companyLogo
          .upsert({
            where: { symbol: upperSymbol },
            update: { domain, status: 'missing' },
            create: { symbol: upperSymbol, domain, status: 'missing' },
          })
          .catch(() => {});
        throw new NotFoundException({
          ok: false,
          api: 'logo',
          error: `No logo available for domain '${domain}'`,
        });
      }

      const rawBuffer = Buffer.from(await response.arrayBuffer());
      const { buffer, contentType } = await this.trimImageBuffer(rawBuffer);

      // Save to disk cache
      const savePath = path.join(this.storageDir, `${diskFileName}.png`);
      fs.writeFileSync(savePath, buffer);

      // Save to database
      await this.prisma.companyLogo
        .upsert({
          where: { symbol: upperSymbol },
          update: {
            domain,
            logo_url: `/storage/logos/${diskFileName}.png`,
            source: provider,
            status: 'found',
          },
          create: {
            symbol: upperSymbol,
            domain,
            logo_url: `/storage/logos/${diskFileName}.png`,
            source: provider,
            status: 'found',
          },
        })
        .catch(() => {});

      this.logSuccess(symbol, provider);
      return { buffer, contentType };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      const reason = err?.name === 'AbortError' ? 'Logo request timeout (9s)' : err?.message || 'Network fetch error';
      this.logFailure(symbol, domain, reason, Date.now() - startTime);
      throw new NotFoundException({
        ok: false,
        api: 'logo',
        error: reason,
      });
    }
  }

  /**
   * Preload or store a logo locally (e.g. from sync script or seed)
   */
  async saveLocalLogo(symbol: string, domain: string, buffer: Buffer, source: string, ext = 'png') {
    const norm = symbol.toUpperCase().trim();
    const diskFileName = norm.replace(/[^a-zA-Z0-9_-]/g, '_');
    const { buffer: trimmed } = await this.trimImageBuffer(buffer);
    const savePath = path.join(this.storageDir, `${diskFileName}.${ext}`);
    fs.writeFileSync(savePath, trimmed);

    await this.prisma.companyLogo.upsert({
      where: { symbol: norm },
      update: {
        domain,
        logo_url: `/storage/logos/${diskFileName}.${ext}`,
        source,
        status: 'found',
      },
      create: {
        symbol: norm,
        domain,
        logo_url: `/storage/logos/${diskFileName}.${ext}`,
        source,
        status: 'found',
      },
    });
  }
}
