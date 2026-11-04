import { AdminService } from './admin.service.js';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getStats(): Promise<{
        totalUsers: number;
        openPositions: number;
        totalTrades: number;
        activePairs: number;
        totalPlatformBalance: number;
        totalVolumeLots: number;
        totalRealizedPnl: number;
    }>;
    getUsers(): Promise<{
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
    adjustBalance(req: any, targetUserId: string, body: {
        amount: number;
        reason: string;
    }): Promise<{
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
    resetUser(req: any, targetUserId: string, body: {
        reason: string;
    }): Promise<{
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
    updatePair(req: any, pairId: string, body: {
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
        status: string;
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
