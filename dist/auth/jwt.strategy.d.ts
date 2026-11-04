import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma.service.js';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: {
        sub: string;
        email: string;
        role: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        fullName: string;
        mobile: string;
        isVerified: boolean;
        kycStatus: string;
        demoBalance: number;
        role: string;
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
        } | null;
    }>;
}
export {};
