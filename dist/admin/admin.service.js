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
import { ForexEngineService } from '../market/forex-engine.service.js';
import { MarketGateway } from '../market/market.gateway.js';
let AdminService = class AdminService {
    prisma;
    forexEngine;
    marketGateway;
    constructor(prisma, forexEngine, marketGateway) {
        this.prisma = prisma;
        this.forexEngine = forexEngine;
        this.marketGateway = marketGateway;
    }
    async getAdminStats() {
        const totalUsers = await this.prisma.user.count({ where: { role: 'USER' } });
        const openPositions = await this.prisma.position.count({ where: { status: 'OPEN' } });
        const totalTrades = await this.prisma.tradeHistory.count();
        const activePairs = await this.prisma.currencyPair.count({ where: { active: true } });
        const accounts = await this.prisma.account.findMany();
        const totalPlatformBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
        const trades = await this.prisma.tradeHistory.findMany({
            select: { realizedPnl: true, lots: true },
        });
        const totalVolumeLots = trades.reduce((sum, t) => sum + t.lots, 0);
        const totalRealizedPnl = trades.reduce((sum, t) => sum + t.realizedPnl, 0);
        return {
            totalUsers,
            openPositions,
            totalTrades,
            activePairs,
            totalPlatformBalance: Number(totalPlatformBalance.toFixed(2)),
            totalVolumeLots: Number(totalVolumeLots.toFixed(2)),
            totalRealizedPnl: Number(totalRealizedPnl.toFixed(2)),
        };
    }
    async getAllUsers() {
        const users = await this.prisma.user.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                account: {
                    include: {
                        positions: { where: { status: 'OPEN' } },
                        tradeHistory: true,
                    },
                },
            },
        });
        return users.map((u) => {
            const history = u.account?.tradeHistory || [];
            const totalTrades = history.length;
            const totalPnl = history.reduce((sum, t) => sum + t.realizedPnl, 0);
            const wins = history.filter((t) => t.realizedPnl > 0).length;
            const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;
            return {
                id: u.id,
                name: u.full_name,
                email: u.email,
                role: u.role,
                createdAt: u.created_at,
                accountNumber: u.account?.accountNumber,
                balance: u.account?.balance,
                equity: u.account?.equity,
                openPositionsCount: u.account?.positions.length || 0,
                totalTrades,
                winRate,
                totalPnl: Number(totalPnl.toFixed(2)),
            };
        });
    }
    async adjustUserBalance(adminId, adminEmail, targetUserId, amount, reason) {
        if (!reason || reason.trim().length < 5) {
            throw new BadRequestException('A clear justification reason (at least 5 characters) is required for audit logs');
        }
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            include: { account: true },
        });
        if (!targetUser || !targetUser.account) {
            throw new NotFoundException('Target user or account not found');
        }
        const balanceBefore = targetUser.account.balance;
        const balanceAfter = Number((balanceBefore + amount).toFixed(2));
        if (balanceAfter < 0) {
            throw new BadRequestException('Balance cannot be negative');
        }
        const [updatedAccount, auditLog] = await this.prisma.$transaction([
            this.prisma.account.update({
                where: { id: targetUser.account.id },
                data: {
                    balance: balanceAfter,
                    equity: Number((targetUser.account.equity + amount).toFixed(2)),
                    freeMargin: Number((targetUser.account.freeMargin + amount).toFixed(2)),
                },
            }),
            this.prisma.auditLog.create({
                data: {
                    adminId,
                    adminEmail,
                    action: 'ADJUST_BALANCE',
                    targetUserId,
                    details: `Adjusted balance by ${amount >= 0 ? '+$' : '-$'}${Math.abs(amount)} (Old: $${balanceBefore}, New: $${balanceAfter})`,
                    reason,
                },
            }),
            this.prisma.accountLedger.create({
                data: {
                    accountId: targetUser.account.id,
                    type: 'ADMIN_ADJUSTMENT',
                    amount,
                    balanceBefore,
                    balanceAfter,
                    note: `Admin Adjustment by ${adminEmail}: ${reason}`,
                },
            }),
        ]);
        this.marketGateway.notifyAccount(targetUser.account.id, 'account:adjusted', updatedAccount);
        return {
            success: true,
            account: updatedAccount,
            message: `Balance adjusted successfully. New balance: $${balanceAfter}`,
        };
    }
    async resetUserDemoAccount(adminId, adminEmail, targetUserId, reason) {
        if (!reason || reason.trim().length < 5) {
            throw new BadRequestException('A reason is mandatory for audit logging');
        }
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            include: { account: true },
        });
        if (!targetUser || !targetUser.account) {
            throw new NotFoundException('Target user or account not found');
        }
        await this.prisma.position.updateMany({
            where: { accountId: targetUser.account.id, status: 'OPEN' },
            data: { status: 'CLOSED', closedAt: new Date() },
        });
        const balanceBefore = targetUser.account.balance;
        const balanceAfter = 10000.0;
        const [updatedAccount] = await this.prisma.$transaction([
            this.prisma.account.update({
                where: { id: targetUser.account.id },
                data: {
                    balance: 10000.0,
                    equity: 10000.0,
                    usedMargin: 0.0,
                    freeMargin: 10000.0,
                    marginLevel: 0.0,
                },
            }),
            this.prisma.auditLog.create({
                data: {
                    adminId,
                    adminEmail,
                    action: 'RESET_BALANCE',
                    targetUserId,
                    details: `Admin reset virtual balance to $10,000.00 (from $${balanceBefore})`,
                    reason,
                },
            }),
            this.prisma.accountLedger.create({
                data: {
                    accountId: targetUser.account.id,
                    type: 'RESET_BALANCE',
                    amount: 10000.0 - balanceBefore,
                    balanceBefore,
                    balanceAfter: 10000.0,
                    note: `Admin Reset by ${adminEmail}: ${reason}`,
                },
            }),
        ]);
        this.marketGateway.notifyAccount(targetUser.account.id, 'wallet:reset', updatedAccount);
        return {
            success: true,
            account: updatedAccount,
            message: `User demo account reset to $10,000.00`,
        };
    }
    async updatePairSettings(adminId, adminEmail, pairId, data) {
        const pair = await this.prisma.currencyPair.findUnique({ where: { id: pairId } });
        if (!pair)
            throw new NotFoundException('Pair not found');
        const updated = await this.prisma.currencyPair.update({
            where: { id: pairId },
            data: {
                defaultSpread: data.defaultSpread !== undefined ? data.defaultSpread : pair.defaultSpread,
                active: data.active !== undefined ? data.active : pair.active,
                minLot: data.minLot !== undefined ? data.minLot : pair.minLot,
                maxLot: data.maxLot !== undefined ? data.maxLot : pair.maxLot,
            },
        });
        if (data.defaultSpread !== undefined) {
            this.forexEngine.updatePairSpread(pair.symbol, data.defaultSpread);
        }
        await this.prisma.auditLog.create({
            data: {
                adminId,
                adminEmail,
                action: 'CHANGE_PAIR_SETTINGS',
                details: `Updated settings for ${pair.symbol}: Spread=${updated.defaultSpread}, Active=${updated.active}`,
                reason: 'Platform parameter adjustment by Admin',
            },
        });
        return { success: true, pair: updated };
    }
    async getAuditLogs() {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                targetUser: { select: { id: true, email: true, name: true } },
            },
        });
    }
    async getAllPositions() {
        return this.prisma.position.findMany({
            where: { status: 'OPEN' },
            orderBy: { openedAt: 'desc' },
            include: {
                account: {
                    include: {
                        user: { select: { email: true, name: true } },
                    },
                },
            },
        });
    }
};
AdminService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        ForexEngineService,
        MarketGateway])
], AdminService);
export { AdminService };
//# sourceMappingURL=admin.service.js.map