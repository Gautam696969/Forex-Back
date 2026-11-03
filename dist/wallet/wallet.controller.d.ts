import { WalletService } from './wallet.service.js';
export declare class WalletController {
    private walletService;
    constructor(walletService: WalletService);
    resetBalance(req: any): Promise<{
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
    depositFunds(req: any, body: {
        amount: number;
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
    getLedger(req: any): Promise<{
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
