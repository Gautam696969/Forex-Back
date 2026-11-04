import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { SmsService } from './sms.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
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
export class AuthModule {}
