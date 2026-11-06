import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YahooFinancePkg from 'yahoo-finance2';
import { CUSTOM_FOURX_ICONS } from '../data/custom-icons.js';
import { seedLocalLogos, TOP_STOCK_LOGOS } from '../data/seed-logos.js';

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
let overrides: Record<string, { domain?: string; image_path?: string }> = {};
try {
  const overridesPath = path.resolve(__dirname, '../data/logo-overrides.json');
  if (fs.existsSync(overridesPath)) {
    overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf-8'));
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

async function syncSingleLogo(symbol: string): Promise<{ symbol: string; status: 'found' | 'missing'; source?: string; domain?: string; reason?: string }> {
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
  if (TOP_STOCK_LOGOS[norm] || fs.existsSync(path.join(storageDir, `${norm}.svg`)) || fs.existsSync(path.join(storageDir, `${norm}.png`))) {
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
    return { symbol: norm, status: 'missing', reason: 'Domain not resolvable' };
  }

  // 4. Provider Fetch
  const apiKey = (process.env.LOGO_API_KEY || '').trim();
  if (!apiKey) {
    await prisma.companyLogo.upsert({
      where: { symbol: norm },
      update: { domain, status: 'missing' },
      create: { symbol: norm, domain, status: 'missing' },
    });
    return { symbol: norm, status: 'missing', domain, reason: 'LOGO_API_KEY not configured' };
  }

  const provider = process.env.LOGO_PROVIDER || (apiKey.startsWith('pk_') ? 'logo.dev' : 'brandfetch');
  const logoUrl = provider === 'logo.dev'
    ? `https://img.logo.dev/${domain}?token=${apiKey}&size=128&format=png&fallback=404`
    : `https://cdn.brandfetch.io/${domain}?c=${apiKey}`;

  try {
    const res = await fetch(logoUrl, { headers: { Accept: 'image/*' } });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(storageDir, `${norm}.png`), buffer);
      await prisma.companyLogo.upsert({
        where: { symbol: norm },
        update: { domain, source: provider, status: 'found', logo_url: `/storage/logos/${norm}.png` },
        create: { symbol: norm, domain, source: provider, status: 'found', logo_url: `/storage/logos/${norm}.png` },
      });
      return { symbol: norm, status: 'found', source: provider, domain };
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

async function run() {
  console.log('\n======================================================================');
  console.log('🔄 FourX Company Logos Batch Sync Starting (Top Stocks & Instruments)...');
  console.log('======================================================================\n');

  // Collect all symbols: from DB pairs, IPOs, and Top 100 list
  const dbPairs = await prisma.currencyPair.findMany({ select: { symbol: true } });
  const dbIpos = await prisma.ipo.findMany({ select: { symbol: true } });

  const allSymbolsSet = new Set<string>();
  TOP_100_SYMBOLS.forEach((s) => allSymbolsSet.add(s));
  dbPairs.forEach((p) => allSymbolsSet.add(p.symbol));
  dbIpos.forEach((i) => allSymbolsSet.add(i.symbol));

  const symbolsList = Array.from(allSymbolsSet);
  console.log(`📋 Total unique symbols queued for logo sync: ${symbolsList.length}\n`);

  const results: Array<{ symbol: string; status: 'found' | 'missing'; source?: string; domain?: string; reason?: string }> = [];

  // Batch processing with rate limiting (5 per batch, 250ms sleep)
  const batchSize = 5;
  for (let i = 0; i < symbolsList.length; i += batchSize) {
    const batch = symbolsList.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((sym) => syncSingleLogo(sym)));
    results.push(...batchResults);
    process.stdout.write(`\r⏳ Processed ${results.length} / ${symbolsList.length} symbols...`);
    if (i + batchSize < symbolsList.length) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  console.log('\n\n✅ Batch processing complete!\n');

  // Generate Coverage Report
  const foundList = results.filter((r) => r.status === 'found');
  const missingList = results.filter((r) => r.status === 'missing');

  const sourceCounts: Record<string, number> = {};
  foundList.forEach((r) => {
    const src = r.source || 'unknown';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  const istNow = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';

  console.log('======================================================================');
  console.log(`📊 FourX Company Logos Coverage Report [${istNow}]`);
  console.log('======================================================================');
  console.log(`• Total Symbols Processed : ${results.length}`);
  console.log(`• Logos Found (Ready)     : ${foundList.length} (${((foundList.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`• Logos Missing (Initials): ${missingList.length} (${((missingList.length / results.length) * 100).toFixed(1)}%)`);
  console.log('• Sources Breakdown:');
  for (const [src, count] of Object.entries(sourceCounts)) {
    console.log(`    - ${src.padEnd(22)} : ${count}`);
  }
  console.log('----------------------------------------------------------------------');
  console.log('🌟 Sample Active Logos:');
  console.log(
    foundList
      .slice(0, 15)
      .map((f) => `  ✓ ${f.symbol.padEnd(12)} (${f.domain || f.source})`)
      .join('\n'),
  );

  if (missingList.length > 0) {
    console.log('----------------------------------------------------------------------');
    console.log(`⚠️  Symbols Missing a Logo (${missingList.length} total, fallback to initials):`);
    console.log(
      missingList
        .slice(0, 15)
        .map((m, idx) => `  [${idx + 1}] ${m.symbol.padEnd(14)} reason: ${m.reason || 'No logo'}`)
        .join('\n'),
    );
    if (missingList.length > 15) {
      console.log(`  ... and ${missingList.length - 15} more.`);
    }
  }
  console.log('======================================================================\n');

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Sync failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
