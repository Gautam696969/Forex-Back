import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService } from './upstox-broker.service.js';
import { PrismaService } from '../prisma.service.js';

@Controller('api')
export class ApiController {
  private readonly logger = new Logger(ApiController.name);

  constructor(
    private forexEngine: ForexEngineService,
    private upstoxBroker: UpstoxBrokerService,
    private prisma: PrismaService,
  ) {}

  @Get('indices')
  async getIndices(@Res() res: any) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    try {
      const targetIndices = ['NIFTY 50', 'SENSEX', 'BANK NIFTY', 'NIFTY IT'];
      const dbIndices = await this.prisma.currencyPair.findMany({
        where: { category: 'INDICES', active: true },
      });

      const quotes = this.forexEngine.getAllQuotes();
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

        const upstoxQuote = this.upstoxBroker.getQuote(sym);
        const live = quoteMap.get(sym);
        const price = upstoxQuote?.bid ?? (live ? live.bid : found.currentBid);
        const changePct = upstoxQuote?.change24h ?? (live ? live.change24h : found.change24h);
        const isPositive = changePct >= 0;
        
        let prevClose = upstoxQuote?.close24h;
        if (!prevClose || prevClose <= 0) {
          prevClose = changePct !== 0 ? Number((price / (1 + changePct / 100)).toFixed(2)) : (found.open24h || price);
        }
        
        const changeAmount = upstoxQuote?.changeAmount ?? Number((price - prevClose).toFixed(2));

        return {
          symbol: sym,
          displayName: found.displayName || sym,
          price,
          change: changeAmount,
          changePercent: Number(changePct.toFixed(2)),
          high: upstoxQuote?.high24h ?? (live ? live.high24h : found.high24h),
          low: upstoxQuote?.low24h ?? (live ? live.low24h : found.low24h),
          prevClose,
          isPositive,
          digits: found.digits || 2,
          lastUpdatedIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST',
        };
      });

      return res.status(200).json(results);
    } catch (err: any) {
      this.logger.error(`[API Failure] GET /api/indices failed: ${err.message}`, err.stack);
      console.error(`[API Failure] GET /api/indices error:`, err);
      return res.status(500).json({ error: 'Failed to fetch indices data', message: err.message });
    }
  }

  @Get('candles')
  async getCandles(
    @Query('symbol') symbol: string = 'NIFTY 50',
    @Query('interval') interval?: string,
    @Query('timeframe') timeframe?: string,
    @Res() res?: any,
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const tf = interval || timeframe || '1m';

    try {
      const data = await this.upstoxBroker.getCandles(symbol, tf);
      if (!data || !data.candles || data.candles.length === 0) {
        throw new Error(`Candle data unavailable for ${symbol} (${tf})`);
      }
      return res.status(200).json({
        symbol: data.symbol,
        interval: tf,
        timeframe: tf,
        candles: data.candles,
        lastUpdated: data.lastUpdated,
        lastCandle: data.candles[data.candles.length - 1],
      });
    } catch (err: any) {
      this.logger.error(`[API Failure] GET /api/candles (${symbol}, ${tf}) failed: ${err.message}`);
      console.error(`[API Failure] GET /api/candles (${symbol}, ${tf}) error:`, err);
      return res.status(500).json({
        error: 'Failed to fetch candle feed',
        symbol,
        interval: tf,
        message: err.message,
      });
    }
  }

  @Get('status')
  getStatus(@Res() res: any) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json(this.upstoxBroker.isMarketOpen());
  }
}

