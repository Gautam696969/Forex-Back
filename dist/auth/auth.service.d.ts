import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service.js';
import { SmsService } from './sms.service.js';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, ResetPasswordDto } from './dto/auth.dto.js';
export declare class AuthService {
    private prisma;
    private jwtService;
    private smsService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, smsService: SmsService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        user: {
            id: any;
            name: any;
            fullName: any;
            email: any;
            mobile: any;
            phone: any;
            isVerified: any;
            kycStatus: any;
            demoBalance: any;
            role: any;
            account: any;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
    }>;
    login(dto: LoginDto): Promise<{
        success: boolean;
        user: {
            id: any;
            name: any;
            fullName: any;
            email: any;
            mobile: any;
            phone: any;
            isVerified: any;
            kycStatus: any;
            demoBalance: any;
            role: any;
            account: any;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
    }>;
    sendMobileOtp(dto: SendOtpDto): Promise<{
        success: boolean;
        delivered: boolean;
        error: string;
        reason: string;
        message: string;
        cooldownSeconds: number;
        canEmail: boolean;
        messageId?: undefined;
    } | {
        success: boolean;
        delivered: boolean;
        message: string;
        messageId: string | undefined;
        cooldownSeconds: number;
        error?: undefined;
        reason?: undefined;
        canEmail?: undefined;
    }>;
    sendEmailOtp(rawEmail: string, rawMobile?: string): Promise<{
        success: boolean;
        delivered: boolean;
        message: string;
        cooldownSeconds: number;
    }>;
    verifyMobileOtp(dto: VerifyOtpDto): Promise<{
        success: boolean;
        user: {
            id: any;
            name: any;
            fullName: any;
            email: any;
            mobile: any;
            phone: any;
            isVerified: any;
            kycStatus: any;
            demoBalance: any;
            role: any;
            account: any;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
        verified?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        verified: boolean;
        message: string;
        user?: undefined;
        tokens?: undefined;
    }>;
    refreshAccessToken(rawRefreshToken: string): Promise<{
        success: boolean;
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
        user: {
            id: any;
            name: any;
            fullName: any;
            email: any;
            mobile: any;
            phone: any;
            isVerified: any;
            kycStatus: any;
            demoBalance: any;
            role: any;
            account: any;
        };
    }>;
    logout(rawRefreshToken?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getProfile(userId: string): Promise<{
        id: any;
        name: any;
        fullName: any;
        email: any;
        mobile: any;
        phone: any;
        isVerified: any;
        kycStatus: any;
        demoBalance: any;
        role: any;
        account: any;
    }>;
    forgotPassword(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateTokenPair;
    private hashToken;
    private sanitizeUser;
}
