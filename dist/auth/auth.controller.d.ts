import { AuthService } from './auth.service.js';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(body: {
        email: string;
        password: string;
        name: string;
    }): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
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
            } | null;
        };
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
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
            } | null;
        };
    }>;
    forgotPassword(body: {
        email: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
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
        } | null;
    }>;
}
