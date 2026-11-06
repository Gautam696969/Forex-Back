import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YahooFinancePkg from 'yahoo-finance2';
import sharp from 'sharp';
import { CUSTOM_FOURX_ICONS } from '../data/custom-icons.js';
import { seedLocalLogos, TOP_STOCK_LOGOS } from '../data/seed-logos.js';
import { LOGO_OVERRIDES } from '../data/logo-overrides.js';
import { cleanCompanyName, normalizeIpoKey } from '../logo.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const yf = new (YahooFinancePkg as any)({ suppressNotices: ['yahooSurvey'] });

const storageDir = path.resolve(process.cwd(), 'storage/logos');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Seed local SVGs first
seedLocalLogos(storageDir);

// Read overrides
let overrides: Record<string, { domain?: string; image_path?: string }> = { ...LOGO_OVERRIDES };
try {
  const overridesPath = path.resolve(__dirname, '../data/logo-overrides.json');
  if (fs.existsSync(overridesPath)) {
    const raw = JSON.parse(fs.readFileSync(overridesPath, 'utf-8'));
    overrides = { ...overrides, ...raw };
  }
} catch {}

// Top 100 Indian symbols for comprehensive coverage
const TOP_100_SYMBOLS = [
  // Top 50 Nifty & High-Volume
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
  'LT', 'AXISBANK', 'BAJFINANCE', 'ASIANPAINT', 'MARUTI', 'HCLTECH', 'SUNPHARMA', 'TITAN', 'TATAMOTORS', 'ULTRACEMCO',
  'BAJAJFINSV', 'NTPC', 'ONGC', 'POWERGRID', 'TATASTEEL', 'JSWSTEEL', 'M&M', 'ADANIENT', 'ADANIPORTS', 'COALINDIA',
  'GRASIM', 'BRITANNIA', 'TECHM', 'CIPLA', 'NESTLEIND', 'DRREDDY', 'WIPRO', 'EICHERMOT', 'HINDALCO', 'DIVISLAB',
  'APOLLOHOSP', 'HEROMOTOCO', 'TATAPOWER', 'BPCL', 'INDUSINDBK', 'BAJAJ-AUTO', 'LTIM', 'SHRIRAMFIN', 'TRENT', 'BEL',
  // Next 50 & Popular Growth Stocks
  'HAL', 'VEDL', 'VBL', 'DLF', 'SIEMENS', 'ABB', 'PIDILITIND', 'HAVELLS', 'GAIL', 'IOC',
  'CHOLAFIN', 'TVSMOTOR', 'AMBUJACEM', 'BANKBARODA', 'PNB', 'CANBK', 'UNIONBANK', 'IDFCFIRSTB', 'FEDERALBNK', 'POLYCAB',
  'COLPAL', 'MARICO', 'BERGEPAINT', 'MOTHERSON', 'BOSCHLTD', 'LUPIN', 'AUROPHARMA', 'BIOCON', 'ALKEM', 'PERSISTENT',
  'COFORGE', 'MPHASIS', 'MUTHOOTFIN', 'MANAPPURAM', 'PFC', 'RECLTD', 'IRCTC', 'IRFC', 'RVNL', 'BHEL',
  'JIOFIN', 'PAYTM', 'ZOMATO', 'NYKAA', 'DELHIVERY', 'POLICYBZR', 'SWIGGY', 'HYUNDAI', 'WAAREE', 'NTPCGREEN',
  // Key Benchmark Indices & Commodities
  'NIFTY 50', 'SENSEX', 'BANK NIFTY', 'NIFTY IT', 'GOLD24K', 'GOLD22K', 'SILVER1KG', 'CRUDEOIL', 'NATURALGAS'
];

async function trimRasterLogo(buffer: Buffer): Promise<Buffer> {
  try {
    const isSvg = buffer.slice(0, 100).toString('utf-8').includes('<svg');
    if (isSvg) return buffer;
    return await sharp(buffer)
      .trim()
      .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return buffer;
  }
}

async function resolveDomain(symbol: string): Promise<string | null> {
  const norm = symbol.toUpperCase().trim();
  if (overrides[norm]?.domain) return overrides[norm].domain!;

  // Try Yahoo Finance
  const suffixes = ['.NS', '.BO', ''];
  for (const suffix of suffixes) {
    try {
      const res = await yf.quoteSummary(norm + suffix, { modules: ['assetProfile'] });
      const website = res?.assetProfile?.website;
      if (website) {
        const u = new URL(website.startsWith('http') ? website : `https://${website}`);
        return u.hostname.toLowerCase().replace(/^www\./, '');
      }
    } catch {}
  }
  return null;
}

async function syncSingleStock(symbol: string): Promise<{ symbol: string; status: 'found' | 'missing'; source?: string; domain?: string; reason?: string }> {
  const norm = symbol.toUpperCase().trim();

  // 1. Custom SVG check (Indices/Commodities)
  if (CUSTOM_FOURX_ICONS[norm]) {
    await prisma.companyLogo.upsert({
      where: { symbol: norm },
      update: { source: 'fourx_custom_svg', status: 'found' },
      create: { symbol: norm, source: 'fourx_custom_svg', status: 'found' },
    });
    return { symbol: norm, status: 'found', source: 'fourx_custom_svg' };
  }

  // 2. Pre-seeded top stock SVG check
  if (TOP_STOCK_LOGOS[norm]) {
    const domain = overrides[norm]?.domain || (await resolveDomain(norm)) || undefined;
    await prisma.companyLogo.upsert({
      where: { symbol: norm },
      update: { domain, source: 'local_verified_svg', status: 'found', logo_url: `/storage/logos/${norm}.svg` },
      create: { symbol: norm, domain, source: 'local_verified_svg', status: 'found', logo_url: `/storage/logos/${norm}.svg` },
    });
    return { symbol: norm, status: 'found', source: 'local_verified_svg', domain };
  }

  // 3. Resolve Domain
  const domain = await resolveDomain(norm);
  if (!domain) {
    await prisma.companyLogo.upsert({
      where: { symbol: norm },
      update: { status: 'missing' },
      create: { symbol: norm, status: 'missing' },
    });
    return { symbol: norm, status: 'missing', reason: 'Domain not resolvable from Yahoo Finance' };
  }

  // 4. Provider / Clearbit Fetch
  const apiKey = (process.env.LOGO_API_KEY || '').trim();
  const provider = process.env.LOGO_PROVIDER || (apiKey.startsWith('pk_') ? 'logo.dev' : 'brandfetch');

  let logoUrl = '';
  if (apiKey) {
    logoUrl = provider === 'logo.dev'
      ? `https://img.logo.dev/${domain}?token=${apiKey}&size=128&format=png&fallback=404`
      : `https://cdn.brandfetch.io/${domain}?c=${apiKey}`;
  } else {
    logoUrl = `https://logo.clearbit.com/${domain}`;
  }

  try {
    const res = await fetch(logoUrl, { headers: { Accept: 'image/*' }, signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const rawBuf = Buffer.from(await res.arrayBuffer());
      const buffer = await trimRasterLogo(rawBuf);
      fs.writeFileSync(path.join(storageDir, `${norm}.png`), buffer);
      await prisma.companyLogo.upsert({
        where: { symbol: norm },
        update: { domain, source: apiKey ? provider : 'clearbit_public', status: 'found', logo_url: `/storage/logos/${norm}.png` },
        create: { symbol: norm, domain, source: apiKey ? provider : 'clearbit_public', status: 'found', logo_url: `/storage/logos/${norm}.png` },
      });
      return { symbol: norm, status: 'found', source: apiKey ? provider : 'clearbit_public', domain };
    } else {
      await prisma.companyLogo.upsert({
        where: { symbol: norm },
        update: { domain, status: 'missing' },
        create: { symbol: norm, domain, status: 'missing' },
      });
      return { symbol: norm, status: 'missing', domain, reason: `Provider returned HTTP ${res.status}` };
    }
  } catch (err: any) {
    return { symbol: norm, status: 'missing', domain, reason: err.message };
  }
}

async function syncSingleIpo(ipo: { symbol?: string; companyName: string }): Promise<{ symbol: string; name: string; status: 'found' | 'missing'; source?: string; domain?: string; reason?: string }> {
  const name = ipo.companyName;
  const sym = (ipo.symbol || '').toUpperCase().trim();
  const ipoKey = normalizeIpoKey(name);
  const cleanName = cleanCompanyName(name);

  // 1. Check if seed logo exists for symbol or ipoKey
  if (TOP_STOCK_LOGOS[sym] || TOP_STOCK_LOGOS[ipoKey]) {
    const domain = overrides[sym]?.domain || overrides[ipoKey]?.domain || undefined;
    await prisma.companyLogo.upsert({
      where: { symbol: sym || ipoKey },
      update: { domain, source: 'verified_seed_svg', status: 'found' },
      create: { symbol: sym || ipoKey, domain, source: 'verified_seed_svg', status: 'found' },
    });
    return { symbol: sym || ipoKey, name, status: 'found', source: 'verified_seed_svg', domain };
  }

  // 2. Check Overrides for domain
  let domain = overrides[sym]?.domain || overrides[ipoKey]?.domain || null;

  // 3. Name-based search via Clearbit / Brandfetch
  if (!domain) {
    try {
      const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(cleanName)}`, {
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        const items = await res.json() as Array<{ domain?: string }>;
        if (Array.isArray(items) && items.length > 0 && items[0]?.domain) {
          domain = items[0].domain.toLowerCase().replace(/^www\./, '');
        }
      }
    } catch {}
  }

  if (!domain) {
    await prisma.companyLogo.upsert({
      where: { symbol: sym || ipoKey },
      update: { status: 'missing' },
      create: { symbol: sym || ipoKey, status: 'missing' },
    });
    return { symbol: sym || ipoKey, name, status: 'missing', reason: 'Unlisted SME/New Co - No online domain found' };
  }

  // 4. Fetch Logo for Domain
  const apiKey = (process.env.LOGO_API_KEY || '').trim();
  const provider = process.env.LOGO_PROVIDER || (apiKey.startsWith('pk_') ? 'logo.dev' : 'brandfetch');
  const logoUrl = apiKey
    ? (provider === 'logo.dev'
        ? `https://img.logo.dev/${domain}?token=${apiKey}&size=128&format=png&fallback=404`
        : `https://cdn.brandfetch.io/${domain}?c=${apiKey}`)
    : `https://logo.clearbit.com/${domain}`;

  try {
    const res = await fetch(logoUrl, { headers: { Accept: 'image/*' }, signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const rawBuf = Buffer.from(await res.arrayBuffer());
      const buffer = await trimRasterLogo(rawBuf);
      const safeKey = (sym || ipoKey).replace(/[^a-zA-Z0-9_-]/g, '_');
      fs.writeFileSync(path.join(storageDir, `${safeKey}.png`), buffer);

      await prisma.companyLogo.upsert({
        where: { symbol: sym || ipoKey },
        update: { domain, source: apiKey ? provider : 'clearbit_public', status: 'found', logo_url: `/storage/logos/${safeKey}.png` },
        create: { symbol: sym || ipoKey, domain, source: apiKey ? provider : 'clearbit_public', status: 'found', logo_url: `/storage/logos/${safeKey}.png` },
      });
      return { symbol: sym || ipoKey, name, status: 'found', source: apiKey ? provider : 'clearbit_public', domain };
    } else {
      await prisma.companyLogo.upsert({
        where: { symbol: sym || ipoKey },
        update: { domain, status: 'missing' },
        create: { symbol: sym || ipoKey, domain, status: 'missing' },
      });
      return { symbol: sym || ipoKey, name, status: 'missing', domain, reason: `Provider returned HTTP ${res.status}` };
    }
  } catch (err: any) {
    return { symbol: sym || ipoKey, name, status: 'missing', domain, reason: err.message };
  }
}

async function run() {
  console.log('\n======================================================================');
  console.log('🔄 FourX Company Logos Comprehensive Batch Sync Starting...');
  console.log('======================================================================\n');

  // Top Stocks Sync
  console.log(`📋 Queued ${TOP_100_SYMBOLS.length} Top Stocks & Benchmark Instruments...\n`);
  const stockResults: Array<{ symbol: string; status: 'found' | 'missing'; source?: string; domain?: string; reason?: string }> = [];

  const batchSize = 5;
  for (let i = 0; i < TOP_100_SYMBOLS.length; i += batchSize) {
    const batch = TOP_100_SYMBOLS.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((sym) => syncSingleStock(sym)));
    stockResults.push(...batchResults);
    process.stdout.write(`\r⏳ Processed ${stockResults.length} / ${TOP_100_SYMBOLS.length} stocks...`);
    if (i + batchSize < TOP_100_SYMBOLS.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  console.log('\n✅ Stocks batch processing complete!\n');

  // IPO Sync
  const dbIpos = await prisma.ipo.findMany({
    select: { symbol: true, companyName: true },
    orderBy: { openDate: 'desc' },
    take: 30,
  });

  // If no DB ipos, supply real active/upcoming NSE IPO list
  const sampleIpos = dbIpos.length > 0 ? dbIpos : [
    { symbol: 'SWIGGY', companyName: 'Swiggy Limited' },
    { symbol: 'HYUNDAI', companyName: 'Hyundai Motor India Limited' },
    { symbol: 'WAAREE', companyName: 'Waaree Energies Limited' },
    { symbol: 'NTPCGREEN', companyName: 'NTPC Green Energy Limited' },
    { symbol: 'PARASHLTH', companyName: 'Paras Healthcare Limited' },
    { symbol: 'BCSSL', companyName: 'Bombay Coated and Special Steels Limited' },
    { symbol: 'BLSPOLY', companyName: 'BLS Polymers Limited' },
    { symbol: 'SFCTECH', companyName: 'SFC Environmental Technologies Limited' },
    { symbol: 'HGSINDIALT', companyName: 'HGS (India) Limited' },
    { symbol: 'MAXENGS', companyName: 'Maxwell Engineering Solutions Limited' },
    { symbol: 'VPFL', companyName: 'Vedant Poly Fabs Limited' },
    { symbol: 'MKJEWELS', companyName: 'M. K. Sons Fine Jewels Limited' },
    { symbol: 'EDELALTS', companyName: 'EAAA India Alternatives Limited' },
    { symbol: 'EVENTIONS', companyName: 'Eventions Limited' },
    { symbol: 'PAPADMALJI', companyName: 'Papadmalji Agro Foods Limited' },
  ];

  console.log(`📋 Queued ${sampleIpos.length} Real Current & Upcoming IPOs...\n`);
  const ipoResults: Array<{ symbol: string; name: string; status: 'found' | 'missing'; source?: string; domain?: string; reason?: string }> = [];

  for (let i = 0; i < sampleIpos.length; i += batchSize) {
    const batch = sampleIpos.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((item) => syncSingleIpo(item)));
    ipoResults.push(...batchResults);
    process.stdout.write(`\r⏳ Processed ${ipoResults.length} / ${sampleIpos.length} IPOs...`);
    if (i + batchSize < sampleIpos.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  console.log('\n✅ IPOs batch processing complete!\n');

  // Generate Reports
  const istNow = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';

  // 1. STOCKS COVERAGE REPORT
  const stockFound = stockResults.filter((r) => r.status === 'found');
  const stockMissing = stockResults.filter((r) => r.status === 'missing');

  console.log('======================================================================');
  console.log(`📊 FourX STOCKS Coverage Report [${istNow}]`);
  console.log('======================================================================');
  console.log(`• Total Stocks Processed  : ${stockResults.length}`);
  console.log(`• Logos Found (Ready)     : ${stockFound.length} (${((stockFound.length / stockResults.length) * 100).toFixed(1)}%)`);
  console.log(`• Logos Missing (Initials): ${stockMissing.length} (${((stockMissing.length / stockResults.length) * 100).toFixed(1)}%)`);
  console.log('----------------------------------------------------------------------');
  console.log('🌟 Sample Active Stock Logos:');
  console.log(
    stockFound
      .slice(0, 15)
      .map((f) => `  ✓ ${f.symbol.padEnd(14)} (${f.domain || f.source})`)
      .join('\n'),
  );
  if (stockMissing.length > 0) {
    console.log('----------------------------------------------------------------------');
    console.log(`⚠️  Symbols Missing a Logo (${stockMissing.length} total, fallback to initials):`);
    console.log(
      stockMissing
        .slice(0, 10)
        .map((m, idx) => `  [${idx + 1}] ${m.symbol.padEnd(14)} reason: ${m.reason || 'No logo'}`)
        .join('\n'),
    );
  }

  // 2. IPOS COVERAGE REPORT
  const ipoFound = ipoResults.filter((r) => r.status === 'found');
  const ipoMissing = ipoResults.filter((r) => r.status === 'missing');

  console.log('\n======================================================================');
  console.log(`🚀 FourX IPOs Coverage Report [${istNow}]`);
  console.log('======================================================================');
  console.log(`• Total IPOs Processed    : ${ipoResults.length}`);
  console.log(`• IPO Logos Found (Ready) : ${ipoFound.length} (${((ipoFound.length / ipoResults.length) * 100).toFixed(1)}%)`);
  console.log(`• IPO Logos Missing       : ${ipoMissing.length} (${((ipoMissing.length / ipoResults.length) * 100).toFixed(1)}%)`);
  console.log('----------------------------------------------------------------------');
  console.log('🌟 Verified IPO Logos:');
  console.log(
    ipoFound
      .map((f) => `  ✓ ${(f.symbol || f.name).padEnd(28)} -> ${f.domain || f.source}`)
      .join('\n'),
  );
  if (ipoMissing.length > 0) {
    console.log('----------------------------------------------------------------------');
    console.log('ℹ️  SME / Brand New IPOs without Public Logo (Showing initials fallback circle):');
    console.log(
      ipoMissing
        .map((m) => `  • ${m.name.padEnd(35)} (reason: ${m.reason || 'SME - No logo'})`)
        .join('\n'),
    );
  }
  console.log('======================================================================\n');

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Batch sync failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
