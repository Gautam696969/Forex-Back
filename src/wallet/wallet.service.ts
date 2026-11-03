import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { MarketGateway } from '../market/market.gateway.js';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private marketGateway: MarketGateway,
  ) {}

  async resetDemoBalance(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
      include: { positions: { where: { status: 'OPEN' } } },
    });

    if (!account) throw new NotFoundException('Account not found');

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
    const balanceAfter = 10000.0;
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
          note: 'User initiated reset of virtual demo balance to $10,000.00',
        },
      }),
    ]);

    this.marketGateway.notifyAccount(account.id, 'wallet:reset', updatedAccount);

    return {
      success: true,
      account: updatedAccount,
      message: 'Demo balance successfully reset to $10,000.00',
    };
  }

  async depositVirtualFunds(userId: string, amount: number) {
    if (amount <= 0 || amount > 100000) {
      throw new BadRequestException('Deposit amount must be between $1 and $100,000');
    }

    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) throw new NotFoundException('Account not found');

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
          note: `Virtual demo deposit of $${amount.toLocaleString()}`,
        },
      }),
    ]);

    this.marketGateway.notifyAccount(account.id, 'wallet:deposit', updatedAccount);

    return {
      success: true,
      account: updatedAccount,
      message: `$${amount.toLocaleString()} virtual demo funds added successfully`,
    };
  }

  async getLedger(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) return [];

    return this.prisma.accountLedger.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
