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
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService } from './upstox-broker.service.js';
import { NseIpoService } from './nse-ipo.service.js';
import { PrismaService } from '../prisma.service.js';
let MarketController = class MarketController {
    forexEngine;
    upstoxBroker;
    nseIpoService;
    prisma;
    constructor(forexEngine, upstoxBroker, nseIpoService, prisma) {
        this.forexEngine = forexEngine;
        this.upstoxBroker = upstoxBroker;
        this.nseIpoService = nseIpoService;
        this.prisma = prisma;
    }
    async getUserId(req) {
        const auth = req?.headers?.authorization;
        if (auth && auth.startsWith('Bearer ')) {
            try {
                const token = auth.slice(7);
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                if (payload?.sub)
                    return payload.sub;
            }
            catch (e) { }
        }
        const defaultUser = await this.prisma.user.findFirst({ where: { role: 'USER' } });
        return defaultUser?.id || '';
    }
    getHealth(res) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return this.upstoxBroker.getHealthInfo();
    }
    getMarketStatus(res) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return this.forexEngine.isMarketOpen();
    }
    async getPairs(category, res) {
        if (res)
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        const where = { active: true };
        if (category && category !== 'ALL') {
            where.category = category;
        }
        const pairs = await this.prisma.currencyPair.findMany({
            where,
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
    async getIndices(res) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        const indices = await this.prisma.currencyPair.findMany({
            where: { category: 'INDICES', active: true },
        });
        const quotes = this.forexEngine.getAllQuotes();
        const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));
        return indices.map((idx) => {
            const live = quoteMap.get(idx.symbol);
            return {
                ...idx,
                currentBid: live ? live.bid : idx.currentBid,
                currentAsk: live ? live.ask : idx.currentAsk,
                change24h: live ? live.change24h : idx.change24h,
            };
        });
    }
    async getCommodities(res) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        const commodities = await this.prisma.currencyPair.findMany({
            where: { category: 'COMMODITIES', active: true },
            orderBy: { symbol: 'asc' },
        });
        const quotes = this.forexEngine.getAllQuotes();
        const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));
        return commodities.map((item) => {
            const live = quoteMap.get(item.symbol);
            return {
                ...item,
                currentBid: live ? live.bid : item.currentBid,
                currentAsk: live ? live.ask : item.currentAsk,
                change24h: live ? live.change24h : item.change24h,
                high24h: live ? live.high24h : item.high24h,
                low24h: live ? live.low24h : item.low24h,
            };
        });
    }
    async getHistory(symbol, timeframe = '1m', res) {
        if (res)
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        if (!symbol) {
            symbol = 'NIFTY 50';
        }
        return this.upstoxBroker.getCandles(symbol, timeframe);
    }
    getQuotes(res) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return this.forexEngine.getAllQuotes();
    }
    async getMutualFunds(category) {
        const where = {};
        if (category && category !== 'ALL') {
            where.category = category;
        }
        return this.prisma.mutualFund.findMany({
            where,
            orderBy: { returns3Y: 'desc' },
        });
    }
    async getMutualFundDetail(id) {
        const fund = await this.prisma.mutualFund.findFirst({
            where: {
                OR: [{ id }, { schemeCode: id }],
            },
        });
        if (!fund) {
            throw new NotFoundException('Mutual Fund scheme not found');
        }
        const holdingsMap = {
            'EQUITY': [
                { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 8.8 },
                { name: 'Reliance Industries Ltd', sector: 'Oil & Gas', weight: 8.1 },
                { name: 'Infosys Ltd', sector: 'IT Services', weight: 6.4 },
                { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 5.9 },
                { name: 'Tata Consultancy Services', sector: 'IT Services', weight: 4.8 },
                { name: 'ITC Ltd', sector: 'Consumer Goods', weight: 4.2 },
                { name: 'Larsen & Toubro Ltd', sector: 'Infrastructure', weight: 3.9 },
                { name: 'Tata Motors Ltd', sector: 'Automobile', weight: 3.5 },
            ],
            'HYBRID': [
                { name: 'Government of India 7.18% 2033', sector: 'Sovereign Debt', weight: 24.5 },
                { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 7.2 },
                { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 6.1 },
                { name: 'Reliance Industries Ltd', sector: 'Oil & Gas', weight: 5.8 },
                { name: 'NABARD Bond 7.65%', sector: 'Corporate Debt', weight: 8.5 },
                { name: 'Infosys Ltd', sector: 'IT Services', weight: 4.4 },
            ],
            'INDEX': [
                { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 11.5 },
                { name: 'Reliance Industries Ltd', sector: 'Oil & Gas', weight: 9.8 },
                { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 7.9 },
                { name: 'Infosys Ltd', sector: 'IT Services', weight: 6.0 },
                { name: 'Tata Consultancy Services', sector: 'IT Services', weight: 4.2 },
                { name: 'Bharti Airtel Ltd', sector: 'Telecom', weight: 3.8 },
            ],
        };
        const sectorAllocations = [
            { sector: 'Financial Services', percentage: 32.4 },
            { sector: 'Information Technology', percentage: 18.2 },
            { sector: 'Oil, Gas & Consumable Fuels', percentage: 12.1 },
            { sector: 'Automobile & Auto Components', percentage: 8.6 },
            { sector: 'Consumer Goods', percentage: 7.5 },
            { sector: 'Healthcare & Pharma', percentage: 6.2 },
            { sector: 'Cash & Equivalents', percentage: 15.0 },
        ];
        return {
            ...fund,
            exitLoad: '1.0% if redeemed within 365 days; Nil after 1 year',
            lockInPeriod: fund.category === 'ELSS' ? '3 Years' : 'None',
            stampDuty: '0.005% (as per Indian Stamp Act)',
            turnoverRatio: '18.4%',
            benchmark: fund.category === 'INDEX' ? 'NIFTY 50 TRI' : fund.category === 'EQUITY' ? 'NIFTY 500 TRI' : 'CRISIL Hybrid 35+65',
            holdings: holdingsMap[fund.category] || holdingsMap['EQUITY'],
            sectorAllocation: sectorAllocations,
        };
    }
    async getSipPlans(req) {
        const userId = await this.getUserId(req);
        if (!userId)
            return [];
        return this.prisma.sipPlan.findMany({
            where: { userId },
            include: { mutualFund: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createSip(req, body) {
        const userId = await this.getUserId(req);
        if (!userId)
            throw new BadRequestException('User identification required');
        const fund = await this.prisma.mutualFund.findUnique({
            where: { id: body.fundId },
        });
        if (!fund)
            throw new NotFoundException('Mutual fund not found');
        if (body.monthlyAmount < fund.minSipAmount) {
            throw new BadRequestException(`Minimum SIP amount for this fund is ₹${fund.minSipAmount}`);
        }
        const nextDate = new Date();
        nextDate.setDate(body.installmentDay || 5);
        if (nextDate.getTime() < Date.now()) {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        const sip = await this.prisma.sipPlan.create({
            data: {
                userId,
                fundId: fund.id,
                monthlyAmount: body.monthlyAmount,
                frequency: body.frequency || 'MONTHLY',
                installmentDay: body.installmentDay || 5,
                nextInstallmentDate: nextDate,
                status: 'ACTIVE',
                totalInvested: body.monthlyAmount,
                currentValue: body.monthlyAmount * (1 + (fund.returns1Y / 100) * 0.05),
            },
            include: { mutualFund: true },
        });
        return {
            success: true,
            sip,
            message: `SIP of ₹${body.monthlyAmount.toLocaleString('en-IN')}/month successfully scheduled on ${sip.installmentDay}th of every month.`,
        };
    }
    async updateSipStatus(req, id, body) {
        const userId = await this.getUserId(req);
        const sip = await this.prisma.sipPlan.findFirst({
            where: { id, userId },
        });
        if (!sip)
            throw new NotFoundException('SIP plan not found');
        const updated = await this.prisma.sipPlan.update({
            where: { id },
            data: { status: body.status },
            include: { mutualFund: true },
        });
        return { success: true, sip: updated };
    }
    async getIpos(status) {
        const data = await this.nseIpoService.getIpos(status);
        return data.ipos;
    }
    async refreshIpos() {
        const ipos = await this.nseIpoService.refreshIpos();
        return {
            success: true,
            count: ipos.length,
            message: 'Refreshed IPO data from National Stock Exchange of India (NSE)',
            lastUpdated: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST',
        };
    }
    async getIpoDetail(id) {
        const realIpo = await this.nseIpoService.getIpoDetail(id);
        if (realIpo)
            return realIpo;
        const dbIpo = await this.prisma.ipo.findFirst({
            where: {
                OR: [{ id }, { symbol: id.toUpperCase() }],
            },
        });
        if (!dbIpo)
            throw new NotFoundException('IPO not found');
        return dbIpo;
    }
    async applyIpo(req, id, body) {
        const userId = await this.getUserId(req);
        if (!userId)
            throw new BadRequestException('User identification required');
        let ipo = await this.prisma.ipo.findFirst({
            where: { OR: [{ id }, { symbol: id.toUpperCase() }] },
        });
        if (!ipo) {
            const realIpo = await this.nseIpoService.getIpoDetail(id);
            if (realIpo) {
                ipo = await this.prisma.ipo.upsert({
                    where: { symbol: realIpo.symbol },
                    update: {},
                    create: {
                        id: realIpo.id,
                        symbol: realIpo.symbol,
                        companyName: realIpo.companyName,
                        category: realIpo.category,
                        priceBand: realIpo.priceBand,
                        minPrice: realIpo.minPrice,
                        maxPrice: realIpo.maxPrice,
                        lotSize: realIpo.lotSize,
                        issueSize: realIpo.issueSize,
                        openDate: new Date(realIpo.openDate),
                        closeDate: new Date(realIpo.closeDate),
                        listingDate: realIpo.listingDate ? new Date(realIpo.listingDate) : null,
                        subscriptionRate: realIpo.subscriptionRate,
                        status: realIpo.status,
                        about: realIpo.about,
                    },
                });
            }
        }
        if (!ipo)
            throw new NotFoundException('IPO not found');
        const lots = Number(body.lots) || 1;
        const bidPrice = body.bidPrice || ipo.maxPrice;
        const shares = lots * ipo.lotSize;
        const totalAmount = shares * bidPrice;
        const application = await this.prisma.ipoApplication.create({
            data: {
                userId,
                ipoId: ipo.id,
                lots,
                shares,
                bidPrice,
                totalAmount,
                upiId: body.upiId || 'trader@okhdfcbank',
                status: 'APPLIED',
            },
            include: { ipo: true },
        });
        return {
            success: true,
            application,
            message: `IPO Bid of ₹${totalAmount.toLocaleString('en-IN')} (${lots} lots / ${shares} shares) submitted! UPI mandate sent to ${body.upiId}.`,
        };
    }
    async getUserIpoApplications(req) {
        const userId = await this.getUserId(req);
        if (!userId)
            return [];
        return this.prisma.ipoApplication.findMany({
            where: { userId },
            include: { ipo: true },
            orderBy: { appliedAt: 'desc' },
        });
    }
    async getWatchlist(req) {
        const userId = await this.getUserId(req);
        if (!userId)
            return [];
        const items = await this.prisma.watchlistItem.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        const quotes = this.forexEngine.getAllQuotes();
        const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));
        const pairs = await this.prisma.currencyPair.findMany();
        const pairMap = new Map(pairs.map((p) => [p.symbol, p]));
        return items.map((item) => {
            const pair = pairMap.get(item.symbol);
            const quote = quoteMap.get(item.symbol);
            return {
                ...item,
                displayName: pair?.displayName || item.symbol,
                currentBid: quote ? quote.bid : pair?.currentBid || 0,
                currentAsk: quote ? quote.ask : pair?.currentAsk || 0,
                change24h: quote ? quote.change24h : pair?.change24h || 0,
                high24h: quote ? quote.high24h : pair?.high24h || 0,
                low24h: quote ? quote.low24h : pair?.low24h || 0,
                category: pair?.category || item.assetType,
            };
        });
    }
    async addToWatchlist(req, body) {
        const userId = await this.getUserId(req);
        if (!userId)
            throw new BadRequestException('User identification required');
        const existing = await this.prisma.watchlistItem.findFirst({
            where: { userId, symbol: body.symbol },
        });
        if (existing) {
            return { success: true, item: existing, message: 'Already in watchlist' };
        }
        const item = await this.prisma.watchlistItem.create({
            data: {
                userId,
                symbol: body.symbol,
                assetType: body.assetType || 'STOCK',
                watchlistName: body.watchlistName || 'My Watchlist',
            },
        });
        return { success: true, item, message: `${body.symbol} added to watchlist` };
    }
    async removeFromWatchlist(req, symbol) {
        const userId = await this.getUserId(req);
        if (!userId)
            throw new BadRequestException('User identification required');
        await this.prisma.watchlistItem.deleteMany({
            where: { userId, symbol },
        });
        return { success: true, message: `${symbol} removed from watchlist` };
    }
    getFinancialNews() {
        return [
            {
                id: '1',
                title: 'NIFTY 50 surges above 24,100 led by Tech and Banking heavyweights',
                source: 'Economic Times',
                time: '15 mins ago',
                category: 'Markets',
                impact: 'POSITIVE',
            },
            {
                id: '2',
                title: 'FIIs turn net buyers in Indian equities, purchasing ₹2,840 Cr worth of shares',
                source: 'Moneycontrol',
                time: '45 mins ago',
                category: 'Economy',
                impact: 'POSITIVE',
            },
            {
                id: '3',
                title: 'RBI Monetary Policy Committee maintains repo rate at 6.5%, projects steady FY25 GDP growth at 7.2%',
                source: 'LiveMint',
                time: '2 hours ago',
                category: 'Banking',
                impact: 'NEUTRAL',
            },
            {
                id: '4',
                title: 'Tata Power secures massive 400 MW green hybrid renewable energy contract',
                source: 'Business Standard',
                time: '3 hours ago',
                category: 'Energy',
                impact: 'POSITIVE',
            },
            {
                id: '5',
                title: 'Swiggy IPO subscribed 3.59 times on final day; strong bids from institutional investors',
                source: 'Financial Express',
                time: '4 hours ago',
                category: 'IPO',
                impact: 'POSITIVE',
            },
            {
                id: '6',
                title: 'Gold prices steady near ₹78,500/10g on strong festive demand and global safe-haven flows',
                source: 'CNBC-TV18',
                time: '5 hours ago',
                category: 'Commodities',
                impact: 'NEUTRAL',
            },
        ];
    }
};
__decorate([
    Get('health'),
    __param(0, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getHealth", null);
__decorate([
    Get('status'),
    __param(0, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getMarketStatus", null);
__decorate([
    Get('pairs'),
    __param(0, Query('category')),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getPairs", null);
__decorate([
    Get('indices'),
    __param(0, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getIndices", null);
__decorate([
    Get('commodities'),
    __param(0, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getCommodities", null);
__decorate([
    Get('history'),
    __param(0, Query('symbol')),
    __param(1, Query('timeframe')),
    __param(2, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getHistory", null);
__decorate([
    Get('quotes'),
    __param(0, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getQuotes", null);
__decorate([
    Get('mutual-funds'),
    __param(0, Query('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getMutualFunds", null);
__decorate([
    Get('mutual-funds/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getMutualFundDetail", null);
__decorate([
    Get('sip'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getSipPlans", null);
__decorate([
    Post('sip'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "createSip", null);
__decorate([
    Patch('sip/:id/status'),
    __param(0, Req()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "updateSipStatus", null);
__decorate([
    Get('ipos'),
    __param(0, Query('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getIpos", null);
__decorate([
    Post('ipos/refresh'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "refreshIpos", null);
__decorate([
    Get('ipos/:id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getIpoDetail", null);
__decorate([
    Post('ipos/:id/apply'),
    __param(0, Req()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "applyIpo", null);
__decorate([
    Get('ipos/user/applications'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getUserIpoApplications", null);
__decorate([
    Get('watchlist'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getWatchlist", null);
__decorate([
    Post('watchlist'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "addToWatchlist", null);
__decorate([
    Delete('watchlist/:symbol'),
    __param(0, Req()),
    __param(1, Param('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "removeFromWatchlist", null);
__decorate([
    Get('news'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getFinancialNews", null);
MarketController = __decorate([
    Controller('market'),
    __metadata("design:paramtypes", [ForexEngineService,
        UpstoxBrokerService,
        NseIpoService,
        PrismaService])
], MarketController);
export { MarketController };
//# sourceMappingURL=market.controller.js.map