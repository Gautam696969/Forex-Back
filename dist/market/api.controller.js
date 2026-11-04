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
import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService } from './upstox-broker.service.js';
import { NseIpoService } from './nse-ipo.service.js';
import { CentralApiService } from './central-api.service.js';
import { PrismaService } from '../prisma.service.js';
let ApiController = class ApiController {
    centralApi;
    forexEngine;
    upstoxBroker;
    nseIpoService;
    prisma;
    constructor(centralApi, forexEngine, upstoxBroker, nseIpoService, prisma) {
        this.centralApi = centralApi;
        this.forexEngine = forexEngine;
        this.upstoxBroker = upstoxBroker;
        this.nseIpoService = nseIpoService;
        this.prisma = prisma;
    }
    onModuleInit() {
        this.centralApi.registerTestHandler('indices', () => this.getIndicesData());
        this.centralApi.registerTestHandler('quotes', () => this.getQuotesData());
        this.centralApi.registerTestHandler('pairs', () => this.getPairsData());
        this.centralApi.registerTestHandler('candles', () => this.getCandlesData('NIFTY 50', '1m'));
        this.centralApi.registerTestHandler('status', async () => this.getStatusData());
        this.centralApi.registerTestHandler('ipo', () => this.getIpoData());
    }
    async getIndicesData() {
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
    async getQuotesData() {
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
    async getPairsData(category) {
        const where = { active: true };
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
    async getCandlesData(symbol = 'NIFTY 50', interval = '1m') {
        return this.upstoxBroker.getCandles(symbol, interval);
    }
    getStatusData() {
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
    async getIpoData(status) {
        const res = await this.nseIpoService.getIpos(status);
        return res;
    }
    async getIndices(req, res) {
        return this.centralApi.wrapRoute(res, 'indices', req?.originalUrl || '/api/indices', async () => {
            return this.getIndicesData();
        });
    }
    async getQuotes(req, res) {
        return this.centralApi.wrapRoute(res, 'quotes', req?.originalUrl || '/api/quotes', async () => {
            return this.getQuotesData();
        });
    }
    async getPairs(category, req, res) {
        return this.centralApi.wrapRoute(res, 'pairs', req?.originalUrl || '/api/pairs', async () => {
            return this.getPairsData(category);
        });
    }
    async getCandles(symbol = 'NIFTY 50', interval, timeframe, req, res) {
        const tf = interval || timeframe || '1m';
        return this.centralApi.wrapRoute(res, 'candles', req?.originalUrl || `/api/candles?symbol=${symbol}&interval=${tf}`, async () => {
            return this.getCandlesData(symbol, tf);
        });
    }
    async getStatus(req, res) {
        return this.centralApi.wrapRoute(res, 'status', req?.originalUrl || '/api/status', async () => {
            return this.getStatusData();
        });
    }
    async getIpo(status, req, res) {
        return this.centralApi.wrapRoute(res, 'ipo', req?.originalUrl || '/api/ipo', async () => {
            return this.getIpoData(status);
        });
    }
    async getIposAlias(status, req, res) {
        return this.centralApi.wrapRoute(res, 'ipo', req?.originalUrl || '/api/ipos', async () => {
            return this.getIpoData(status);
        });
    }
    getHealth(res) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        const health = this.centralApi.getHealthSummary();
        return res.status(200).json({
            ok: true,
            api: 'health',
            data: health,
            serverTime: this.centralApi.getISTString(),
        });
    }
};
__decorate([
    Get('indices'),
    __param(0, Req()),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getIndices", null);
__decorate([
    Get('quotes'),
    __param(0, Req()),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getQuotes", null);
__decorate([
    Get('pairs'),
    __param(0, Query('category')),
    __param(1, Req()),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getPairs", null);
__decorate([
    Get('candles'),
    __param(0, Query('symbol')),
    __param(1, Query('interval')),
    __param(2, Query('timeframe')),
    __param(3, Req()),
    __param(4, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getCandles", null);
__decorate([
    Get('status'),
    __param(0, Req()),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getStatus", null);
__decorate([
    Get('ipo'),
    __param(0, Query('status')),
    __param(1, Req()),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getIpo", null);
__decorate([
    Get('ipos'),
    __param(0, Query('status')),
    __param(1, Req()),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getIposAlias", null);
__decorate([
    Get('health'),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "getHealth", null);
ApiController = __decorate([
    Controller('api'),
    __metadata("design:paramtypes", [CentralApiService,
        ForexEngineService,
        UpstoxBrokerService,
        NseIpoService,
        PrismaService])
], ApiController);
export { ApiController };
//# sourceMappingURL=api.controller.js.map