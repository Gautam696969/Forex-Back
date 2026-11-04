import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import https from 'https';
import { CentralApiService } from './central-api.service.js';

export interface IpoItem {
  id: string;
  symbol: string;
  companyName: string;
  category: 'MAINLINE' | 'SME';
  priceBand: string;
  minPrice: number;
  maxPrice: number;
  lotSize: number;
  issueSize: string;
  openDate: string; // ISO string
  closeDate: string; // ISO string
  listingDate?: string;
  gmp?: number | null; // null if no verified legal source
  subscriptionRate: number;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED' | 'LISTED';
  about?: string;
  source: string;
  lastUpdatedIST: string;
  subscriptionBreakdown?: {
    qib: string;
    nii: string;
    retail: string;
    total: string;
  };
}

@Injectable()
export class NseIpoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NseIpoService.name);
  private cachedIpos: IpoItem[] = [];
  private lastFetchedAt: number = 0;
  private isFetching: boolean = false;
  private refreshTimer: NodeJS.Timeout | null = null;
  private cookieJar: string = '';

  constructor(private centralApi: CentralApiService) {}

  async onModuleInit() {
    this.logger.log('Initializing Real NSE IPO Service...');
    // Fetch in background so app.listen() is immediate (<100ms) and never causes ECONNREFUSED
    this.refreshIpos().catch((err) =>
      this.logger.warn('Initial IPO fetch deferred: ' + err.message),
    );
    // Refresh every 10 minutes in the background
    this.refreshTimer = setInterval(() => {
      this.refreshIpos();
    }, 10 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  public async getIpos(status?: string): Promise<{
    ipos: IpoItem[];
    lastUpdated: string;
    source: string;
  }> {
    // If cache is empty or older than 10 minutes, trigger refresh
    if (this.cachedIpos.length === 0 || Date.now() - this.lastFetchedAt > 10 * 60 * 1000) {
      await this.refreshIpos();
    }

    const nowIST = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';

    let result = this.cachedIpos;
    if (status && status !== 'ALL') {
      result = result.filter((item) => item.status === status);
    }

    return {
      ipos: result,
      lastUpdated: this.cachedIpos[0]?.lastUpdatedIST || nowIST,
      source: 'National Stock Exchange of India (NSE)',
    };
  }

  public async getIpoDetail(symbolOrId: string): Promise<IpoItem | null> {
    const upper = symbolOrId.toUpperCase().trim();
    let ipo = this.cachedIpos.find((item) => item.symbol.toUpperCase() === upper || item.id === symbolOrId);

    if (!ipo && (this.cachedIpos.length === 0 || Date.now() - this.lastFetchedAt > 10 * 60 * 1000)) {
      await this.refreshIpos();
      ipo = this.cachedIpos.find((item) => item.symbol.toUpperCase() === upper || item.id === symbolOrId);
    }

    if (!ipo) return null;

    // Fetch live category breakdown if not already fetched
    if (!ipo.subscriptionBreakdown && ipo.status === 'OPEN') {
      try {
        const detail = await this.fetchNseJson(`/api/ipo-detail?symbol=${encodeURIComponent(ipo.symbol)}`);
        if (detail && detail.bidDetails) {
          ipo = this.enrichIpoWithDetail(ipo, detail);
        }
      } catch (err) {
        // use base IPO data
      }
    }

    return ipo;
  }

  public async refreshIpos(): Promise<IpoItem[]> {
    if (this.isFetching) return this.cachedIpos;
    this.isFetching = true;

    try {
      this.logger.log('Performing NSE cookie handshake and fetching real IPOs...');
      await this.ensureNseCookies();

      const [currentRes, upcomingRes, pastRes] = await Promise.allSettled([
        this.fetchNseJson('/api/ipo-current-issue'),
        this.fetchNseJson('/api/all-upcoming-issues?category=ipo'),
        this.fetchNseJson('/api/public-past-issues'),
      ]);

      const nowIST = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
      const items: IpoItem[] = [];
      const seenSymbols = new Set<string>();

      // 1. Process Current Active Issues
      if (currentRes.status === 'fulfilled' && Array.isArray(currentRes.value)) {
        for (const item of currentRes.value) {
          const sym = item.symbol?.trim();
          if (!sym || seenSymbols.has(sym)) continue;
          seenSymbols.add(sym);

          const openDate = this.parseNseDate(item.issueStartDate);
          const closeDate = this.parseNseDate(item.issueEndDate);
          const subRate = Number(item.noOfTime) || 1.0;
          const isSme = item.series === 'SME' || item.securityType === 'SME';

          // Fetch detail for price and lot size
          let priceBand = 'Discovering';
          let minPrice = 100;
          let maxPrice = 100;
          let lotSize = isSme ? 1200 : 30;
          let breakdown: any = undefined;

          try {
            const detail = await this.fetchNseJson(`/api/ipo-detail?symbol=${encodeURIComponent(sym)}`);
            if (detail) {
              if (detail.demandDataNSE && detail.demandDataNSE.length > 0) {
                const prices = detail.demandDataNSE.map((d: any) => Number(d.price)).filter((p: number) => !isNaN(p));
                if (prices.length > 0) {
                  minPrice = Math.min(...prices);
                  maxPrice = Math.max(...prices);
                  priceBand = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;
                }
              }
              breakdown = this.extractSubscriptionBreakdown(detail);
            }
          } catch (e) {}

          const offeredShares = Number(item.noOfSharesOffered) || 0;
          const issueSizeCr = offeredShares > 0 ? `₹${((offeredShares * maxPrice) / 10000000).toFixed(1)} Cr` : '₹50 Cr - ₹500 Cr';

          items.push({
            id: `IPO_${sym}`,
            symbol: sym,
            companyName: item.companyName || sym,
            category: isSme ? 'SME' : 'MAINLINE',
            priceBand,
            minPrice,
            maxPrice,
            lotSize,
            issueSize: issueSizeCr,
            openDate: openDate.toISOString(),
            closeDate: closeDate.toISOString(),
            gmp: null, // Legal exchange feed does not provide GMP -> hide field
            subscriptionRate: subRate,
            status: 'OPEN',
            about: `${item.companyName} is issuing equity shares on the National Stock Exchange of India (${isSme ? 'NSE Emerge SME' : 'NSE Mainboard'}).`,
            source: 'NSE India Real-Time Feed',
            lastUpdatedIST: nowIST,
            subscriptionBreakdown: breakdown,
          });
        }
      }

      // 2. Process Upcoming Issues
      if (upcomingRes.status === 'fulfilled' && Array.isArray(upcomingRes.value)) {
        for (const item of upcomingRes.value) {
          const sym = (item.symbol || item.companyName || '').trim();
          if (!sym || seenSymbols.has(sym)) continue;
          seenSymbols.add(sym);

          const openDate = this.parseNseDate(item.issueStartDate || item.openDate);
          const closeDate = this.parseNseDate(item.issueEndDate || item.closeDate);
          const isSme = item.series === 'SME' || item.securityType === 'SME';

          items.push({
            id: `IPO_${sym}`,
            symbol: sym,
            companyName: item.companyName || sym,
            category: isSme ? 'SME' : 'MAINLINE',
            priceBand: item.priceRange || item.priceBand || 'Price Band Announced Soon',
            minPrice: 100,
            maxPrice: 150,
            lotSize: isSme ? 1200 : 30,
            issueSize: item.issueSize || 'Announcing Soon',
            openDate: openDate.toISOString(),
            closeDate: closeDate.toISOString(),
            gmp: null,
            subscriptionRate: 0,
            status: 'UPCOMING',
            about: `Upcoming initial public offering by ${item.companyName} on NSE.`,
            source: 'NSE India Real-Time Feed',
            lastUpdatedIST: nowIST,
          });
        }
      }

      // 3. Process Past / Listed Issues
      if (pastRes.status === 'fulfilled' && Array.isArray(pastRes.value)) {
        // Take top 30 most recent past issues
        const slice = pastRes.value.slice(0, 30);
        for (const item of slice) {
          const sym = item.symbol?.trim();
          if (!sym || seenSymbols.has(sym)) continue;
          seenSymbols.add(sym);

          const openDate = this.parseNseDate(item.ipoStartDate);
          const closeDate = this.parseNseDate(item.ipoEndDate);
          const hasListed = item.listingDate && item.listingDate !== '-';
          const listingDate = hasListed ? this.parseNseDate(item.listingDate).toISOString() : undefined;
          const isSme = item.securityType === 'SME';

          // Extract price band from "Rs.150 to Rs.158"
          let priceBand = item.priceRange || '₹100';
          let minPrice = 100;
          let maxPrice = 100;
          const match = item.priceRange?.match(/\d+/g);
          if (match && match.length >= 2) {
            minPrice = Number(match[0]);
            maxPrice = Number(match[1]);
            priceBand = `₹${minPrice} - ₹${maxPrice}`;
          } else if (match && match.length === 1) {
            minPrice = maxPrice = Number(match[0]);
            priceBand = `₹${minPrice}`;
          }

          items.push({
            id: `IPO_${sym}`,
            symbol: sym,
            companyName: item.companyName || item.company || sym,
            category: isSme ? 'SME' : 'MAINLINE',
            priceBand,
            minPrice,
            maxPrice,
            lotSize: isSme ? 1000 : 30,
            issueSize: isSme ? '₹20 Cr - ₹80 Cr' : '₹500 Cr - ₹3,000 Cr',
            openDate: openDate.toISOString(),
            closeDate: closeDate.toISOString(),
            listingDate,
            gmp: null,
            subscriptionRate: 1.0,
            status: hasListed ? 'LISTED' : 'CLOSED',
            about: `${item.companyName} public offering closed on ${item.ipoEndDate} on the National Stock Exchange.`,
            source: 'NSE India Real-Time Feed',
            lastUpdatedIST: nowIST,
          });
        }
      }

      if (items.length > 0) {
        this.cachedIpos = items;
        this.lastFetchedAt = Date.now();
        this.logger.log(`Successfully synced ${items.length} real IPOs from NSE India.`);
      }

      return this.cachedIpos;
    } catch (err: any) {
      this.logger.error(`Error refreshing IPOs from NSE: ${err?.message}`);
      if (this.cachedIpos.length === 0) {
        throw new Error(`Failed to fetch real IPO data from NSE: ${err?.message || 'Exchange feed unavailable'}`);
      }
      return this.cachedIpos;
    } finally {
      this.isFetching = false;
    }
  }

  private extractSubscriptionBreakdown(detail: any): { qib: string; nii: string; retail: string; total: string } {
    let qib = '0.00x';
    let nii = '0.00x';
    let retail = '0.00x';
    let total = '1.00x';

    if (Array.isArray(detail?.bidDetails)) {
      for (const b of detail.bidDetails) {
        const cat = (b.category || '').toLowerCase();
        const times = b.noOfTime ? `${Number(b.noOfTime).toFixed(2)}x` : '0.00x';
        if (cat.includes('qualified institutional')) qib = times;
        else if (cat.includes('non institutional')) nii = times;
        else if (cat.includes('retail')) retail = times;
        else if (cat === 'total') total = times;
      }
    }

    return { qib, nii, retail, total };
  }

  private enrichIpoWithDetail(ipo: IpoItem, detail: any): IpoItem {
    const breakdown = this.extractSubscriptionBreakdown(detail);
    return {
      ...ipo,
      subscriptionBreakdown: breakdown,
      subscriptionRate: Number(parseFloat(breakdown.total)) || ipo.subscriptionRate,
    };
  }

  // Parse NSE date format e.g. "04-Nov-2026", "30-OCT-2026", "2026-11-04"
  private parseNseDate(str: string | undefined): Date {
    if (!str || str === '-') return new Date();
    try {
      const parts = str.trim().split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const monthStr = parts[1].toUpperCase();
        const year = parseInt(parts[2], 10);
        const months: Record<string, number> = {
          'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
          'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11,
        };
        const month = months[monthStr.slice(0, 3)] ?? 0;
        return new Date(Date.UTC(year, month, day, 10, 0, 0));
      }
      return new Date(str);
    } catch {
      return new Date();
    }
  }

  // Handshake session cookie with NSE
  private async ensureNseCookies(): Promise<string> {
    return this.centralApi.execute(
      { apiName: 'ipo.cookies', url: 'https://www.nseindia.com/', isUpstream: true },
      async () => {
        return new Promise((resolve, reject) => {
          const req = https.request(
            {
              hostname: 'www.nseindia.com',
              path: '/',
              method: 'GET',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
              },
            },
            (res) => {
              const setCookies = res.headers['set-cookie'] || [];
              if (setCookies.length > 0) {
                this.cookieJar = setCookies.map((c) => c.split(';')[0]).join('; ');
              }
              res.on('data', () => {});
              res.on('end', () => resolve(this.cookieJar));
            },
          );
          req.on('error', reject);
          req.setTimeout(8000, () => {
            req.destroy();
            reject(new Error('ETIMEDOUT: Timeout establishing NSE cookie handshake'));
          });
          req.end();
        });
      },
    );
  }

  private async fetchNseJson(path: string): Promise<any> {
    const subName = path.includes('current')
      ? 'ipo.current'
      : path.includes('upcoming')
      ? 'ipo.upcoming'
      : path.includes('past')
      ? 'ipo.past'
      : 'ipo.detail';
    const url = `https://www.nseindia.com${path}`;

    return this.centralApi.execute({ apiName: subName, url, isUpstream: true }, async () => {
      return new Promise((resolve, reject) => {
        const headers: Record<string, string> = {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.nseindia.com/market-data/all-upcoming-issues-ipo',
        };
        if (this.cookieJar) {
          headers['Cookie'] = this.cookieJar;
        }

        const req = https.request(
          {
            hostname: 'www.nseindia.com',
            path,
            method: 'GET',
            headers,
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const parsed = JSON.parse(data);
                  resolve(parsed);
                } catch (e) {
                  reject(new Error(`Failed to parse NSE JSON from ${path}`));
                }
              } else {
                reject(new Error(`NSE endpoint ${path} returned status HTTP ${res.statusCode}`));
              }
            });
          },
        );

        req.on('error', reject);
        req.setTimeout(8000, () => {
          req.destroy();
          reject(new Error(`ETIMEDOUT: Timeout fetching ${path} from NSE`));
        });
        req.end();
      });
    });
  }
}

