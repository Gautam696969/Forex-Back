import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { EventEmitter } from 'events';

export interface CandleBar {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

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

const EXTERNAL_TICKERS: Record<string, string> = {
  'TATASTEEL/INR': 'TATASTEEL.NS',
  'TATAPOWER/INR': 'TATAPOWER.NS',
  'TCS/INR': 'TCS.NS',
  'TATACONSUM/INR': 'TATACONSUM.NS',
  'TATACOMM/INR': 'TATACOMM.NS',
  'RELIANCE/INR': 'RELIANCE.NS',
  'INFY/INR': 'INFY.NS',
  'AAPL/USD': 'AAPL',
  'NVDA/USD': 'NVDA',
  'TSLA/USD': 'TSLA',
};

@Injectable()
export class ForexEngineService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private updateInterval: NodeJS.Timeout | null = null;
  private dbSaveInterval: NodeJS.Timeout | null = null;
  private realSyncInterval: NodeJS.Timeout | null = null;

  // In-memory cache of current live quotes
  private liveQuotes: Map<string, PairTick> = new Map();

  // In-memory candle bars by symbol and timeframe
  private candleHistory: Map<string, CandleBar[]> = new Map();

  // Pair metadata
  private pairMeta: Map<string, any> = new Map();

  constructor(private prisma: PrismaService) {
    super();
    this.setMaxListeners(50);
  }

  async onModuleInit() {
    await this.loadPairsFromDb();
    this.initializeHistoricalCandles();
    await this.fetchRealStockData();
    this.startSimulationLoop();
  }

  onModuleDestroy() {
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.dbSaveInterval) clearInterval(this.dbSaveInterval);
    if (this.realSyncInterval) clearInterval(this.realSyncInterval);
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

  // Fetch real market prices and real candlestick history from Yahoo Finance
  private async fetchRealStockData() {
    for (const [symbol, ticker] of Object.entries(EXTERNAL_TICKERS)) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=5m&range=1d`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });

        if (!res.ok) continue;

        const data: any = await res.json();
        const result = data?.chart?.result?.[0];
        if (!result) continue;

        const meta = result.meta;
        const realPrice = meta?.regularMarketPrice;
        const changePercent = meta?.regularMarketChangePercent || 0;
        const high = meta?.regularMarketDayHigh || realPrice;
        const low = meta?.regularMarketDayLow || realPrice;

        const quote = this.liveQuotes.get(symbol);
        const pairInfo = this.pairMeta.get(symbol);

        if (quote && realPrice) {
          const spread = pairInfo ? pairInfo.defaultSpread * pairInfo.pipSize : 0.15;
          quote.bid = Number(realPrice.toFixed(quote.digits));
          quote.ask = Number((realPrice + spread).toFixed(quote.digits));
          quote.change24h = Number(changePercent.toFixed(2));
          quote.high24h = Number(high.toFixed(quote.digits));
          quote.low24h = Number(low.toFixed(quote.digits));
          quote.timestamp = Date.now();
        }

        // Parse real historical candlestick bars
        const timestamps: number[] = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0];

        if (timestamps.length > 5 && quotes?.open) {
          const realBars: CandleBar[] = [];
          for (let i = 0; i < timestamps.length; i++) {
            const o = quotes.open[i];
            const h = quotes.high[i];
            const l = quotes.low[i];
            const c = quotes.close[i];
            const v = quotes.volume ? quotes.volume[i] || 100 : 100;

            if (o !== null && h !== null && l !== null && c !== null) {
              realBars.push({
                time: timestamps[i],
                open: Number(o.toFixed(quote?.digits || 2)),
                high: Number(h.toFixed(quote?.digits || 2)),
                low: Number(l.toFixed(quote?.digits || 2)),
                close: Number(c.toFixed(quote?.digits || 2)),
                volume: v,
              });
            }
          }

          if (realBars.length > 0) {
            // Populate real candles into 1m, 5m, 15m, 1h, 1D
            this.candleHistory.set(`${symbol}:1m`, realBars);
            this.candleHistory.set(`${symbol}:5m`, realBars);
            this.candleHistory.set(`${symbol}:15m`, realBars);
            this.candleHistory.set(`${symbol}:1h`, realBars);
            this.candleHistory.set(`${symbol}:1D`, realBars);
          }
        }
      } catch (err: any) {
        // Fallback to simulated prices if network/rate-limit occurs
        console.warn(`[ForexEngine] Using offline simulation for ${symbol}:`, err.message);
      }
    }
  }

  private initializeHistoricalCandles() {
    const timeframes = ['1m', '5m', '15m', '1h', '1D'];
    const tfSeconds: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '1D': 86400,
    };

    const nowSec = Math.floor(Date.now() / 1000);

    for (const [symbol, quote] of this.liveQuotes.entries()) {
      const meta = this.pairMeta.get(symbol);
      const digits = meta ? meta.digits : 5;

      let baseVol = 0.0004;
      if (symbol.includes('BTC')) baseVol = 150;
      else if (symbol.includes('XAU')) baseVol = 8;
      else if (symbol.includes('/INR') || symbol.includes('AAPL') || symbol.includes('NVDA') || symbol.includes('TSLA')) {
        baseVol = Math.max(0.2, quote.bid * 0.0015);
      }

      for (const tf of timeframes) {
        const interval = tfSeconds[tf];
        const bars: CandleBar[] = [];
        let price = quote.bid;

        // Build 120 historical candles backwards
        const count = 120;
        const prices: number[] = [price];
        for (let i = 0; i < count; i++) {
          const step = (Math.random() - 0.495) * baseVol * Math.sqrt(interval / 60);
          price = Math.max(price * 0.5, price + step);
          prices.unshift(price);
        }

        for (let i = 0; i < count; i++) {
          const barTime = nowSec - (count - i) * interval;
          const pOpen = prices[i];
          const pClose = prices[i + 1] || pOpen;
          const swing = Math.abs(pClose - pOpen) + Math.random() * baseVol * 0.5;
          const pHigh = Math.max(pOpen, pClose) + swing * Math.random();
          const pLow = Math.min(pOpen, pClose) - swing * Math.random();
          const volume = Math.floor(Math.random() * 500 + 50);

          bars.push({
            time: Math.floor(barTime / interval) * interval,
            open: Number(pOpen.toFixed(digits)),
            high: Number(pHigh.toFixed(digits)),
            low: Number(pLow.toFixed(digits)),
            close: Number(pClose.toFixed(digits)),
            volume,
          });
        }

        if (bars.length > 0) {
          const lastBar = bars[bars.length - 1];
          lastBar.close = quote.bid;
          lastBar.high = Math.max(lastBar.high, quote.bid);
          lastBar.low = Math.min(lastBar.low, quote.bid);
        }

        this.candleHistory.set(`${symbol}:${tf}`, bars);
      }
    }
  }

  private startSimulationLoop() {
    // Generate live tick every 500ms
    this.updateInterval = setInterval(() => {
      this.generateTicks();
    }, 500);

    // Periodically sync real market prices from Yahoo Finance every 20 seconds
    this.realSyncInterval = setInterval(async () => {
      await this.fetchRealStockData();
    }, 20000);

    // Persist latest pair prices to DB every 10 seconds
    this.dbSaveInterval = setInterval(() => {
      this.persistQuotesToDb();
    }, 10000);
  }

  private generateTicks() {
    const updatedTicks: PairTick[] = [];
    const nowSec = Math.floor(Date.now() / 1000);

    for (const [symbol, quote] of this.liveQuotes.entries()) {
      const meta = this.pairMeta.get(symbol);
      if (!meta) continue;

      const digits = meta.digits;
      const pipSize = meta.pipSize;
      const spread = meta.defaultSpread;

      // Realistic tick delta calculation adjusted for asset type and price magnitude
      let volatility = pipSize * 0.8;
      if (symbol.includes('BTC')) volatility = 12;
      else if (symbol.includes('XAU')) volatility = 0.35;
      else if (symbol.includes('/INR') || meta.category === 'STOCKS') {
        // Dynamic stock tick volatility based on real share price
        volatility = Math.max(0.05, quote.bid * 0.0004);
      }

      const delta = (Math.random() - 0.498) * volatility;
      let newBid = quote.bid + delta;
      newBid = Math.max(newBid, pipSize * 10);
      const spreadAmount = spread * pipSize;
      const newAsk = newBid + spreadAmount;

      quote.bid = Number(newBid.toFixed(digits));
      quote.ask = Number(newAsk.toFixed(digits));
      quote.high24h = Number(Math.max(quote.high24h, newBid).toFixed(digits));
      quote.low24h = Number(Math.min(quote.low24h, newBid).toFixed(digits));
      quote.timestamp = Date.now();

      updatedTicks.push(quote);

      // Update current live candle bar across timeframes
      this.updateLiveBar(symbol, '1m', 60, nowSec, quote.bid, digits);
      this.updateLiveBar(symbol, '5m', 300, nowSec, quote.bid, digits);
      this.updateLiveBar(symbol, '15m', 900, nowSec, quote.bid, digits);
      this.updateLiveBar(symbol, '1h', 3600, nowSec, quote.bid, digits);
      this.updateLiveBar(symbol, '1D', 86400, nowSec, quote.bid, digits);
    }

    // Emit event for Gateway and Trading Service
    this.emit('ticks', updatedTicks);
  }

  private updateLiveBar(
    symbol: string,
    timeframe: string,
    intervalSec: number,
    nowSec: number,
    price: number,
    digits: number,
  ) {
    const key = `${symbol}:${timeframe}`;
    const bars = this.candleHistory.get(key);
    if (!bars || bars.length === 0) return;

    const currentBarTime = Math.floor(nowSec / intervalSec) * intervalSec;
    const lastBar = bars[bars.length - 1];

    if (lastBar.time === currentBarTime) {
      lastBar.close = price;
      lastBar.high = Number(Math.max(lastBar.high, price).toFixed(digits));
      lastBar.low = Number(Math.min(lastBar.low, price).toFixed(digits));
      lastBar.volume += 1;
    } else if (currentBarTime > lastBar.time) {
      const newBar: CandleBar = {
        time: currentBarTime,
        open: lastBar.close,
        high: Math.max(lastBar.close, price),
        low: Math.min(lastBar.close, price),
        close: price,
        volume: 1,
      };
      bars.push(newBar);
      if (bars.length > 300) {
        bars.shift();
      }

      this.emit('new_bar', { symbol, timeframe, bar: newBar });
    }
  }

  private async persistQuotesToDb() {
    try {
      for (const [symbol, quote] of this.liveQuotes.entries()) {
        await this.prisma.currencyPair.update({
          where: { symbol },
          data: {
            currentBid: quote.bid,
            currentAsk: quote.ask,
            high24h: quote.high24h,
            low24h: quote.low24h,
            change24h: quote.change24h,
          },
        }).catch(() => {});
      }
    } catch {}
  }

  // Public Getters
  public getAllQuotes(): PairTick[] {
    return Array.from(this.liveQuotes.values());
  }

  public getQuote(symbol: string): PairTick | undefined {
    return this.liveQuotes.get(symbol);
  }

  public getCandleHistory(symbol: string, timeframe: string = '1m'): CandleBar[] {
    const key = `${symbol}:${timeframe}`;
    return this.candleHistory.get(key) || [];
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
