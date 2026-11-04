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
    const dbIndices = await this.prisma.currencyPair.findMany({
      where: { category: 'INDICES', active: true },
    });

    let quotes = this.upstoxBroker.getAllQuotes();
    if (quotes.length === 0) {
      quotes = await this.upstoxBroker.syncQuotesFromYahoo();
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
      const price = live?.bid ?? found.currentBid;
      const changePct = live?.change24h ?? found.change24h;
      const isPositive = changePct >= 0;

      let prevClose = live?.close24h;
      if (!prevClose || prevClose <= 0) {
        prevClose = changePct !== 0 ? Number((price / (1 + changePct / 100)).toFixed(2)) : found.open24h || price;
      }

      const changeAmount = live?.changeAmount ?? Number((price - prevClose).toFixed(2));

      return {
        symbol: sym,
        displayName: found.displayName || sym,
        price,
        change: changeAmount,
        changePercent: Number(changePct.toFixed(2)),
        high: live?.high24h ?? found.high24h,
        low: live?.low24h ?? found.low24h,
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

    const pairs = await this.prisma.currencyPair.findMany({
      where,
      orderBy: { symbol: 'asc' },
    });

    let quotes = this.upstoxBroker.getAllQuotes();
    if (quotes.length === 0) {
      quotes = await this.upstoxBroker.syncQuotesFromYahoo();
    }
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

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

  public getStatusData() {
    const market = this.upstoxBroker.isMarketOpen();
    return {
      isOpen: market.isOpen,
      status: market.status,
      dataFeed: 'LIVE',
      timing: market.timing || '9:15 AM – 3:30 PM IST (Mon–Fri)',
      currentIST: market.currentIST || this.centralApi.getISTTimeOnly(),
      message: market.message,
    };
  }

  public async getIpoData(status?: string) {
    const res = await this.nseIpoService.getIpos(status);
    return res;
  }

  // --- API ROUTES WITH STRICT CENTRAL WRAPPER ---

  @Get('indices')
  async getIndices(@Req() req: any, @Res() res: any) {
    return this.centralApi.wrapRoute(res, 'indices', req?.originalUrl || '/api/indices', async () => {
      return this.getIndicesData();
    });
  }

  @Get('quotes')
  async getQuotes(@Req() req: any, @Res() res: any) {
    return this.centralApi.wrapRoute(res, 'quotes', req?.originalUrl || '/api/quotes', async () => {
      return this.getQuotesData();
    });
  }

  @Get('pairs')
  async getPairs(@Query('category') category: string, @Req() req: any, @Res() res: any) {
    return this.centralApi.wrapRoute(res, 'pairs', req?.originalUrl || '/api/pairs', async () => {
      return this.getPairsData(category);
    });
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
    return this.centralApi.wrapRoute(res, 'candles', req?.originalUrl || `/api/candles?symbol=${symbol}&interval=${tf}`, async () => {
      return this.getCandlesData(symbol, tf);
    });
  }

  @Get('status')
  async getStatus(@Req() req: any, @Res() res: any) {
    return this.centralApi.wrapRoute(res, 'status', req?.originalUrl || '/api/status', async () => {
      return this.getStatusData();
    });
  }

  @Get('ipo')
  async getIpo(@Query('status') status: string, @Req() req: any, @Res() res: any) {
    return this.centralApi.wrapRoute(res, 'ipo', req?.originalUrl || '/api/ipo', async () => {
      return this.getIpoData(status);
    });
  }

  @Get('ipos')
  async getIposAlias(@Query('status') status: string, @Req() req: any, @Res() res: any) {
    return this.centralApi.wrapRoute(res, 'ipo', req?.originalUrl || '/api/ipos', async () => {
      return this.getIpoData(status);
    });
  }

  @Get('health')
  getHealth(@Res() res: any) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const health = this.centralApi.getHealthSummary();
    return res.status(200).json({
      ok: true,
      api: 'health',
      data: health,
      serverTime: this.centralApi.getISTString(),
    });
  }
}
