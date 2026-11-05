import { Controller, Get, Query, Req, Res, OnModuleInit } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService, LiveQuote } from './upstox-broker.service.js';
import { NseIpoService } from './nse-ipo.service.js';
import { CentralApiService } from './central-api.service.js';
import { PrismaService } from '../prisma.service.js';

@Controller('api')
export class ApiController implements OnModuleInit {
  constructor(
    private centralApi: CentralApiService,
    private forexEngine: ForexEngineService,
    private upstoxBroker: UpstoxBrokerService,
    private nseIpoService: NseIpoService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Register self-test runners for RULE 1 startup & recurring checks
    this.centralApi.registerTestHandler('indices', () => this.getIndicesData());
    this.centralApi.registerTestHandler('quotes', () => this.getQuotesData());
    this.centralApi.registerTestHandler('pairs', () => this.getPairsData());
    this.centralApi.registerTestHandler('candles', () => this.getCandlesData('NIFTY 50', '1m'));
    this.centralApi.registerTestHandler('status', async () => this.getStatusData());
    this.centralApi.registerTestHandler('ipo', () => this.getIpoData());
  }

  // --- DATA EXTRACTORS ---

  public async getIndicesData() {
    const targetIndices = ['NIFTY 50', 'SENSEX', 'BANK NIFTY', 'NIFTY IT'];
    let dbIndices: any[] = [];
    try {
      dbIndices = await this.prisma.currencyPair.findMany({
        where: { category: 'INDICES', active: true },
      });
    } catch (dbErr: any) {
      console.warn(`[INDICES WARNING] Database unavailable: ${dbErr?.message || dbErr}`);
    }

    let quotes: LiveQuote[] = [];
    try {
      quotes = this.upstoxBroker.getAllQuotes();
      if (quotes.length === 0) {
        quotes = await this.upstoxBroker.syncQuotesFromYahoo();
      }
    } catch (feedErr: any) {
      console.warn(`[INDICES WARNING] Upstream quote feed failed: ${feedErr?.message || feedErr}`);
    }
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    const results = targetIndices.map((sym) => {
      const found = dbIndices.find((d) => d.symbol === sym) || {
        symbol: sym,
        displayName: sym,
        currentBid: 0,
        open24h: 0,
        change24h: 0,
        high24h: 0,
        low24h: 0,
        digits: 2,
      };

      const live = quoteMap.get(sym);
      const price = live?.bid ?? found.currentBid ?? 0;
      const changePct = live?.change24h ?? found.change24h ?? 0;
      const isPositive = changePct >= 0;

      let prevClose = live?.close24h;
      if (!prevClose || prevClose <= 0) {
        prevClose = changePct !== 0 ? Number((price / (1 + changePct / 100)).toFixed(2)) : found.open24h || price;
      }

      const validPrevClose = prevClose || price || 1;
      const changeAmount = live?.changeAmount ?? Number((price - validPrevClose).toFixed(2));

      return {
        symbol: sym,
        displayName: found.displayName || sym,
        price,
        change: changeAmount,
        changePercent: Number(changePct.toFixed(2)),
        high: live?.high24h ?? found.high24h ?? price,
        low: live?.low24h ?? found.low24h ?? price,
        prevClose,
        isPositive,
        digits: found.digits || 2,
        lastUpdatedIST: this.centralApi.getISTTimeOnly(),
      };
    });

    return results;
  }

  public async getQuotesData() {
    let quotes = this.upstoxBroker.getAllQuotes();
    if (quotes.length === 0) {
      quotes = await this.upstoxBroker.syncQuotesFromYahoo();
    }

    if (quotes.length === 0) {
      throw new Error('No live quote data available from exchange feeds');
    }

    return quotes.map((q) => ({
      symbol: q.symbol,
      price: q.bid,
      bid: q.bid,
      ask: q.ask,
      change: q.changeAmount,
      changePercent: q.change24h,
      open: q.open24h,
      high: q.high24h,
      low: q.low24h,
      prevClose: q.close24h,
      volume: q.volume24h,
      lastUpdatedIST: q.lastUpdatedIST || this.centralApi.getISTTimeOnly(),
      category: q.category,
    }));
  }

  public async getPairsData(category?: string) {
    const where: any = { active: true };
    if (category && category !== 'ALL') {
      where.category = category;
    }

    let pairs: any[] = [];
    try {
      pairs = await this.prisma.currencyPair.findMany({
        where,
        orderBy: { symbol: 'asc' },
      });
    } catch (dbErr: any) {
      console.warn(`[PAIRS WARNING] Database unavailable: ${dbErr?.message || dbErr}. Falling back to quote feed.`);
    }

    let quotes: LiveQuote[] = [];
    try {
      quotes = this.upstoxBroker.getAllQuotes();
      if (quotes.length === 0) {
        quotes = await this.upstoxBroker.syncQuotesFromYahoo();
      }
    } catch (feedErr: any) {
      console.warn(`[PAIRS WARNING] Upstream quote feed failed: ${feedErr?.message || feedErr}`);
    }
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    // If DB is down, fall back to quote feed catalog to avoid downtime
    if (pairs.length === 0 && quotes.length > 0) {
      return quotes
        .filter((q) => !category || category === 'ALL' || q.category === category)
        .map((q) => ({
          id: `fallback-${q.symbol}`,
          symbol: q.symbol,
          displayName: q.symbol,
          category: q.category || 'EQUITIES',
          price: q.bid,
          currentBid: q.bid,
          currentAsk: q.ask,
          change24h: q.change24h,
          high24h: q.high24h,
          low24h: q.low24h,
          volume24h: q.volume24h || 0,
          digits: q.digits || 2,
          active: true,
          lastUpdatedIST: this.centralApi.getISTTimeOnly(),
        }));
    }

    return pairs.map((pair) => {
      const live = quoteMap.get(pair.symbol);
      const ltp = live?.bid ?? pair.currentBid;
      const changePct = live?.change24h ?? pair.change24h;
      return {
        ...pair,
        price: ltp,
        currentBid: ltp,
        currentAsk: live?.ask ?? pair.currentAsk,
        change24h: changePct,
        high24h: live?.high24h ?? pair.high24h,
        low24h: live?.low24h ?? pair.low24h,
        volume24h: live?.volume24h ?? 0,
        lastUpdatedIST: this.centralApi.getISTTimeOnly(),
      };
    });
  }

  public async getCandlesData(symbol: string = 'NIFTY 50', interval: string = '1m') {
    return this.upstoxBroker.getCandles(symbol, interval);
  }

  /**
   * Safe & Cheap Market Status Check
   * - Market OPEN/CLOSED computed from IST clock (Mon-Fri 9:15-15:30)
   * - Safe check of dataFeed status (returns UNKNOWN if feed fails)
   * - Safe check of database connection (returns UNKNOWN if DB fails)
   * - Never crashes even if DB or upstream API is down
   */
  public async getStatusData() {
    // 1. Pure time-based computation for NSE/BSE Equities (Mon-Fri 9:15 - 15:30 IST)
    const now = new Date();
    const istTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
    const istParts = istTimeStr.split(':').map(Number);
    const hours = istParts[0] || 0;
    const minutes = istParts[1] || 0;
    const totalMinutes = hours * 60 + minutes;

    const istDayStr = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });
    const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(istDayStr);

    const nseOpen = 9 * 60 + 15; // 9:15 AM IST
    const nseClose = 15 * 60 + 30; // 3:30 PM IST
    const isOpen = isWeekday && totalMinutes >= nseOpen && totalMinutes <= nseClose;
    const status: 'OPEN' | 'CLOSED' = isOpen ? 'OPEN' : 'CLOSED';

    // 2. Safe check of data feed status
    let dataFeed = 'LIVE';
    try {
      if (this.upstoxBroker) {
        const feedInfo = this.upstoxBroker.getHealthInfo?.();
        if (feedInfo?.status === 'offline') {
          dataFeed = 'UNKNOWN';
        } else if (feedInfo?.status === 'degraded' || feedInfo?.status === 'stale') {
          dataFeed = 'DEGRADED';
        } else {
          dataFeed = 'LIVE';
        }
      } else {
        dataFeed = 'UNKNOWN';
        console.warn('[STATUS WARNING] upstoxBroker service reference is unavailable');
      }
    } catch (feedErr: any) {
      dataFeed = 'UNKNOWN';
      console.warn(`[STATUS WARNING] Data feed check failed: ${feedErr?.message || feedErr}`);
    }

    // 3. Safe check of database status without blocking or crashing
    let database = 'CONNECTED';
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database ping timeout (1000ms)')), 1000)),
      ]);
    } catch (dbErr: any) {
      database = 'UNKNOWN';
      console.warn(`[STATUS WARNING] Database check failed: ${dbErr?.message || dbErr}`);
    }

    return {
      isOpen,
      status,
      dataFeed,
      database,
      timing: '9:15 AM – 3:30 PM IST (Mon–Fri)',
      currentIST: `${istTimeStr} IST`,
      message: isOpen ? 'Market is Open (Live NSE/BSE)' : 'Market Closed (9:15 AM – 3:30 PM IST)',
    };
  }

  public async getIpoData(status?: string) {
    const res = await this.nseIpoService.getIpos(status);
    return res;
  }

  // --- API ROUTES WITH STRICT CENTRAL WRAPPER & TRY/CATCH ---

  @Get('indices')
  async getIndices(@Req() req: any, @Res() res: any) {
    try {
      return await this.centralApi.wrapRoute(res, 'indices', req?.originalUrl || '/api/indices', async () => {
        return this.getIndicesData();
      });
    } catch (err: any) {
      const timeIST = this.centralApi.getISTString();
      const reason = err?.message || String(err);
      console.error(`\x1b[31m[API FAILED] api=indices ${timeIST} reason=${reason}\x1b[0m`);
      if (err?.stack) console.error(err.stack);
      return res.status(500).json({ ok: false, api: 'indices', error: reason });
    }
  }

  @Get('quotes')
  async getQuotes(@Req() req: any, @Res() res: any) {
    try {
      return await this.centralApi.wrapRoute(res, 'quotes', req?.originalUrl || '/api/quotes', async () => {
        return this.getQuotesData();
      });
    } catch (err: any) {
      const timeIST = this.centralApi.getISTString();
      const reason = err?.message || String(err);
      console.error(`\x1b[31m[API FAILED] api=quotes ${timeIST} reason=${reason}\x1b[0m`);
      if (err?.stack) console.error(err.stack);
      return res.status(500).json({ ok: false, api: 'quotes', error: reason });
    }
  }

  @Get('pairs')
  async getPairs(@Query('category') category: string, @Req() req: any, @Res() res: any) {
    try {
      return await this.centralApi.wrapRoute(res, 'pairs', req?.originalUrl || '/api/pairs', async () => {
        return this.getPairsData(category);
      });
    } catch (err: any) {
      const timeIST = this.centralApi.getISTString();
      const reason = err?.message || String(err);
      console.error(`\x1b[31m[API FAILED] api=pairs ${timeIST} reason=${reason}\x1b[0m`);
      if (err?.stack) console.error(err.stack);
      return res.status(500).json({ ok: false, api: 'pairs', error: reason });
    }
  }

  @Get('candles')
  async getCandles(
    @Query('symbol') symbol: string = 'NIFTY 50',
    @Query('interval') interval?: string,
    @Query('timeframe') timeframe?: string,
    @Req() req?: any,
    @Res() res?: any,
  ) {
    const tf = interval || timeframe || '1m';
    try {
      return await this.centralApi.wrapRoute(res, 'candles', req?.originalUrl || `/api/candles?symbol=${symbol}&interval=${tf}`, async () => {
        return this.getCandlesData(symbol, tf);
      });
    } catch (err: any) {
      const timeIST = this.centralApi.getISTString();
      const reason = err?.message || String(err);
      console.error(`\x1b[31m[API FAILED] api=candles ${timeIST} reason=${reason}\x1b[0m`);
      if (err?.stack) console.error(err.stack);
      return res.status(500).json({ ok: false, api: 'candles', error: reason });
    }
  }

  @Get('status')
  async getStatus(@Req() req: any, @Res() res: any) {
    try {
      return await this.centralApi.wrapRoute(res, 'status', req?.originalUrl || '/api/status', async () => {
        return this.getStatusData();
      });
    } catch (err: any) {
      const timeIST = this.centralApi.getISTString();
      const reason = err?.message || String(err);
      console.error(`\x1b[31m[API FAILED] api=status ${timeIST} reason=${reason}\x1b[0m`);
      if (err?.stack) console.error(err.stack);
      return res.status(500).json({
        ok: false,
        api: 'status',
        error: reason,
      });
    }
  }

  @Get('ipo')
  async getIpo(@Query('status') status: string, @Req() req: any, @Res() res: any) {
    try {
      return await this.centralApi.wrapRoute(res, 'ipo', req?.originalUrl || '/api/ipo', async () => {
        return this.getIpoData(status);
      });
    } catch (err: any) {
      const timeIST = this.centralApi.getISTString();
      const reason = err?.message || String(err);
      console.error(`\x1b[31m[API FAILED] api=ipo ${timeIST} reason=${reason}\x1b[0m`);
      if (err?.stack) console.error(err.stack);
      return res.status(500).json({ ok: false, api: 'ipo', error: reason });
    }
  }

  @Get('ipos')
  async getIposAlias(@Query('status') status: string, @Req() req: any, @Res() res: any) {
    try {
      return await this.centralApi.wrapRoute(res, 'ipo', req?.originalUrl || '/api/ipos', async () => {
        return this.getIpoData(status);
      });
    } catch (err: any) {
      const timeIST = this.centralApi.getISTString();
      const reason = err?.message || String(err);
      console.error(`\x1b[31m[API FAILED] api=ipo ${timeIST} reason=${reason}\x1b[0m`);
      if (err?.stack) console.error(err.stack);
      return res.status(500).json({ ok: false, api: 'ipo', error: reason });
    }
  }

  @Get('health')
  getHealth(@Res() res: any) {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      const health = this.centralApi.getHealthSummary();
      return res.status(200).json({
        ok: true,
        api: 'health',
        data: health,
        serverTime: this.centralApi.getISTString(),
      });
    } catch (err: any) {
      const timeIST = this.centralApi.getISTString();
      const reason = err?.message || String(err);
      console.error(`\x1b[31m[API FAILED] api=health ${timeIST} reason=${reason}\x1b[0m`);
      if (err?.stack) console.error(err.stack);
      return res.status(500).json({ ok: false, api: 'health', error: reason });
    }
  }
}
