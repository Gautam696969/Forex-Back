import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CUSTOM_FOURX_ICONS } from './data/custom-icons.js';
import { TOP_STOCK_LOGOS } from './data/seed-logos.js';
import { LOGO_OVERRIDES } from './data/logo-overrides.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YahooFinancePkg from 'yahoo-finance2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const yf = new (YahooFinancePkg as any)({ suppressNotices: ['yahooSurvey'] });

function getISTTimeString(): string {
  return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
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
  private overrides: Record<string, LogoOverrideEntry> = {};
  private storageDir: string;

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
      const topSymbols = [...Object.keys(CUSTOM_FOURX_ICONS), ...Object.keys(TOP_STOCK_LOGOS)];
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
    // Load compiled in-memory overrides first
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

  private logFailure(symbol: string, domain: string | null, reason: string) {
    const timeIST = getISTTimeString();
    console.error(
      `\x1b[31m[API FAILED] ${timeIST} api=logo symbol=${symbol} domain=${domain || 'N/A'} reason=${reason}\x1b[0m`,
    );
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
   * Get logo image buffer and content type for a symbol
   */
  async getLogo(rawSymbol: string): Promise<{ buffer: Buffer; contentType: string }> {
    let symbol = (rawSymbol || '').toUpperCase().trim();
    if (SYMBOL_ALIASES[symbol]) {
      symbol = SYMBOL_ALIASES[symbol];
    }

    // 1. Check FourX-styled custom SVG icons (Indices & Commodities)
    if (CUSTOM_FOURX_ICONS[symbol]) {
      const svg = CUSTOM_FOURX_ICONS[symbol];
      this.prisma.companyLogo
        .upsert({
          where: { symbol },
          update: { source: 'fourx_custom_svg', status: 'found' },
          create: { symbol, source: 'fourx_custom_svg', status: 'found' },
        })
        .catch(() => {});
      return {
        buffer: Buffer.from(svg, 'utf-8'),
        contentType: 'image/svg+xml',
      };
    }

    // 2. Check Top Indian Stock Verified SVG Vectors (Compiled in-memory, works across any server/environment)
    if (TOP_STOCK_LOGOS[symbol]) {
      const svg = TOP_STOCK_LOGOS[symbol];
      const domain = this.overrides[symbol]?.domain || LOGO_OVERRIDES[symbol]?.domain || null;
      this.prisma.companyLogo
        .upsert({
          where: { symbol },
          update: { source: 'verified_seed_svg', status: 'found', domain: domain ?? undefined },
          create: { symbol, source: 'verified_seed_svg', status: 'found', domain },
        })
        .catch(() => {});
      return {
        buffer: Buffer.from(svg, 'utf-8'),
        contentType: 'image/svg+xml',
      };
    }

    // 3. Check local disk cache (storage/logos/<symbol>.png or .svg)
    const cachedFiles = [
      path.join(this.storageDir, `${symbol}.png`),
      path.join(this.storageDir, `${symbol}.svg`),
      path.join(this.storageDir, `${symbol}.webp`),
      path.join(__dirname, 'data/logos', `${symbol}.png`),
      path.join(__dirname, 'data/logos', `${symbol}.svg`),
    ];

    for (const filePath of cachedFiles) {
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType =
          ext === '.svg' ? 'image/svg+xml' : ext === '.webp' ? 'image/webp' : 'image/png';
        const buffer = fs.readFileSync(filePath);
        return { buffer, contentType };
      }
    }

    // 4. Check if symbol was marked missing in database
    try {
      const existing = await this.prisma.companyLogo.findUnique({
        where: { symbol },
      });
      if (existing?.status === 'missing') {
        const reason = existing.domain
          ? 'Provider logo unavailable or LOGO_API_KEY not configured'
          : 'Domain not resolvable';
        this.logFailure(symbol, existing.domain || null, reason);
        throw new NotFoundException({
          ok: false,
          api: 'logo',
          error: `Logo not available for symbol '${symbol}'`,
        });
      }
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
    }

    // 5. Resolve Domain
    const domain = await this.resolveDomain(symbol);
    if (!domain) {
      this.logFailure(symbol, null, 'Domain could not be resolved from Yahoo Finance or overrides');
      await this.prisma.companyLogo
        .upsert({
          where: { symbol },
          update: { status: 'missing' },
          create: { symbol, status: 'missing' },
        })
        .catch(() => {});
      throw new NotFoundException({
        ok: false,
        api: 'logo',
        error: `No domain found for symbol '${symbol}'`,
      });
    }

    // 6. Fetch from Logo Provider (Logo.dev / Brandfetch)
    const apiKey = (process.env.LOGO_API_KEY || '').trim();
    if (!apiKey) {
      this.logFailure(symbol, domain, 'LOGO_API_KEY missing or not configured in .env');
      await this.prisma.companyLogo
        .upsert({
          where: { symbol },
          update: { domain, status: 'missing' },
          create: { symbol, domain, status: 'missing' },
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
        this.logFailure(symbol, domain, `Invalid logo API key or unauthorized (HTTP ${response.status})`);
        await this.prisma.companyLogo
          .upsert({
            where: { symbol },
            update: { domain, status: 'missing' },
            create: { symbol, domain, status: 'missing' },
          })
          .catch(() => {});
        throw new NotFoundException({
          ok: false,
          api: 'logo',
          error: `Logo API key is invalid or unauthorized (HTTP ${response.status})`,
        });
      }

      if (response.status === 429) {
        this.logFailure(symbol, domain, 'Logo provider rate limit exceeded (HTTP 429)');
        throw new NotFoundException({
          ok: false,
          api: 'logo',
          error: 'Logo provider rate limit reached (HTTP 429)',
        });
      }

      if (!response.ok) {
        this.logFailure(symbol, domain, `Logo not found on provider (HTTP ${response.status})`);
        await this.prisma.companyLogo
          .upsert({
            where: { symbol },
            update: { domain, status: 'missing' },
            create: { symbol, domain, status: 'missing' },
          })
          .catch(() => {});
        throw new NotFoundException({
          ok: false,
          api: 'logo',
          error: `No logo available for domain '${domain}'`,
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'image/png';

      // Save to disk cache
      const savePath = path.join(this.storageDir, `${symbol}.png`);
      fs.writeFileSync(savePath, buffer);

      // Save to database
      await this.prisma.companyLogo
        .upsert({
          where: { symbol },
          update: {
            domain,
            logo_url: `/storage/logos/${symbol}.png`,
            source: provider,
            status: 'found',
          },
          create: {
            symbol,
            domain,
            logo_url: `/storage/logos/${symbol}.png`,
            source: provider,
            status: 'found',
          },
        })
        .catch(() => {});

      return { buffer, contentType };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      const reason = err?.name === 'AbortError' ? 'Logo request timeout (9s)' : err?.message || 'Network fetch error';
      this.logFailure(symbol, domain, reason);
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
    let norm = (symbol || '').toUpperCase().trim();
    if (SYMBOL_ALIASES[norm]) {
      norm = SYMBOL_ALIASES[norm];
    }
    const savePath = path.join(this.storageDir, `${norm}.${ext}`);
    fs.writeFileSync(savePath, buffer);

    await this.prisma.companyLogo.upsert({
      where: { symbol: norm },
      update: {
        domain,
        logo_url: `/storage/logos/${norm}.${ext}`,
        source,
        status: 'found',
      },
      create: {
        symbol: norm,
        domain,
        logo_url: `/storage/logos/${norm}.${ext}`,
        source,
        status: 'found',
      },
    });
  }
}
