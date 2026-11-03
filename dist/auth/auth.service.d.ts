import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service.js';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(data: {
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
    login(data: {
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
    getProfile(userId: string): Promise<{
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
    forgotPassword(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateToken;
}
