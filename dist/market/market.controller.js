var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Query } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { PrismaService } from '../prisma.service.js';
let MarketController = class MarketController {
    forexEngine;
    prisma;
    constructor(forexEngine, prisma) {
        this.forexEngine = forexEngine;
        this.prisma = prisma;
    }
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
    getHistory(symbol, timeframe = '1m') {
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
    getQuotes() {
        return this.forexEngine.getAllQuotes();
    }
};
__decorate([
    Get('pairs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getPairs", null);
__decorate([
    Get('history'),
    __param(0, Query('symbol')),
    __param(1, Query('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getHistory", null);
__decorate([
    Get('quotes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getQuotes", null);
MarketController = __decorate([
    Controller('market'),
    __metadata("design:paramtypes", [ForexEngineService,
        PrismaService])
], MarketController);
export { MarketController };
//# sourceMappingURL=market.controller.js.map