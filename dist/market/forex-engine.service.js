var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { EventEmitter } from 'events';
import { UpstoxBrokerService } from './upstox-broker.service.js';
let ForexEngineService = class ForexEngineService extends EventEmitter {
    prisma;
    upstoxBroker;
    dbSaveInterval = null;
    liveQuotes = new Map();
    pairMeta = new Map();
    constructor(prisma, upstoxBroker) {
        super();
        this.prisma = prisma;
        this.upstoxBroker = upstoxBroker;
        this.setMaxListeners(100);
    }
    async onModuleInit() {
        try {
            await this.loadPairsFromDb();
        }
        catch (err) {
            console.warn(`[FOREX ENGINE WARNING] Could not load pairs from DB on startup: ${err?.message}`);
        }
        this.upstoxBroker.on('ticks', (quotes) => {
            const ticks = [];
            for (const q of quotes) {
                const meta = this.pairMeta.get(q.symbol);
                const tick = {
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
        this.upstoxBroker.on('bar_tick', (data) => {
            this.emit('new_bar', data);
        });
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
        this.dbSaveInterval = setInterval(() => {
            this.persistQuotesToDb();
        }, 10000);
    }
    onModuleDestroy() {
        if (this.dbSaveInterval)
            clearInterval(this.dbSaveInterval);
    }
    isMarketOpen(category = 'EQUITIES') {
        return this.upstoxBroker.isMarketOpen(category);
    }
    async loadPairsFromDb() {
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
    async persistQuotesToDb() {
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
                    .catch(() => { });
            }
        }
        catch { }
    }
    getAllQuotes() {
        return Array.from(this.liveQuotes.values());
    }
    getQuote(symbol) {
        return this.liveQuotes.get(symbol);
    }
    async getCandleHistory(symbol, timeframe = '1m') {
        const result = await this.upstoxBroker.getCandles(symbol, timeframe);
        return result.candles;
    }
    getPairMeta(symbol) {
        return this.pairMeta.get(symbol);
    }
    updatePairSpread(symbol, newSpread) {
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
};
ForexEngineService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        UpstoxBrokerService])
], ForexEngineService);
export { ForexEngineService };
//# sourceMappingURL=forex-engine.service.js.map