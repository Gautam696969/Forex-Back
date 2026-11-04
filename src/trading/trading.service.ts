import {
  Injectable,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ForexEngineService, PairTick } from '../market/forex-engine.service.js';
import { MarketGateway } from '../market/market.gateway.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class TradingService implements OnModuleInit {
  private lastEvaluationTime = 0;

  constructor(
    private prisma: PrismaService,
    private forexEngine: ForexEngineService,
    private marketGateway: MarketGateway,
  ) {}

  onModuleInit() {
    // Listen to market ticks to continuously evaluate SL/TP, pending orders, and margin
    this.forexEngine.on('ticks', async (ticks: PairTick[]) => {
      const now = Date.now();
      // Throttle heavy DB position checks to every 1000ms
      if (now - this.lastEvaluationTime > 1000) {
        this.lastEvaluationTime = now;
        await this.evaluateActiveTradingState(ticks);
      }
    });
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
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

    // Validate lot size
    if (dto.lots < pair.minLot || dto.lots > pair.maxLot) {
      throw new BadRequestException(
        `Lot size must be between ${pair.minLot} and ${pair.maxLot} lots`,
      );
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

    // Market Order Execution
    const entryPrice = dto.type === 'BUY' ? liveQuote.ask : liveQuote.bid;

    // Calculate required margin
    const requiredMargin = this.calculateMargin(
      entryPrice,
      dto.lots,
      pair.contractSize,
      account.leverage,
      dto.symbol,
    );

    if (account.freeMargin < requiredMargin) {
      throw new BadRequestException(
        `Insufficient funds. Required: ₹${requiredMargin.toLocaleString('en-IN')}, Available: ₹${account.freeMargin.toLocaleString('en-IN')}`,
      );
    }

    // Create Position in DB
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

    // Update account margins
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

  async closePosition(userId: string, positionId: string, reason: string = 'MANUAL') {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) throw new NotFoundException('Account not found');

    const position = await this.prisma.position.findFirst({
      where: { id: positionId, accountId: account.id, status: 'OPEN' },
    });

    if (!position) {
      throw new NotFoundException('Open position not found or already closed');
    }

    const pair = await this.prisma.currencyPair.findUnique({
      where: { symbol: position.symbol },
    });

    if (!pair) throw new NotFoundException('Pair not found');

    const liveQuote = this.forexEngine.getQuote(position.symbol);
    const closePrice = position.type === 'BUY'
      ? (liveQuote ? liveQuote.bid : position.currentPrice)
      : (liveQuote ? liveQuote.ask : position.currentPrice);

    // Calculate realized PnL
    const { pnlUsd, pnlPips } = this.calculatePnl(
      position.type,
      position.entryPrice,
      closePrice,
      position.lots,
      pair.contractSize,
      position.symbol,
      pair.pipSize,
    );

    const balanceBefore = account.balance;
    const balanceAfter = Number((account.balance + pnlUsd).toFixed(2));

    // Execute in transaction
    const [closedPos, trade, updatedAccount, ledger] = await this.prisma.$transaction([
      // 1. Mark position CLOSED
      this.prisma.position.update({
        where: { id: position.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          currentPrice: closePrice,
          unrealizedPnl: pnlUsd,
        },
      }),

      // 2. Record TradeHistory
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

      // 3. Update Account
      this.prisma.account.update({
        where: { id: account.id },
        data: {
          balance: balanceAfter,
          usedMargin: Math.max(0, account.usedMargin - position.requiredMargin),
        },
      }),

      // 4. Ledger record
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

    // Recalculate full equity and free margin
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

  async closeAllPositions(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) throw new NotFoundException('Account not found');

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

  async modifyPosition(
    userId: string,
    positionId: string,
    slTp: { stopLoss?: number | null; takeProfit?: number | null },
  ) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) throw new NotFoundException('Account not found');

    const position = await this.prisma.position.findFirst({
      where: { id: positionId, accountId: account.id, status: 'OPEN' },
    });

    if (!position) throw new NotFoundException('Open position not found');

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

  async getOpenPositions(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) return [];

    const positions = await this.prisma.position.findMany({
      where: { accountId: account.id, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    // Populate current live prices and unrealized PnL
    return positions.map((pos) => {
      const live = this.forexEngine.getQuote(pos.symbol);
      const meta = this.forexEngine.getPairMeta(pos.symbol);
      const currentPrice = live
        ? pos.type === 'BUY' ? live.bid : live.ask
        : pos.currentPrice;

      const pnlData = meta
        ? this.calculatePnl(
            pos.type,
            pos.entryPrice,
            currentPrice,
            pos.lots,
            meta.contractSize,
            pos.symbol,
            meta.pipSize,
          )
        : { pnlUsd: pos.unrealizedPnl, pnlPips: pos.unrealizedPips };

      return {
        ...pos,
        currentPrice,
        unrealizedPnl: pnlData.pnlUsd,
        unrealizedPips: pnlData.pnlPips,
      };
    });
  }

  async getPendingOrders(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) return [];

    return this.prisma.order.findMany({
      where: { accountId: account.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) throw new NotFoundException('Account not found');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, accountId: account.id, status: 'PENDING' },
    });

    if (!order) throw new NotFoundException('Pending order not found');

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    this.marketGateway.notifyAccount(account.id, 'order:cancelled', { orderId });
    return { success: true, message: 'Order cancelled successfully' };
  }

  async getTradeHistory(
    userId: string,
    filters?: { symbol?: string; limit?: number; offset?: number },
  ) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) return [];

    const where: any = { accountId: account.id };
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

  async getAccountSummary(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) throw new NotFoundException('Account not found');

    const openPositions = await this.getOpenPositions(userId);
    const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    const totalUsedMargin = openPositions.reduce((sum, p) => sum + p.requiredMargin, 0);

    const equity = Number((account.balance + totalUnrealizedPnl).toFixed(2));
    const freeMargin = Number(Math.max(0, equity - totalUsedMargin).toFixed(2));
    const marginLevel = totalUsedMargin > 0 ? Number(((equity / totalUsedMargin) * 100).toFixed(1)) : 0;

    // Trade stats
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

  // Periodic evaluation of SL/TP, pending orders, and Stop Out
  private async evaluateActiveTradingState(ticks: PairTick[]) {
    try {
      const quoteMap = new Map(ticks.map((t) => [t.symbol, t]));

      // 1. Check Pending Orders
      const pendingOrders = await this.prisma.order.findMany({
        where: { status: 'PENDING' },
      });

      for (const order of pendingOrders) {
        const quote = quoteMap.get(order.symbol);
        if (!quote || !order.targetPrice) continue;

        let shouldExecute = false;
        let executeType: 'BUY' | 'SELL' = 'BUY';

        if (order.type === 'BUY_LIMIT' && quote.ask <= order.targetPrice) {
          shouldExecute = true;
          executeType = 'BUY';
        } else if (order.type === 'SELL_LIMIT' && quote.bid >= order.targetPrice) {
          shouldExecute = true;
          executeType = 'SELL';
        } else if (order.type === 'BUY_STOP' && quote.ask >= order.targetPrice) {
          shouldExecute = true;
          executeType = 'BUY';
        } else if (order.type === 'SELL_STOP' && quote.bid <= order.targetPrice) {
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
            }).catch(() => {});
          }
        }
      }

      // 2. Check Open Positions for SL / TP
      const openPositions = await this.prisma.position.findMany({
        where: { status: 'OPEN' },
        include: { account: true },
      });

      const accountPnlMap = new Map<string, { totalPnl: number; positions: any[] }>();

      for (const pos of openPositions) {
        const quote = quoteMap.get(pos.symbol);
        if (!quote) continue;

        const currentPrice = pos.type === 'BUY' ? quote.bid : quote.ask;
        let triggerReason: string | null = null;

        // Check SL / TP
        if (pos.type === 'BUY') {
          if (pos.stopLoss && quote.bid <= pos.stopLoss) triggerReason = 'STOP_LOSS';
          else if (pos.takeProfit && quote.bid >= pos.takeProfit) triggerReason = 'TAKE_PROFIT';
        } else {
          if (pos.stopLoss && quote.ask >= pos.stopLoss) triggerReason = 'STOP_LOSS';
          else if (pos.takeProfit && quote.ask <= pos.takeProfit) triggerReason = 'TAKE_PROFIT';
        }

        if (triggerReason) {
          await this.closePosition(pos.account.userId, pos.id, triggerReason).catch(() => {});
          continue;
        }

        // Aggregate open PnL for Stop-out calculation
        const meta = this.forexEngine.getPairMeta(pos.symbol);
        const pnl = meta
          ? this.calculatePnl(
              pos.type,
              pos.entryPrice,
              currentPrice,
              pos.lots,
              meta.contractSize,
              pos.symbol,
              meta.pipSize,
            ).pnlUsd
          : 0;

        const accData = accountPnlMap.get(pos.accountId) || { totalPnl: 0, positions: [] };
        accData.totalPnl += pnl;
        accData.positions.push({ ...pos, pnl });
        accountPnlMap.set(pos.accountId, accData);
      }

      // 3. Stop-Out Check (Margin Level < 50%)
      for (const [accountId, data] of accountPnlMap.entries()) {
        const account = await this.prisma.account.findUnique({ where: { id: accountId } });
        if (!account || account.usedMargin <= 0) continue;

        const equity = account.balance + data.totalPnl;
        const marginLevel = (equity / account.usedMargin) * 100;

        if (marginLevel < 50 && data.positions.length > 0) {
          // Liquidate worst losing position
          data.positions.sort((a, b) => a.pnl - b.pnl);
          const worst = data.positions[0];
          await this.closePosition(account.userId, worst.id, 'STOP_OUT').catch(() => {});
        }
      }
    } catch {
      // suppress transient loop errors
    }
  }

  private async refreshAccountMetrics(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        positions: { where: { status: 'OPEN' } },
      },
    });

    if (!account) return;

    let totalUsedMargin = 0;
    let totalUnrealizedPnl = 0;

    for (const pos of account.positions) {
      totalUsedMargin += pos.requiredMargin;
      const quote = this.forexEngine.getQuote(pos.symbol);
      const meta = this.forexEngine.getPairMeta(pos.symbol);
      if (quote && meta) {
        const currentPrice = pos.type === 'BUY' ? quote.bid : quote.ask;
        const { pnlUsd } = this.calculatePnl(
          pos.type,
          pos.entryPrice,
          currentPrice,
          pos.lots,
          meta.contractSize,
          pos.symbol,
          meta.pipSize,
        );
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

  // Helper: Margin Calculator (Indian Market: Intraday 5x, Delivery 1x)
  private calculateMargin(
    price: number,
    lots: number,
    contractSize: number,
    leverage: number,
    symbol: string,
  ): number {
    const notional = lots * (contractSize || 1) * price;
    // Standard margin: 1x (or 5x if leverage > 1 for intraday)
    const effectiveLeverage = leverage > 1 ? leverage : 1;
    return Number((notional / effectiveLeverage).toFixed(2));
  }

  // Helper: PnL & Points Calculator (INR)
  private calculatePnl(
    type: string,
    entryPrice: number,
    currentPrice: number,
    lots: number,
    contractSize: number,
    symbol: string,
    pipSize: number,
  ): { pnlUsd: number; pnlPips: number } {
    const priceDiff = type === 'BUY' ? currentPrice - entryPrice : entryPrice - currentPrice;
    const pnlPips = Number((priceDiff / (pipSize || 0.05)).toFixed(1));
    const pnlInr = priceDiff * lots * (contractSize || 1);

    return {
      pnlUsd: Number(pnlInr.toFixed(2)),
      pnlPips,
    };
  }
}
