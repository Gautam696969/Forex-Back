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
        let dbIndices = [];
        try {
            dbIndices = await this.prisma.currencyPair.findMany({
                where: { category: 'INDICES', active: true },
            });
        }
        catch (dbErr) {
            console.warn(`[INDICES WARNING] Database unavailable: ${dbErr?.message || dbErr}`);
        }
        let quotes = [];
        try {
            quotes = this.upstoxBroker.getAllQuotes();
            if (quotes.length === 0) {
                quotes = await this.upstoxBroker.syncQuotesFromYahoo();
            }
        }
        catch (feedErr) {
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
        let pairs = [];
        try {
            pairs = await this.prisma.currencyPair.findMany({
                where,
                orderBy: { symbol: 'asc' },
            });
        }
        catch (dbErr) {
            console.warn(`[PAIRS WARNING] Database unavailable: ${dbErr?.message || dbErr}. Falling back to quote feed.`);
        }
        let quotes = [];
        try {
            quotes = this.upstoxBroker.getAllQuotes();
            if (quotes.length === 0) {
                quotes = await this.upstoxBroker.syncQuotesFromYahoo();
            }
        }
        catch (feedErr) {
            console.warn(`[PAIRS WARNING] Upstream quote feed failed: ${feedErr?.message || feedErr}`);
        }
        const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));
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
    async getCandlesData(symbol = 'NIFTY 50', interval = '1m') {
        return this.upstoxBroker.getCandles(symbol, interval);
    }
    async getStatusData() {
        const now = new Date();
        const istTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
        const istParts = istTimeStr.split(':').map(Number);
        const hours = istParts[0] || 0;
        const minutes = istParts[1] || 0;
        const totalMinutes = hours * 60 + minutes;
        const istDayStr = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });
        const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(istDayStr);
        const nseOpen = 9 * 60 + 15;
        const nseClose = 15 * 60 + 30;
        const isOpen = isWeekday && totalMinutes >= nseOpen && totalMinutes <= nseClose;
        const status = isOpen ? 'OPEN' : 'CLOSED';
        let dataFeed = 'LIVE';
        try {
            if (this.upstoxBroker) {
                const feedInfo = this.upstoxBroker.getHealthInfo?.();
                if (feedInfo?.status === 'offline') {
                    dataFeed = 'UNKNOWN';
                }
                else if (feedInfo?.status === 'degraded' || feedInfo?.status === 'stale') {
                    dataFeed = 'DEGRADED';
                }
                else {
                    dataFeed = 'LIVE';
                }
            }
            else {
                dataFeed = 'UNKNOWN';
                console.warn('[STATUS WARNING] upstoxBroker service reference is unavailable');
            }
        }
        catch (feedErr) {
            dataFeed = 'UNKNOWN';
            console.warn(`[STATUS WARNING] Data feed check failed: ${feedErr?.message || feedErr}`);
        }
        let database = 'CONNECTED';
        try {
            await Promise.race([
                this.prisma.$queryRaw `SELECT 1`,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Database ping timeout (1000ms)')), 1000)),
            ]);
        }
        catch (dbErr) {
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
    async getIpoData(status) {
        const res = await this.nseIpoService.getIpos(status);
        return res;
    }
    async getIndices(req, res) {
        try {
            return await this.centralApi.wrapRoute(res, 'indices', req?.originalUrl || '/api/indices', async () => {
                return this.getIndicesData();
            });
        }
        catch (err) {
            const timeIST = this.centralApi.getISTString();
            const reason = err?.message || String(err);
            console.error(`\x1b[31m[API FAILED] api=indices ${timeIST} reason=${reason}\x1b[0m`);
            if (err?.stack)
                console.error(err.stack);
            return res.status(500).json({ ok: false, api: 'indices', error: reason });
        }
    }
    async getQuotes(req, res) {
        try {
            return await this.centralApi.wrapRoute(res, 'quotes', req?.originalUrl || '/api/quotes', async () => {
                return this.getQuotesData();
            });
        }
        catch (err) {
            const timeIST = this.centralApi.getISTString();
            const reason = err?.message || String(err);
            console.error(`\x1b[31m[API FAILED] api=quotes ${timeIST} reason=${reason}\x1b[0m`);
            if (err?.stack)
                console.error(err.stack);
            return res.status(500).json({ ok: false, api: 'quotes', error: reason });
        }
    }
    async getPairs(category, req, res) {
        try {
            return await this.centralApi.wrapRoute(res, 'pairs', req?.originalUrl || '/api/pairs', async () => {
                return this.getPairsData(category);
            });
        }
        catch (err) {
            const timeIST = this.centralApi.getISTString();
            const reason = err?.message || String(err);
            console.error(`\x1b[31m[API FAILED] api=pairs ${timeIST} reason=${reason}\x1b[0m`);
            if (err?.stack)
                console.error(err.stack);
            return res.status(500).json({ ok: false, api: 'pairs', error: reason });
        }
    }
    async getCandles(symbol = 'NIFTY 50', interval, timeframe, req, res) {
        const tf = interval || timeframe || '1m';
        try {
            return await this.centralApi.wrapRoute(res, 'candles', req?.originalUrl || `/api/candles?symbol=${symbol}&interval=${tf}`, async () => {
                return this.getCandlesData(symbol, tf);
            });
        }
        catch (err) {
            const timeIST = this.centralApi.getISTString();
            const reason = err?.message || String(err);
            console.error(`\x1b[31m[API FAILED] api=candles ${timeIST} reason=${reason}\x1b[0m`);
            if (err?.stack)
                console.error(err.stack);
            return res.status(500).json({ ok: false, api: 'candles', error: reason });
        }
    }
    async getChart(symbol = 'NIFTY 50', range = '1D', req, res) {
        try {
            return await this.centralApi.wrapRoute(res, 'chart', req?.originalUrl || `/api/chart?symbol=${symbol}&range=${range}`, async () => {
                return this.upstoxBroker.getChartData(symbol, range);
            });
        }
        catch (err) {
            const timeIST = this.centralApi.getISTString();
            const reason = err?.message || String(err);
            console.error(`\x1b[31m[API FAILED] api=chart ${timeIST} reason=${reason}\x1b[0m`);
            if (err?.stack)
                console.error(err.stack);
            return res.status(500).json({ ok: false, api: 'chart', error: reason });
        }
    }
    async getStatus(req, res) {
        try {
            return await this.centralApi.wrapRoute(res, 'status', req?.originalUrl || '/api/status', async () => {
                return this.getStatusData();
            });
        }
        catch (err) {
            const timeIST = this.centralApi.getISTString();
            const reason = err?.message || String(err);
            console.error(`\x1b[31m[API FAILED] api=status ${timeIST} reason=${reason}\x1b[0m`);
            if (err?.stack)
                console.error(err.stack);
            return res.status(500).json({
                ok: false,
                api: 'status',
                error: reason,
            });
        }
    }
    async getIpo(status, req, res) {
        try {
            return await this.centralApi.wrapRoute(res, 'ipo', req?.originalUrl || '/api/ipo', async () => {
                return this.getIpoData(status);
            });
        }
        catch (err) {
            const timeIST = this.centralApi.getISTString();
            const reason = err?.message || String(err);
            console.error(`\x1b[31m[API FAILED] api=ipo ${timeIST} reason=${reason}\x1b[0m`);
            if (err?.stack)
                console.error(err.stack);
            return res.status(500).json({ ok: false, api: 'ipo', error: reason });
        }
    }
    async getIposAlias(status, req, res) {
        try {
            return await this.centralApi.wrapRoute(res, 'ipo', req?.originalUrl || '/api/ipos', async () => {
                return this.getIpoData(status);
            });
        }
        catch (err) {
            const timeIST = this.centralApi.getISTString();
            const reason = err?.message || String(err);
            console.error(`\x1b[31m[API FAILED] api=ipo ${timeIST} reason=${reason}\x1b[0m`);
            if (err?.stack)
                console.error(err.stack);
            return res.status(500).json({ ok: false, api: 'ipo', error: reason });
        }
    }
    getHealth(res) {
        try {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            const health = this.centralApi.getHealthSummary();
            return res.status(200).json({
                ok: true,
                api: 'health',
                data: health,
                serverTime: this.centralApi.getISTString(),
            });
        }
        catch (err) {
            const timeIST = this.centralApi.getISTString();
            const reason = err?.message || String(err);
            console.error(`\x1b[31m[API FAILED] api=health ${timeIST} reason=${reason}\x1b[0m`);
            if (err?.stack)
                console.error(err.stack);
            return res.status(500).json({ ok: false, api: 'health', error: reason });
        }
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
    Get('chart'),
    __param(0, Query('symbol')),
    __param(1, Query('range')),
    __param(2, Req()),
    __param(3, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getChart", null);
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