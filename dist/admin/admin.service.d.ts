import { PrismaService } from '../prisma.service.js';
import { ForexEngineService } from '../market/forex-engine.service.js';
import { MarketGateway } from '../market/market.gateway.js';
export declare class AdminService {
    private prisma;
    private forexEngine;
    private marketGateway;
    constructor(prisma: PrismaService, forexEngine: ForexEngineService, marketGateway: MarketGateway);
    getAdminStats(): Promise<{
        totalUsers: number;
        openPositions: number;
        totalTrades: number;
        activePairs: number;
        totalPlatformBalance: number;
        totalVolumeLots: number;
        totalRealizedPnl: number;
    }>;
    getAllUsers(): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: Date;
        accountNumber: string | undefined;
        balance: number | undefined;
        equity: number | undefined;
        openPositionsCount: number;
        totalTrades: number;
        winRate: number;
        totalPnl: number;
    }[]>;
    adjustUserBalance(adminId: string, adminEmail: string, targetUserId: string, amount: number, reason: string): Promise<{
        success: boolean;
        account: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            accountNumber: string;
            balance: number;
            equity: number;
            usedMargin: number;
            freeMargin: number;
            marginLevel: number;
            currency: string;
            leverage: number;
            isDemo: boolean;
            userId: string;
        };
        message: string;
    }>;
    resetUserDemoAccount(adminId: string, adminEmail: string, targetUserId: string, reason: string): Promise<{
        success: boolean;
        account: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            accountNumber: string;
            balance: number;
            equity: number;
            usedMargin: number;
            freeMargin: number;
            marginLevel: number;
            currency: string;
            leverage: number;
            isDemo: boolean;
            userId: string;
        };
        message: string;
    }>;
    updatePairSettings(adminId: string, adminEmail: string, pairId: string, data: {
        defaultSpread?: number;
        active?: boolean;
        minLot?: number;
        maxLot?: number;
    }): Promise<{
        success: boolean;
        pair: {
            symbol: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            base: string;
            quote: string;
            displayName: string;
            category: string;
            digits: number;
            pipSize: number;
            contractSize: number;
            defaultSpread: number;
            minLot: number;
            maxLot: number;
            lotStep: number;
            currentBid: number;
            currentAsk: number;
            change24h: number;
            high24h: number;
            low24h: number;
            active: boolean;
        };
    }>;
    getAuditLogs(): Promise<({
        targetUser: {
            id: string;
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        adminId: string;
        adminEmail: string;
        action: string;
        targetUserId: string | null;
        details: string;
        reason: string;
    })[]>;
    getAllPositions(): Promise<({
        account: {
            user: {
                email: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            accountNumber: string;
            balance: number;
            equity: number;
            usedMargin: number;
            freeMargin: number;
            marginLevel: number;
            currency: string;
            leverage: number;
            isDemo: boolean;
            userId: string;
        };
    } & {
        symbol: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        lots: number;
        stopLoss: number | null;
        takeProfit: number | null;
        status: string;
        accountId: string;
        entryPrice: number;
        currentPrice: number;
        requiredMargin: number;
        unrealizedPnl: number;
        unrealizedPips: number;
        swap: number;
        commission: number;
        openedAt: Date;
        closedAt: Date | null;
    })[]>;
}
