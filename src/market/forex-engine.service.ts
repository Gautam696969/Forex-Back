import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { EventEmitter } from 'events';
import { UpstoxBrokerService, CandleBar, LiveQuote } from './upstox-broker.service.js';

export type { CandleBar };

export interface PairTick {
  symbol: string;
  bid: number;
  ask: number;
  digits: number;
  spreadPips: number;
  change24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

@Injectable()
export class ForexEngineService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private dbSaveInterval: NodeJS.Timeout | null = null;

  // In-memory cache of current live quotes
  private liveQuotes: Map<string, PairTick> = new Map();

  // Pair metadata from database
  private pairMeta: Map<string, any> = new Map();

  constructor(
    private prisma: PrismaService,
    private upstoxBroker: UpstoxBrokerService,
  ) {
    super();
    this.setMaxListeners(100);
  }

  async onModuleInit() {
    try {
      await this.loadPairsFromDb();
    } catch (err: any) {
      console.warn(`[FOREX ENGINE WARNING] Could not load pairs from DB on startup: ${err?.message}`);
    }

    // Listen to real ticks from Upstox Broker Service
    this.upstoxBroker.on('ticks', (quotes: LiveQuote[]) => {
      const ticks: PairTick[] = [];
      for (const q of quotes) {
        const meta = this.pairMeta.get(q.symbol);
        const tick: PairTick = {
          symbol: q.symbol,
          bid: q.bid,
          ask: q.ask,
          digits: q.digits,
          spreadPips: meta ? meta.defaultSpread : 0.1,
          change24h: q.change24h,
          high24h: q.high24h,
          low24h: q.low24h,
          timestamp: q.timestamp,
        };
        this.liveQuotes.set(q.symbol, tick);
        ticks.push(tick);
      }
      this.emit('ticks', ticks);
    });

    // Listen to live bar updates for real-time chart candles
    this.upstoxBroker.on('bar_tick', (data: { symbol: string; timeframe: string; bar: CandleBar }) => {
      this.emit('new_bar', data);
    });

    // Sync initial quotes from Upstox
    const initialQuotes = this.upstoxBroker.getAllQuotes();
    for (const q of initialQuotes) {
      const meta = this.pairMeta.get(q.symbol);
      this.liveQuotes.set(q.symbol, {
        symbol: q.symbol,
        bid: q.bid,
        ask: q.ask,
        digits: q.digits,
        spreadPips: meta ? meta.defaultSpread : 0.1,
        change24h: q.change24h,
        high24h: q.high24h,
        low24h: q.low24h,
        timestamp: q.timestamp,
      });
    }

    // Persist real market prices to DB every 10 seconds
    this.dbSaveInterval = setInterval(() => {
      this.persistQuotesToDb();
    }, 10000);
  }

  onModuleDestroy() {
    if (this.dbSaveInterval) clearInterval(this.dbSaveInterval);
  }

  public isMarketOpen(category: 'EQUITIES' | 'COMMODITIES' = 'EQUITIES') {
    return this.upstoxBroker.isMarketOpen(category);
  }

  private async loadPairsFromDb() {
    const pairs = await this.prisma.currencyPair.findMany({
      where: { active: true },
    });

    for (const pair of pairs) {
      this.pairMeta.set(pair.symbol, pair);
      this.liveQuotes.set(pair.symbol, {
        symbol: pair.symbol,
        bid: pair.currentBid,
        ask: pair.currentAsk,
        digits: pair.digits,
        spreadPips: pair.defaultSpread,
        change24h: pair.change24h,
        high24h: pair.high24h,
        low24h: pair.low24h,
        timestamp: Date.now(),
      });
    }
  }

  private async persistQuotesToDb() {
    try {
      for (const [symbol, quote] of this.liveQuotes.entries()) {
        await this.prisma.currencyPair
          .update({
            where: { symbol },
            data: {
              currentBid: quote.bid,
              currentAsk: quote.ask,
              high24h: quote.high24h,
              low24h: quote.low24h,
              change24h: quote.change24h,
            },
          })
          .catch(() => {});
      }
    } catch {}
  }

  // Public Getters (Zero Mock Data)
  public getAllQuotes(): PairTick[] {
    return Array.from(this.liveQuotes.values());
  }

  public getQuote(symbol: string): PairTick | undefined {
    return this.liveQuotes.get(symbol);
  }

  public async getCandleHistory(symbol: string, timeframe: string = '1m'): Promise<CandleBar[]> {
    const result = await this.upstoxBroker.getCandles(symbol, timeframe);
    return result.candles;
  }

  public getPairMeta(symbol: string): any {
    return this.pairMeta.get(symbol);
  }

  public updatePairSpread(symbol: string, newSpread: number) {
    const meta = this.pairMeta.get(symbol);
    if (meta) {
      meta.defaultSpread = newSpread;
      const quote = this.liveQuotes.get(symbol);
      if (quote) {
        quote.spreadPips = newSpread;
        quote.ask = Number((quote.bid + newSpread * meta.pipSize).toFixed(meta.digits));
      }
    }
  }
}
