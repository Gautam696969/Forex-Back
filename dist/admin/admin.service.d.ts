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
            accountNumber: string;
            balance: number;
            equity: number;
            usedMargin: number;
            freeMargin: number;
            marginLevel: number;
            currency: string;
            leverage: number;
            isDemo: boolean;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
        };
        message: string;
    }>;
    resetUserDemoAccount(adminId: string, adminEmail: string, targetUserId: string, reason: string): Promise<{
        success: boolean;
        account: {
            id: string;
            accountNumber: string;
            balance: number;
            equity: number;
            usedMargin: number;
            freeMargin: number;
            marginLevel: number;
            currency: string;
            leverage: number;
            isDemo: boolean;
            createdAt: Date;
            updatedAt: Date;
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
            displayName: string;
            base: string;
            quote: string;
            category: string;
            sector: string | null;
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
            open24h: number;
            close24h: number;
            volume24h: number;
            marketCap: string | null;
            peRatio: number | null;
            pbRatio: number | null;
            eps: number | null;
            dividendYield: number | null;
            roe: number | null;
            week52High: number | null;
            week52Low: number | null;
            about: string | null;
            active: boolean;
        };
    }>;
    getAuditLogs(): Promise<({
        targetUser: {
            email: string;
            id: string;
            name: never;
        } | null;
    } & {
        reason: string;
        id: string;
        createdAt: Date;
        adminId: string;
        adminEmail: string;
        action: string;
        targetUserId: string | null;
        details: string;
    })[]>;
    getAllPositions(): Promise<({
        account: {
            user: {
                email: string;
                name: never;
            };
        } & {
            id: string;
            accountNumber: string;
            balance: number;
            equity: number;
            usedMargin: number;
            freeMargin: number;
            marginLevel: number;
            currency: string;
            leverage: number;
            isDemo: boolean;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
        };
    } & {
        symbol: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        lots: number;
        stopLoss: number | null;
        takeProfit: number | null;
        productType: string;
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
