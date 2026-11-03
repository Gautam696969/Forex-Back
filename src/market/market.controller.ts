import { Controller, Get, Query } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { PrismaService } from '../prisma.service.js';

@Controller('market')
export class MarketController {
  constructor(
    private forexEngine: ForexEngineService,
    private prisma: PrismaService,
  ) {}

  @Get('pairs')
  async getPairs() {
    const pairs = await this.prisma.currencyPair.findMany({
      orderBy: { symbol: 'asc' },
    });

    const quotes = this.forexEngine.getAllQuotes();
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    return pairs.map((pair) => {
      const live = quoteMap.get(pair.symbol);
      return {
        ...pair,
        currentBid: live ? live.bid : pair.currentBid,
        currentAsk: live ? live.ask : pair.currentAsk,
        change24h: live ? live.change24h : pair.change24h,
        high24h: live ? live.high24h : pair.high24h,
        low24h: live ? live.low24h : pair.low24h,
      };
    });
  }

  @Get('history')
  getHistory(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string = '1m',
  ) {
    if (!symbol) {
      symbol = 'EUR/USD';
    }
    const candles = this.forexEngine.getCandleHistory(symbol, timeframe);
    return {
      symbol,
      timeframe,
      candles,
    };
  }

  @Get('quotes')
  getQuotes() {
    return this.forexEngine.getAllQuotes();
  }
}
