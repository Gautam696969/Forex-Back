var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { MarketGateway } from '../market/market.gateway.js';
let WalletService = class WalletService {
    prisma;
    marketGateway;
    constructor(prisma, marketGateway) {
        this.prisma = prisma;
        this.marketGateway = marketGateway;
    }
    async resetDemoBalance(userId) {
        const account = await this.prisma.account.findUnique({
            where: { userId },
            include: { positions: { where: { status: 'OPEN' } } },
        });
        if (!account)
            throw new NotFoundException('Account not found');
        await this.prisma.position.updateMany({
            where: { accountId: account.id, status: 'OPEN' },
            data: { status: 'CLOSED', closedAt: new Date() },
        });
        await this.prisma.order.updateMany({
            where: { accountId: account.id, status: 'PENDING' },
            data: { status: 'CANCELLED' },
        });
        const balanceBefore = account.balance;
        const balanceAfter = 100000.0;
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
    async depositVirtualFunds(userId, amount) {
        if (amount <= 0 || amount > 500000) {
            throw new BadRequestException('Deposit amount must be between ₹1,000 and ₹5,00,000');
        }
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account)
            throw new NotFoundException('Account not found');
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
    async getLedger(userId) {
        const account = await this.prisma.account.findUnique({
            where: { userId },
        });
        if (!account)
            throw new NotFoundException('Account not found');
        return this.prisma.accountLedger.findMany({
            where: { accountId: account.id },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
};
WalletService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        MarketGateway])
], WalletService);
export { WalletService };
//# sourceMappingURL=wallet.service.js.map