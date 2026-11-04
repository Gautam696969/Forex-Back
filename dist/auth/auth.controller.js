var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, Get, Body, UseGuards, Request, Res, Req, HttpCode, HttpStatus, } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RegisterDto, LoginDto, SendOtpDto, SendEmailOtpDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto, } from './dto/auth.dto.js';
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    setAuthCookies(res, accessToken, refreshToken) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }
    clearAuthCookies(res) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('access_token', {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
        });
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
        });
    }
    async register(body, res) {
        const result = await this.authService.register(body);
        if (result.tokens) {
            this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
        }
        return result;
    }
    async login(body, res) {
        const result = await this.authService.login(body);
        this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
        return {
            success: true,
            user: result.user,
            token: result.tokens.accessToken,
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
        };
    }
    async sendOtp(body) {
        return this.authService.sendMobileOtp(body);
    }
    async sendEmailOtp(body) {
        return this.authService.sendEmailOtp(body.email, body.mobile);
    }
    async verifyOtp(body, res) {
        const result = await this.authService.verifyMobileOtp(body);
        if (result.tokens) {
            this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
        }
        return {
            ...result,
            token: result.tokens?.accessToken,
            accessToken: result.tokens?.accessToken,
        };
    }
    async refresh(req, bodyRefreshToken, res) {
        const rawToken = (req.cookies && req.cookies['refresh_token']) || bodyRefreshToken;
        const result = await this.authService.refreshAccessToken(rawToken);
        this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
        return {
            success: true,
            user: result.user,
            token: result.tokens.accessToken,
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
        };
    }
    async logout(req, bodyRefreshToken, res) {
        const rawToken = (req.cookies && req.cookies['refresh_token']) || bodyRefreshToken;
        this.clearAuthCookies(res);
        return this.authService.logout(rawToken);
    }
    async getMe(req) {
        return this.authService.getProfile(req.user.id);
    }
    async getProfile(req) {
        return this.authService.getProfile(req.user.id);
    }
    async forgotPassword(body) {
        return this.authService.forgotPassword(body.email);
    }
    async resetPassword(body) {
        return this.authService.resetPassword(body);
    }
};
__decorate([
    Post('register'),
    __param(0, Body()),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    Post('login'),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    Post('send-otp'),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendOtp", null);
__decorate([
    Post('send-email-otp'),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendEmailOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendEmailOtp", null);
__decorate([
    Post('verify-otp'),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyOtpDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    Post('refresh'),
    HttpCode(HttpStatus.OK),
    __param(0, Req()),
    __param(1, Body('refreshToken')),
    __param(2, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    Post('logout'),
    HttpCode(HttpStatus.OK),
    __param(0, Req()),
    __param(1, Body('refreshToken')),
    __param(2, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    UseGuards(JwtAuthGuard),
    Get('me'),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    UseGuards(JwtAuthGuard),
    Get('profile'),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    Post('forgot-password'),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    Post('reset-password'),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
AuthController = __decorate([
    Controller(['auth', 'api/auth']),
    __metadata("design:paramtypes", [AuthService])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map