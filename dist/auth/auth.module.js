var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { SmsService } from './sms.service.js';
import { PrismaService } from '../prisma.service.js';
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    Module({
        imports: [
            PassportModule.register({ defaultStrategy: 'jwt' }),
            JwtModule.register({
                secret: process.env.JWT_SECRET || 'fourx_ultra_secure_jwt_secret_key_2026_x89a',
                signOptions: { expiresIn: '15m' },
            }),
        ],
        controllers: [AuthController],
        providers: [AuthService, SmsService, JwtStrategy, PrismaService],
        exports: [AuthService, SmsService, JwtModule, PassportModule],
    })
], AuthModule);
export { AuthModule };
//# sourceMappingURL=auth.module.js.map