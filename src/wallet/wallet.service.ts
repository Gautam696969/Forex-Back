import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { MarketGateway } from '../market/market.gateway.js';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private marketGateway: MarketGateway,
  ) {}

  /**
   * Ensure user has a trading account with ₹1,00,000 demo capital.
   * Creates one automatically on first access if missing.
   */
  async getOrCreateAccount(userId: string) {
    let account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      const accountNumber = `DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
      account = await this.prisma.account.create({
        data: {
          userId,
          accountNumber,
          balance: 100000.0,
          equity: 100000.0,
          freeMargin: 100000.0,
          usedMargin: 0.0,
          marginLevel: 0.0,
          currency: 'INR',
          leverage: 1,
          isDemo: true,
          ledgers: {
            create: {
              type: 'INITIAL_DEPOSIT',
              amount: 100000.0,
              balanceBefore: 0.0,
              balanceAfter: 100000.0,
              note: 'Initial ₹1,00,000 Paper Trading Demo Capital',
            },
          },
        },
      });
    }

    return account;
  }

  async resetDemoBalance(userId: string) {
    const account = await this.getOrCreateAccount(userId);

    // Close any open positions
    await this.prisma.position.updateMany({
      where: { accountId: account.id, status: 'OPEN' },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    // Cancel pending orders
    await this.prisma.order.updateMany({
      where: { accountId: account.id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    const balanceBefore = account.balance;
    const balanceAfter = 100000.0; // ₹1,00,000 demo capital
    const diff = balanceAfter - balanceBefore;

    const [updatedAccount, ledger] = await this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: account.id },
        data: {
          balance: balanceAfter,
          equity: balanceAfter,
          freeMargin: balanceAfter,
          usedMargin: 0.0,
          marginLevel: 0.0,
        },
      }),
      this.prisma.accountLedger.create({
        data: {
          accountId: account.id,
          type: 'RESET_BALANCE',
          amount: diff,
          balanceBefore,
          balanceAfter,
          note: 'User initiated reset of virtual demo balance to ₹1,00,000.00',
        },
      }),
    ]);

    this.marketGateway.notifyAccount(account.id, 'wallet:reset', updatedAccount);

    return {
      success: true,
      account: updatedAccount,
      message: 'Demo balance successfully reset to ₹1,00,000.00',
    };
  }

  async depositVirtualFunds(userId: string, amount: number) {
    if (amount <= 0 || amount > 500000) {
      throw new BadRequestException('Deposit amount must be between ₹1,000 and ₹5,00,000');
    }

    const account = await this.getOrCreateAccount(userId);

    const balanceBefore = account.balance;
    const balanceAfter = Number((account.balance + amount).toFixed(2));
    const equityAfter = Number((account.equity + amount).toFixed(2));
    const freeMarginAfter = Number((account.freeMargin + amount).toFixed(2));

    const [updatedAccount, ledger] = await this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: account.id },
        data: {
          balance: balanceAfter,
          equity: equityAfter,
          freeMargin: freeMarginAfter,
        },
      }),
      this.prisma.accountLedger.create({
        data: {
          accountId: account.id,
          type: 'MANUAL_DEPOSIT',
          amount,
          balanceBefore,
          balanceAfter,
          note: `Virtual demo deposit of ₹${amount.toLocaleString('en-IN')}`,
        },
      }),
    ]);

    this.marketGateway.notifyAccount(account.id, 'wallet:deposit', updatedAccount);

    return {
      success: true,
      account: updatedAccount,
      ledger,
      message: `Successfully added ₹${amount.toLocaleString('en-IN')} demo capital`,
    };
  }

  async getLedger(userId: string) {
    const account = await this.getOrCreateAccount(userId);

    return this.prisma.accountLedger.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
