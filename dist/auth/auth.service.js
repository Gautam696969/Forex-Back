var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service.js';
import * as bcrypt from 'bcryptjs';
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(data) {
        const existing = await this.prisma.user.findUnique({
            where: { email: data.email.toLowerCase().trim() },
        });
        if (existing) {
            throw new ConflictException('An account with this email address already exists');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const accountNumber = `DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
        const user = await this.prisma.user.create({
            data: {
                email: data.email.toLowerCase().trim(),
                password: hashedPassword,
                name: data.name.trim(),
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
                                note: 'Initial ₹1,00,000 Paper Trading Capital',
                            },
                        },
                    },
                },
            },
            include: {
                account: true,
            },
        });
        const token = this.generateToken(user.id, user.email, user.role);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                account: user.account,
            },
        };
    }
    async login(data) {
        const user = await this.prisma.user.findUnique({
            where: { email: data.email.toLowerCase().trim() },
            include: {
                account: true,
            },
        });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password credentials');
        }
        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid email or password credentials');
        }
        const token = this.generateToken(user.id, user.email, user.role);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                account: user.account,
            },
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
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            account: user.account,
        };
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        return {
            success: true,
            message: user
                ? 'Password reset instructions have been simulated and sent to your email.'
                : 'If an account exists for this email, reset instructions have been sent.',
        };
    }
    generateToken(userId, email, role) {
        return this.jwtService.sign({ sub: userId, email, role }, { expiresIn: '7d' });
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map