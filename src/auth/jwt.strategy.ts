import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'forex_super_secret_jwt_key_2026',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { account: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or session invalid');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.full_name,
      fullName: user.full_name,
      mobile: user.mobile,
      isVerified: user.is_verified,
      kycStatus: user.kyc_status,
      demoBalance: user.demo_balance,
      role: user.role,
      account: user.account,
    };
  }
}
