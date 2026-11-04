import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService } from './upstox-broker.service.js';
import { NseIpoService } from './nse-ipo.service.js';
import { PrismaService } from '../prisma.service.js';

@Controller('market')
export class MarketController {
  constructor(
    private forexEngine: ForexEngineService,
    private upstoxBroker: UpstoxBrokerService,
    private nseIpoService: NseIpoService,
    private prisma: PrismaService,
  ) {}

  private async getUserId(req: any): Promise<string> {
    const auth = req?.headers?.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const token = auth.slice(7);
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload?.sub) return payload.sub;
      } catch (e) {}
    }
    const defaultUser = await this.prisma.user.findFirst({ where: { role: 'USER' } });
    return defaultUser?.id || '';
  }

  @Get('health')
  getHealth(@Res({ passthrough: true }) res: any) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return this.upstoxBroker.getHealthInfo();
  }

  @Get('status')
  getMarketStatus(@Res({ passthrough: true }) res: any) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return this.forexEngine.isMarketOpen();
  }

  @Get('pairs')
  async getPairs(@Query('category') category?: string, @Res({ passthrough: true }) res?: any) {
    if (res) res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const where: any = { active: true };
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

  @Get('indices')
  async getIndices(@Res({ passthrough: true }) res: any) {
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

  @Get('commodities')
  async getCommodities(@Res({ passthrough: true }) res: any) {
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

  @Get('history')
  async getHistory(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string = '1m',
    @Res({ passthrough: true }) res?: any,
  ) {
    if (res) res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (!symbol) {
      symbol = 'NIFTY 50';
    }
    return this.upstoxBroker.getCandles(symbol, timeframe);
  }

  @Get('quotes')
  getQuotes(@Res({ passthrough: true }) res: any) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return this.forexEngine.getAllQuotes();
  }

  // --- MUTUAL FUNDS ---
  @Get('mutual-funds')
  async getMutualFunds(@Query('category') category?: string) {
    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    return this.prisma.mutualFund.findMany({
      where,
      orderBy: { returns3Y: 'desc' },
    });
  }

  @Get('mutual-funds/:id')
  async getMutualFundDetail(@Param('id') id: string) {
    const fund = await this.prisma.mutualFund.findFirst({
      where: {
        OR: [{ id }, { schemeCode: id }],
      },
    });

    if (!fund) {
      throw new NotFoundException('Mutual Fund scheme not found');
    }

    // Comprehensive holdings, allocations and stats based on fund category
    const holdingsMap: Record<string, Array<{ name: string; sector: string; weight: number }>> = {
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

  // --- SIP PLANS ---
  @Get('sip')
  async getSipPlans(@Req() req: any) {
    const userId = await this.getUserId(req);
    if (!userId) return [];
    return this.prisma.sipPlan.findMany({
      where: { userId },
      include: { mutualFund: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('sip')
  async createSip(@Req() req: any, @Body() body: { fundId: string; monthlyAmount: number; frequency?: string; installmentDay?: number }) {
    const userId = await this.getUserId(req);
    if (!userId) throw new BadRequestException('User identification required');

    const fund = await this.prisma.mutualFund.findUnique({
      where: { id: body.fundId },
    });
    if (!fund) throw new NotFoundException('Mutual fund not found');

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

  @Patch('sip/:id/status')
  async updateSipStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' }) {
    const userId = await this.getUserId(req);
    const sip = await this.prisma.sipPlan.findFirst({
      where: { id, userId },
    });
    if (!sip) throw new NotFoundException('SIP plan not found');

    const updated = await this.prisma.sipPlan.update({
      where: { id },
      data: { status: body.status },
      include: { mutualFund: true },
    });

    return { success: true, sip: updated };
  }

  // --- IPOs (Real NSE India Primary Market Feed) ---
  @Get('ipos')
  async getIpos(@Query('status') status?: string) {
    const data = await this.nseIpoService.getIpos(status);
    return data.ipos;
  }

  @Post('ipos/refresh')
  async refreshIpos() {
    const ipos = await this.nseIpoService.refreshIpos();
    return {
      success: true,
      count: ipos.length,
      message: 'Refreshed IPO data from National Stock Exchange of India (NSE)',
      lastUpdated: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST',
    };
  }

  @Get('ipos/:id')
  async getIpoDetail(@Param('id') id: string) {
    const realIpo = await this.nseIpoService.getIpoDetail(id);
    if (realIpo) return realIpo;

    const dbIpo = await this.prisma.ipo.findFirst({
      where: {
        OR: [{ id }, { symbol: id.toUpperCase() }],
      },
    });
    if (!dbIpo) throw new NotFoundException('IPO not found');
    return dbIpo;
  }

  @Post('ipos/:id/apply')
  async applyIpo(@Req() req: any, @Param('id') id: string, @Body() body: { lots: number; upiId: string; bidPrice?: number }) {
    const userId = await this.getUserId(req);
    if (!userId) throw new BadRequestException('User identification required');

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

    if (!ipo) throw new NotFoundException('IPO not found');

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

  @Get('ipos/user/applications')
  async getUserIpoApplications(@Req() req: any) {
    const userId = await this.getUserId(req);
    if (!userId) return [];
    return this.prisma.ipoApplication.findMany({
      where: { userId },
      include: { ipo: true },
      orderBy: { appliedAt: 'desc' },
    });
  }

  // --- WATCHLIST ---
  @Get('watchlist')
  async getWatchlist(@Req() req: any) {
    const userId = await this.getUserId(req);
    if (!userId) return [];

    const items = await this.prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const quotes = this.forexEngine.getAllQuotes();
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

    // Fetch pair info for details
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

  @Post('watchlist')
  async addToWatchlist(@Req() req: any, @Body() body: { symbol: string; assetType?: string; watchlistName?: string }) {
    const userId = await this.getUserId(req);
    if (!userId) throw new BadRequestException('User identification required');

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

  @Delete('watchlist/:symbol')
  async removeFromWatchlist(@Req() req: any, @Param('symbol') symbol: string) {
    const userId = await this.getUserId(req);
    if (!userId) throw new BadRequestException('User identification required');

    await this.prisma.watchlistItem.deleteMany({
      where: { userId, symbol },
    });

    return { success: true, message: `${symbol} removed from watchlist` };
  }

  @Get('news')
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
}
