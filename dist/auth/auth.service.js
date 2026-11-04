var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException, Logger, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service.js';
import { SmsService } from './sms.service.js';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    smsService;
    logger = new Logger(AuthService_1.name);
    constructor(prisma, jwtService, smsService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.smsService = smsService;
    }
    async register(dto) {
        if (dto.password !== dto.confirmPassword) {
            throw new BadRequestException('Password and confirm password do not match');
        }
        const cleanEmail = dto.email.toLowerCase().trim();
        const cleanMobile = dto.mobile.replace(/\D/g, '').trim();
        const existingEmail = await this.prisma.user.findUnique({
            where: { email: cleanEmail },
        });
        if (existingEmail) {
            throw new ConflictException('An account with this email address already exists');
        }
        const existingMobile = await this.prisma.user.findUnique({
            where: { mobile: cleanMobile },
        });
        if (existingMobile) {
            throw new ConflictException('An account with this mobile number already exists');
        }
        const password_hash = await bcrypt.hash(dto.password, 12);
        const accountNumber = `DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
        const user = await this.prisma.user.create({
            data: {
                full_name: dto.fullName.trim(),
                email: cleanEmail,
                mobile: cleanMobile,
                password_hash,
                is_verified: false,
                kyc_status: 'pending',
                demo_balance: 100000.0,
                role: 'USER',
                account: {
                    create: {
                        accountNumber,
                        balance: 100000.0,
                        equity: 100000.0,
                        freeMargin: 100000.0,
                        usedMargin: 0.0,
                        marginLevel: 0.0,
                        currency: 'INR',
                        leverage: 1,
                        isDemo: true,
                        ledgers: {
                            create: {
                                type: 'INITIAL_DEPOSIT',
                                amount: 100000.0,
                                balanceBefore: 0.0,
                                balanceAfter: 100000.0,
                                note: 'Initial ₹1,00,000 Paper Trading Demo Capital',
                            },
                        },
                    },
                },
            },
            include: {
                account: true,
            },
        });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = this.hashToken(otp);
        await this.prisma.otp.create({
            data: {
                mobile: cleanMobile,
                otp_hash: otpHash,
                expires_at: new Date(Date.now() + 10 * 60 * 1000),
                attempts: 0,
            },
        });
        await this.smsService.sendOtp(cleanMobile, otp);
        const tokens = await this.generateTokenPair(user);
        return {
            success: true,
            message: 'Registration successful! Verification OTP sent to your mobile.',
            user: this.sanitizeUser(user),
            tokens,
        };
    }
    async login(dto) {
        const rawIdentifier = dto.identifier.trim();
        const isMobile = /^[6-9]\d{9}$/.test(rawIdentifier);
        const user = await this.prisma.user.findFirst({
            where: isMobile
                ? { mobile: rawIdentifier }
                : { email: rawIdentifier.toLowerCase() },
            include: {
                account: true,
            },
        });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(dto.password, user.password_hash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.generateTokenPair(user);
        return {
            success: true,
            user: this.sanitizeUser(user),
            tokens,
        };
    }
    async sendMobileOtp(dto) {
        const cleanMobile = this.smsService.validateMobile(dto.mobile);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = this.hashToken(otp);
        const smsResult = await this.smsService.sendOtp(cleanMobile, otp);
        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev || smsResult.delivered) {
            await this.prisma.otp.deleteMany({
                where: { mobile: cleanMobile },
            });
            await this.prisma.otp.create({
                data: {
                    mobile: cleanMobile,
                    otp_hash: otpHash,
                    expires_at: new Date(Date.now() + 10 * 60 * 1000),
                    attempts: 0,
                },
            });
        }
        if (!smsResult.delivered) {
            const userMessage = smsResult.clientFriendlyMessage ||
                'OTP service is temporarily unavailable. Try again or use email OTP';
            return {
                success: false,
                delivered: false,
                error: userMessage,
                reason: userMessage,
                message: userMessage,
                cooldownSeconds: smsResult.cooldownSeconds || 30,
                canEmail: true,
            };
        }
        return {
            success: true,
            delivered: true,
            message: `OTP sent successfully to +91-${cleanMobile}`,
            messageId: smsResult.messageId,
            cooldownSeconds: 30,
        };
    }
    async sendEmailOtp(rawEmail, rawMobile) {
        const cleanEmail = rawEmail.toLowerCase().trim();
        const cleanMobile = rawMobile ? rawMobile.replace(/\D/g, '').trim() : '';
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = this.hashToken(otp);
        await this.prisma.otp.deleteMany({
            where: {
                OR: [
                    { mobile: cleanEmail },
                    ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
                ],
            },
        });
        await this.prisma.otp.create({
            data: {
                mobile: cleanEmail,
                otp_hash: otpHash,
                expires_at: new Date(Date.now() + 10 * 60 * 1000),
                attempts: 0,
            },
        });
        if (cleanMobile) {
            await this.prisma.otp.create({
                data: {
                    mobile: cleanMobile,
                    otp_hash: otpHash,
                    expires_at: new Date(Date.now() + 10 * 60 * 1000),
                    attempts: 0,
                },
            });
        }
        if (process.env.NODE_ENV !== 'production') {
            console.log(`\n\x1b[33m🔑 [DEV MODE OTP] FourX Email OTP for ${cleanEmail} is: \x1b[1m${otp}\x1b[0m\x1b[33m (NODE_ENV=development)\x1b[0m\n`);
        }
        await this.smsService.sendEmailOtp(cleanEmail, otp);
        return {
            success: true,
            delivered: true,
            message: `OTP sent successfully to email: ${cleanEmail}`,
            cooldownSeconds: 30,
        };
    }
    async verifyMobileOtp(dto) {
        const targetIdentifier = dto.email
            ? dto.email.toLowerCase().trim()
            : dto.mobile
                ? dto.mobile.replace(/\D/g, '').trim()
                : '';
        if (!targetIdentifier) {
            throw new BadRequestException('Mobile number or email is required for OTP verification');
        }
        const otpHash = this.hashToken(dto.otp.trim());
        const activeOtp = await this.prisma.otp.findFirst({
            where: {
                mobile: targetIdentifier,
                expires_at: { gt: new Date() },
            },
            orderBy: { created_at: 'desc' },
        });
        if (!activeOtp) {
            throw new UnauthorizedException('OTP has expired or does not exist. Please request a new one.');
        }
        if (activeOtp.attempts >= 3) {
            await this.prisma.otp.delete({ where: { id: activeOtp.id } });
            throw new UnauthorizedException('Maximum OTP attempts exceeded. Please request a new OTP.');
        }
        if (activeOtp.otp_hash !== otpHash) {
            await this.prisma.otp.update({
                where: { id: activeOtp.id },
                data: { attempts: activeOtp.attempts + 1 },
            });
            throw new UnauthorizedException('Invalid OTP. Please check and try again.');
        }
        await this.prisma.otp.delete({ where: { id: activeOtp.id } });
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [{ mobile: targetIdentifier }, { email: targetIdentifier }],
            },
            include: { account: true },
        });
        if (user) {
            if (!user.is_verified) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { is_verified: true },
                    include: { account: true },
                });
            }
            const tokens = await this.generateTokenPair(user);
            return {
                success: true,
                user: this.sanitizeUser(user),
                tokens,
            };
        }
        return {
            success: true,
            verified: true,
            message: 'Verification successful. Please complete account registration.',
        };
    }
    async refreshAccessToken(rawRefreshToken) {
        if (!rawRefreshToken) {
            throw new UnauthorizedException('Refresh token is required');
        }
        const tokenHash = this.hashToken(rawRefreshToken);
        const storedToken = await this.prisma.refreshToken.findFirst({
            where: {
                token_hash: tokenHash,
                revoked: false,
                expires_at: { gt: new Date() },
            },
            include: {
                user: {
                    include: { account: true },
                },
            },
        });
        if (!storedToken || !storedToken.user) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked: true },
        });
        const tokens = await this.generateTokenPair(storedToken.user);
        return {
            success: true,
            tokens,
            user: this.sanitizeUser(storedToken.user),
        };
    }
    async logout(rawRefreshToken) {
        if (rawRefreshToken) {
            const tokenHash = this.hashToken(rawRefreshToken);
            await this.prisma.refreshToken.updateMany({
                where: { token_hash: tokenHash },
                data: { revoked: true },
            });
        }
        return {
            success: true,
            message: 'Logged out successfully',
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                account: true,
            },
        });
        if (!user) {
            throw new NotFoundException('User profile not found');
        }
        return this.sanitizeUser(user);
    }
    async forgotPassword(email) {
        const cleanEmail = email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({
            where: { email: cleanEmail },
        });
        if (user) {
            const resetToken = this.jwtService.sign({ sub: user.id, email: user.email, type: 'pwd_reset' }, {
                secret: process.env.JWT_SECRET || 'fourx_ultra_secure_jwt_secret_key_2026_x89a',
                expiresIn: '1h',
            });
            this.logger.log(`[Email Service] Password reset token generated for ${cleanEmail}`);
            console.log(`\n========================================================`);
            console.log(`🔑 [Password Reset] Link for ${cleanEmail}: http://localhost:3000/forgot-password?token=${resetToken}`);
            console.log(`========================================================\n`);
        }
        return {
            success: true,
            message: 'If an account exists for this email, password reset instructions have been sent.',
        };
    }
    async resetPassword(dto) {
        let payload;
        try {
            payload = this.jwtService.verify(dto.token, {
                secret: process.env.JWT_SECRET || 'fourx_ultra_secure_jwt_secret_key_2026_x89a',
            });
        }
        catch {
            throw new UnauthorizedException('Invalid or expired password reset token');
        }
        if (payload.type !== 'pwd_reset') {
            throw new UnauthorizedException('Invalid token type');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const password_hash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password_hash },
        });
        await this.prisma.refreshToken.updateMany({
            where: { user_id: user.id },
            data: { revoked: true },
        });
        return {
            success: true,
            message: 'Password reset successfully. You can now login with your new password.',
        };
    }
    async generateTokenPair(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET || 'fourx_ultra_secure_jwt_secret_key_2026_x89a',
            expiresIn: '15m',
        });
        const rawRefreshToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(rawRefreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.prisma.refreshToken.create({
            data: {
                user_id: user.id,
                token_hash: tokenHash,
                expires_at: expiresAt,
                revoked: false,
            },
        });
        return {
            accessToken,
            refreshToken: rawRefreshToken,
            expiresIn: 900,
        };
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            name: user.full_name,
            fullName: user.full_name,
            email: user.email,
            mobile: user.mobile,
            phone: user.mobile,
            isVerified: user.is_verified,
            kycStatus: user.kyc_status,
            demoBalance: user.demo_balance,
            role: user.role,
            account: user.account,
        };
    }
};
AuthService = AuthService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService,
        SmsService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map