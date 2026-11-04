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
var ApiController_1;
import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService } from './upstox-broker.service.js';
import { PrismaService } from '../prisma.service.js';
let ApiController = ApiController_1 = class ApiController {
    forexEngine;
    upstoxBroker;
    prisma;
    logger = new Logger(ApiController_1.name);
    constructor(forexEngine, upstoxBroker, prisma) {
        this.forexEngine = forexEngine;
        this.upstoxBroker = upstoxBroker;
        this.prisma = prisma;
    }
    async getIndices(res) {
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
        }
        catch (err) {
            this.logger.error(`[API Failure] GET /api/indices failed: ${err.message}`, err.stack);
            console.error(`[API Failure] GET /api/indices error:`, err);
            return res.status(500).json({ error: 'Failed to fetch indices data', message: err.message });
        }
    }
    async getCandles(symbol = 'NIFTY 50', interval, timeframe, res) {
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
        }
        catch (err) {
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
    getStatus(res) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res.status(200).json(this.upstoxBroker.isMarketOpen());
    }
};
__decorate([
    Get('indices'),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getIndices", null);
__decorate([
    Get('candles'),
    __param(0, Query('symbol')),
    __param(1, Query('interval')),
    __param(2, Query('timeframe')),
    __param(3, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getCandles", null);
__decorate([
    Get('status'),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "getStatus", null);
ApiController = ApiController_1 = __decorate([
    Controller('api'),
    __metadata("design:paramtypes", [ForexEngineService,
        UpstoxBrokerService,
        PrismaService])
], ApiController);
export { ApiController };
//# sourceMappingURL=api.controller.js.map