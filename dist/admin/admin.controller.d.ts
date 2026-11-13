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
        mobile: string;
        pan: string | null;
        isVerified: boolean;
        kycStatus: string;
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
    adjustBalanceAlias(req: any, body: {
        userId: string;
        amount: number;
        reason: string;
    }): Promise<{
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
    resetUser(req: any, targetUserId: string, body: {
        reason: string;
    }): Promise<{
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
    resetUserAlias(req: any, body: {
        userId: string;
        reason: string;
    }): Promise<{
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
    updateUserKyc(req: any, targetUserId: string, body: {
        kycStatus: string;
    }): Promise<{
        success: boolean;
        user: {
            email: string;
            mobile: string;
            pan: string | null;
            id: string;
            full_name: string;
            password_hash: string;
            is_verified: boolean;
            kyc_status: string;
            demo_balance: number;
            created_at: Date;
            updated_at: Date;
            role: string;
        };
    }>;
    updateUserRole(req: any, targetUserId: string, body: {
        role: string;
    }): Promise<{
        success: boolean;
        user: {
            email: string;
            mobile: string;
            pan: string | null;
            id: string;
            full_name: string;
            password_hash: string;
            is_verified: boolean;
            kyc_status: string;
            demo_balance: number;
            created_at: Date;
            updated_at: Date;
            role: string;
        };
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
            full_name: string;
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
                mobile: string;
                id: string;
                full_name: string;
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
    closePositionForce(req: any, positionId: string, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
        result: {
            success: boolean;
            trade: {
                symbol: string;
                id: string;
                type: string;
                lots: number;
                stopLoss: number | null;
                takeProfit: number | null;
                productType: string;
                accountId: string;
                swap: number;
                commission: number;
                openedAt: Date;
                closedAt: Date;
                positionId: string;
                openPrice: number;
                closePrice: number;
                realizedPnl: number;
                realizedPips: number;
                closeReason: string;
            };
            realizedPnl: number;
            message: string;
        };
    }>;
    getAdminIpos(): Promise<({
        _count: {
            applications: number;
        };
    } & {
        symbol: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        about: string | null;
        companyName: string;
        priceBand: string;
        minPrice: number;
        maxPrice: number;
        lotSize: number;
        issueSize: string;
        openDate: Date;
        closeDate: Date;
        listingDate: Date | null;
        gmp: number | null;
        subscriptionRate: number;
    })[]>;
    updateAdminIpo(req: any, ipoId: string, body: {
        gmp?: number;
        status?: string;
        priceBand?: string;
        subscriptionRate?: number;
    }): Promise<{
        success: boolean;
        ipo: {
            symbol: string;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            about: string | null;
            companyName: string;
            priceBand: string;
            minPrice: number;
            maxPrice: number;
            lotSize: number;
            issueSize: string;
            openDate: Date;
            closeDate: Date;
            listingDate: Date | null;
            gmp: number | null;
            subscriptionRate: number;
        };
    }>;
    getAdminIpoApplications(): Promise<({
        user: {
            email: string;
            mobile: string;
            id: string;
            full_name: string;
        };
        ipo: {
            symbol: string;
            id: string;
            category: string;
            companyName: string;
            priceBand: string;
        };
    } & {
        status: string;
        id: string;
        userId: string;
        lots: number;
        shares: number;
        bidPrice: number;
        totalAmount: number;
        upiId: string;
        appliedAt: Date;
        ipoId: string;
    })[]>;
}
