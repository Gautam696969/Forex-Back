var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, BadRequestException, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ForexEngineService } from '../market/forex-engine.service.js';
import { MarketGateway } from '../market/market.gateway.js';
let TradingService = class TradingService {
    prisma;
    forexEngine;
    marketGateway;
    lastEvaluationTime = 0;
    constructor(prisma, forexEngine, marketGateway) {
        this.prisma = prisma;
        this.forexEngine = forexEngine;
        this.marketGateway = marketGateway;
    }
    onModuleInit() {
        this.forexEngine.on('ticks', async (ticks) => {
            const now = Date.now();
            if (now - this.lastEvaluationTime > 1000) {
                this.lastEvaluationTime = now;
                await this.evaluateActiveTradingState(ticks);
            }
        });
    }
    async createOrder(userId, dto) {
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account) {
            throw new NotFoundException('Trading account not found');
        }
        const pair = await this.prisma.currencyPair.findUnique({
            where: { symbol: dto.symbol },
        });
        if (!pair || !pair.active) {
            throw new BadRequestException('Selected currency pair is not active or unavailable');
        }
        if (dto.lots < pair.minLot || dto.lots > pair.maxLot) {
            throw new BadRequestException(`Lot size must be between ${pair.minLot} and ${pair.maxLot} lots`);
        }
        const liveQuote = this.forexEngine.getQuote(dto.symbol);
        if (!liveQuote) {
            throw new BadRequestException('Live market data unavailable for this pair');
        }
        const isPending = dto.type.includes('_');
        if (isPending) {
            if (!dto.targetPrice || dto.targetPrice <= 0) {
                throw new BadRequestException('Target execution price is required for pending orders');
            }
            const order = await this.prisma.order.create({
                data: {
                    accountId: account.id,
                    symbol: dto.symbol,
                    type: dto.type,
                    status: 'PENDING',
                    lots: dto.lots,
                    targetPrice: dto.targetPrice,
                    stopLoss: dto.stopLoss || null,
                    takeProfit: dto.takeProfit || null,
                },
            });
            this.marketGateway.notifyAccount(account.id, 'order:created', order);
            return { success: true, order, message: 'Pending order placed successfully' };
        }
        const entryPrice = dto.type === 'BUY' ? liveQuote.ask : liveQuote.bid;
        const requiredMargin = this.calculateMargin(entryPrice, dto.lots, pair.contractSize, account.leverage, dto.symbol);
        if (account.freeMargin < requiredMargin) {
            throw new BadRequestException(`Insufficient funds. Required: ₹${requiredMargin.toLocaleString('en-IN')}, Available: ₹${account.freeMargin.toLocaleString('en-IN')}`);
        }
        const position = await this.prisma.position.create({
            data: {
                accountId: account.id,
                symbol: dto.symbol,
                type: dto.type,
                lots: dto.lots,
                entryPrice,
                currentPrice: entryPrice,
                stopLoss: dto.stopLoss || null,
                takeProfit: dto.takeProfit || null,
                requiredMargin,
                unrealizedPnl: 0.0,
                unrealizedPips: 0.0,
                status: 'OPEN',
            },
        });
        const newUsedMargin = account.usedMargin + requiredMargin;
        const newFreeMargin = Math.max(0, account.equity - newUsedMargin);
        const newMarginLevel = newUsedMargin > 0 ? (account.equity / newUsedMargin) * 100 : 0;
        const updatedAccount = await this.prisma.account.update({
            where: { id: account.id },
            data: {
                usedMargin: newUsedMargin,
                freeMargin: newFreeMargin,
                marginLevel: newMarginLevel,
            },
        });
        this.marketGateway.notifyAccount(account.id, 'position:opened', {
            position,
            account: updatedAccount,
        });
        return {
            success: true,
            position,
            account: updatedAccount,
            message: `Market ${dto.type} order executed at ${entryPrice}`,
        };
    }
    async closePosition(userId, positionId, reason = 'MANUAL') {
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account)
            throw new NotFoundException('Account not found');
        const position = await this.prisma.position.findFirst({
            where: { id: positionId, accountId: account.id, status: 'OPEN' },
        });
        if (!position) {
            throw new NotFoundException('Open position not found or already closed');
        }
        const pair = await this.prisma.currencyPair.findUnique({
            where: { symbol: position.symbol },
        });
        if (!pair)
            throw new NotFoundException('Pair not found');
        const liveQuote = this.forexEngine.getQuote(position.symbol);
        const closePrice = position.type === 'BUY'
            ? (liveQuote ? liveQuote.bid : position.currentPrice)
            : (liveQuote ? liveQuote.ask : position.currentPrice);
        const { pnlUsd, pnlPips } = this.calculatePnl(position.type, position.entryPrice, closePrice, position.lots, pair.contractSize, position.symbol, pair.pipSize);
        const balanceBefore = account.balance;
        const balanceAfter = Number((account.balance + pnlUsd).toFixed(2));
        const [closedPos, trade, updatedAccount, ledger] = await this.prisma.$transaction([
            this.prisma.position.update({
                where: { id: position.id },
                data: {
                    status: 'CLOSED',
                    closedAt: new Date(),
                    currentPrice: closePrice,
                    unrealizedPnl: pnlUsd,
                },
            }),
            this.prisma.tradeHistory.create({
                data: {
                    accountId: account.id,
                    positionId: position.id,
                    symbol: position.symbol,
                    type: position.type,
                    lots: position.lots,
                    openPrice: position.entryPrice,
                    closePrice,
                    stopLoss: position.stopLoss,
                    takeProfit: position.takeProfit,
                    realizedPnl: pnlUsd,
                    realizedPips: pnlPips,
                    closeReason: reason,
                    openedAt: position.openedAt,
                    closedAt: new Date(),
                },
            }),
            this.prisma.account.update({
                where: { id: account.id },
                data: {
                    balance: balanceAfter,
                    usedMargin: Math.max(0, account.usedMargin - position.requiredMargin),
                },
            }),
            this.prisma.accountLedger.create({
                data: {
                    accountId: account.id,
                    type: pnlUsd >= 0 ? 'TRADE_PROFIT' : 'TRADE_LOSS',
                    amount: pnlUsd,
                    balanceBefore,
                    balanceAfter,
                    note: `Closed ${position.type} ${position.lots} lot(s) ${position.symbol} at ${closePrice} (${reason})`,
                },
            }),
        ]);
        await this.refreshAccountMetrics(account.id);
        this.marketGateway.notifyAccount(account.id, 'position:closed', {
            position: closedPos,
            trade,
            realizedPnl: pnlUsd,
        });
        return {
            success: true,
            trade,
            realizedPnl: pnlUsd,
            message: `Position closed. Realized P/L: ${pnlUsd >= 0 ? '+$' : '-$'}${Math.abs(pnlUsd)}`,
        };
    }
    async closeAllPositions(userId) {
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account)
            throw new NotFoundException('Account not found');
        const openPositions = await this.prisma.position.findMany({
            where: { accountId: account.id, status: 'OPEN' },
        });
        const results = [];
        for (const pos of openPositions) {
            const res = await this.closePosition(userId, pos.id, 'MANUAL');
            results.push(res);
        }
        return { success: true, closedCount: results.length, results };
    }
    async modifyPosition(userId, positionId, slTp) {
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account)
            throw new NotFoundException('Account not found');
        const position = await this.prisma.position.findFirst({
            where: { id: positionId, accountId: account.id, status: 'OPEN' },
        });
        if (!position)
            throw new NotFoundException('Open position not found');
        const updated = await this.prisma.position.update({
            where: { id: position.id },
            data: {
                stopLoss: slTp.stopLoss !== undefined ? slTp.stopLoss : position.stopLoss,
                takeProfit: slTp.takeProfit !== undefined ? slTp.takeProfit : position.takeProfit,
            },
        });
        this.marketGateway.notifyAccount(account.id, 'position:modified', updated);
        return { success: true, position: updated };
    }
    async getOpenPositions(userId) {
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account)
            return [];
        const positions = await this.prisma.position.findMany({
            where: { accountId: account.id, status: 'OPEN' },
            orderBy: { openedAt: 'desc' },
        });
        return positions.map((pos) => {
            const live = this.forexEngine.getQuote(pos.symbol);
            const meta = this.forexEngine.getPairMeta(pos.symbol);
            const currentPrice = live
                ? pos.type === 'BUY' ? live.bid : live.ask
                : pos.currentPrice;
            const pnlData = meta
                ? this.calculatePnl(pos.type, pos.entryPrice, currentPrice, pos.lots, meta.contractSize, pos.symbol, meta.pipSize)
                : { pnlUsd: pos.unrealizedPnl, pnlPips: pos.unrealizedPips };
            return {
                ...pos,
                currentPrice,
                unrealizedPnl: pnlData.pnlUsd,
                unrealizedPips: pnlData.pnlPips,
            };
        });
    }
    async getPendingOrders(userId) {
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account)
            return [];
        return this.prisma.order.findMany({
            where: { accountId: account.id, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
        });
    }
    async cancelOrder(userId, orderId) {
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account)
            throw new NotFoundException('Account not found');
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, accountId: account.id, status: 'PENDING' },
        });
        if (!order)
            throw new NotFoundException('Pending order not found');
        await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'CANCELLED' },
        });
        this.marketGateway.notifyAccount(account.id, 'order:cancelled', { orderId });
        return { success: true, message: 'Order cancelled successfully' };
    }
    async getTradeHistory(userId, filters) {
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account)
            return [];
        const where = { accountId: account.id };
        if (filters?.symbol) {
            where.symbol = filters.symbol;
        }
        return this.prisma.tradeHistory.findMany({
            where,
            orderBy: { closedAt: 'desc' },
            take: filters?.limit || 100,
            skip: filters?.offset || 0,
        });
    }
    async getAccountSummary(userId) {
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account)
            throw new NotFoundException('Account not found');
        const openPositions = await this.getOpenPositions(userId);
        const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
        const totalUsedMargin = openPositions.reduce((sum, p) => sum + p.requiredMargin, 0);
        const equity = Number((account.balance + totalUnrealizedPnl).toFixed(2));
        const freeMargin = Number(Math.max(0, equity - totalUsedMargin).toFixed(2));
        const marginLevel = totalUsedMargin > 0 ? Number(((equity / totalUsedMargin) * 100).toFixed(1)) : 0;
        const history = await this.prisma.tradeHistory.findMany({
            where: { accountId: account.id },
        });
        const totalTrades = history.length;
        const winningTrades = history.filter((t) => t.realizedPnl > 0).length;
        const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;
        const totalRealizedPnl = history.reduce((sum, t) => sum + t.realizedPnl, 0);
        return {
            account: {
                ...account,
                equity,
                usedMargin: totalUsedMargin,
                freeMargin,
                marginLevel,
                totalUnrealizedPnl: Number(totalUnrealizedPnl.toFixed(2)),
            },
            stats: {
                totalTrades,
                winningTrades,
                losingTrades: totalTrades - winningTrades,
                winRate,
                totalRealizedPnl: Number(totalRealizedPnl.toFixed(2)),
            },
        };
    }
    async evaluateActiveTradingState(ticks) {
        try {
            const quoteMap = new Map(ticks.map((t) => [t.symbol, t]));
            const pendingOrders = await this.prisma.order.findMany({
                where: { status: 'PENDING' },
            });
            for (const order of pendingOrders) {
                const quote = quoteMap.get(order.symbol);
                if (!quote || !order.targetPrice)
                    continue;
                let shouldExecute = false;
                let executeType = 'BUY';
                if (order.type === 'BUY_LIMIT' && quote.ask <= order.targetPrice) {
                    shouldExecute = true;
                    executeType = 'BUY';
                }
                else if (order.type === 'SELL_LIMIT' && quote.bid >= order.targetPrice) {
                    shouldExecute = true;
                    executeType = 'SELL';
                }
                else if (order.type === 'BUY_STOP' && quote.ask >= order.targetPrice) {
                    shouldExecute = true;
                    executeType = 'BUY';
                }
                else if (order.type === 'SELL_STOP' && quote.bid <= order.targetPrice) {
                    shouldExecute = true;
                    executeType = 'SELL';
                }
                if (shouldExecute) {
                    const account = await this.prisma.account.findUnique({
                        where: { id: order.accountId },
                    });
                    if (account) {
                        await this.prisma.order.update({
                            where: { id: order.id },
                            data: { status: 'FILLED' },
                        });
                        await this.createOrder(account.userId, {
                            symbol: order.symbol,
                            type: executeType,
                            lots: order.lots,
                            stopLoss: order.stopLoss || undefined,
                            takeProfit: order.takeProfit || undefined,
                        }).catch(() => { });
                    }
                }
            }
            const openPositions = await this.prisma.position.findMany({
                where: { status: 'OPEN' },
                include: { account: true },
            });
            const accountPnlMap = new Map();
            for (const pos of openPositions) {
                const quote = quoteMap.get(pos.symbol);
                if (!quote)
                    continue;
                const currentPrice = pos.type === 'BUY' ? quote.bid : quote.ask;
                let triggerReason = null;
                if (pos.type === 'BUY') {
                    if (pos.stopLoss && quote.bid <= pos.stopLoss)
                        triggerReason = 'STOP_LOSS';
                    else if (pos.takeProfit && quote.bid >= pos.takeProfit)
                        triggerReason = 'TAKE_PROFIT';
                }
                else {
                    if (pos.stopLoss && quote.ask >= pos.stopLoss)
                        triggerReason = 'STOP_LOSS';
                    else if (pos.takeProfit && quote.ask <= pos.takeProfit)
                        triggerReason = 'TAKE_PROFIT';
                }
                if (triggerReason) {
                    await this.closePosition(pos.account.userId, pos.id, triggerReason).catch(() => { });
                    continue;
                }
                const meta = this.forexEngine.getPairMeta(pos.symbol);
                const pnl = meta
                    ? this.calculatePnl(pos.type, pos.entryPrice, currentPrice, pos.lots, meta.contractSize, pos.symbol, meta.pipSize).pnlUsd
                    : 0;
                const accData = accountPnlMap.get(pos.accountId) || { totalPnl: 0, positions: [] };
                accData.totalPnl += pnl;
                accData.positions.push({ ...pos, pnl });
                accountPnlMap.set(pos.accountId, accData);
            }
            for (const [accountId, data] of accountPnlMap.entries()) {
                const account = await this.prisma.account.findUnique({ where: { id: accountId } });
                if (!account || account.usedMargin <= 0)
                    continue;
                const equity = account.balance + data.totalPnl;
                const marginLevel = (equity / account.usedMargin) * 100;
                if (marginLevel < 50 && data.positions.length > 0) {
                    data.positions.sort((a, b) => a.pnl - b.pnl);
                    const worst = data.positions[0];
                    await this.closePosition(account.userId, worst.id, 'STOP_OUT').catch(() => { });
                }
            }
        }
        catch {
        }
    }
    async refreshAccountMetrics(accountId) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
            include: {
                positions: { where: { status: 'OPEN' } },
            },
        });
        if (!account)
            return;
        let totalUsedMargin = 0;
        let totalUnrealizedPnl = 0;
        for (const pos of account.positions) {
            totalUsedMargin += pos.requiredMargin;
            const quote = this.forexEngine.getQuote(pos.symbol);
            const meta = this.forexEngine.getPairMeta(pos.symbol);
            if (quote && meta) {
                const currentPrice = pos.type === 'BUY' ? quote.bid : quote.ask;
                const { pnlUsd } = this.calculatePnl(pos.type, pos.entryPrice, currentPrice, pos.lots, meta.contractSize, pos.symbol, meta.pipSize);
                totalUnrealizedPnl += pnlUsd;
            }
        }
        const equity = Number((account.balance + totalUnrealizedPnl).toFixed(2));
        const freeMargin = Number(Math.max(0, equity - totalUsedMargin).toFixed(2));
        const marginLevel = totalUsedMargin > 0 ? Number(((equity / totalUsedMargin) * 100).toFixed(1)) : 0;
        await this.prisma.account.update({
            where: { id: accountId },
            data: {
                equity,
                usedMargin: totalUsedMargin,
                freeMargin,
                marginLevel,
            },
        });
    }
    calculateMargin(price, lots, contractSize, leverage, symbol) {
        const notional = lots * (contractSize || 1) * price;
        const effectiveLeverage = leverage > 1 ? leverage : 1;
        return Number((notional / effectiveLeverage).toFixed(2));
    }
    calculatePnl(type, entryPrice, currentPrice, lots, contractSize, symbol, pipSize) {
        const priceDiff = type === 'BUY' ? currentPrice - entryPrice : entryPrice - currentPrice;
        const pnlPips = Number((priceDiff / (pipSize || 0.05)).toFixed(1));
        const pnlInr = priceDiff * lots * (contractSize || 1);
        return {
            pnlUsd: Number(pnlInr.toFixed(2)),
            pnlPips,
        };
    }
};
TradingService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        ForexEngineService,
        MarketGateway])
], TradingService);
export { TradingService };
//# sourceMappingURL=trading.service.js.map