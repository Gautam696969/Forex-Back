import { PrismaService } from '../prisma.service.js';
import { MarketGateway } from '../market/market.gateway.js';
export declare class WalletService {
    private prisma;
    private marketGateway;
    constructor(prisma: PrismaService, marketGateway: MarketGateway);
    resetDemoBalance(userId: string): Promise<{
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
    depositVirtualFunds(userId: string, amount: number): Promise<{
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
        ledger: {
            id: string;
            createdAt: Date;
            type: string;
            amount: number;
            balanceBefore: number;
            balanceAfter: number;
            note: string | null;
            accountId: string;
        };
        message: string;
    }>;
    getLedger(userId: string): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        amount: number;
        balanceBefore: number;
        balanceAfter: number;
        note: string | null;
        accountId: string;
    }[]>;
}
