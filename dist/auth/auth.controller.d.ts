import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto, SendOtpDto, SendEmailOtpDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto, ResetPasswordOtpDto } from './dto/auth.dto.js';
import type { Response, Request as ExpressRequest } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    private setAuthCookies;
    private clearAuthCookies;
    register(body: RegisterDto, res: Response): Promise<{
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
    login(body: LoginDto, res: Response): Promise<{
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
        token: string;
        accessToken: string;
        refreshToken: string;
    }>;
    sendOtp(body: SendOtpDto): Promise<{
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
    sendEmailOtp(body: SendEmailOtpDto): Promise<{
        success: boolean;
        delivered: boolean;
        message: string;
        cooldownSeconds: number;
    }>;
    verifyOtp(body: VerifyOtpDto, res: Response): Promise<{
        token: string | undefined;
        accessToken: string | undefined;
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
        token: string | undefined;
        accessToken: string | undefined;
        success: boolean;
        verified: boolean;
        message: string;
        user?: undefined;
        tokens?: undefined;
    }>;
    refresh(req: ExpressRequest, bodyRefreshToken: string, res: Response): Promise<Response<any, Record<string, any>>>;
    logout(req: ExpressRequest, bodyRefreshToken: string, res: Response): Promise<{
        success: boolean;
        message: string;
    }>;
    getMe(req: any): Promise<{
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
    getProfile(req: any): Promise<{
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
    forgotPassword(body: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(body: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPasswordOtp(body: ResetPasswordOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
