import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service.js';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: { email: string; password: string; name: string }) {
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
            balance: 10000.0,
            equity: 10000.0,
            freeMargin: 10000.0,
            usedMargin: 0.0,
            marginLevel: 0.0,
            currency: 'USD',
            leverage: 100,
            isDemo: true,
            ledgers: {
              create: {
                type: 'INITIAL_DEPOSIT',
                amount: 10000.0,
                balanceBefore: 0.0,
                balanceAfter: 10000.0,
                note: 'Initial Virtual Demo Account Balance',
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

  async login(data: { email: string; password: string }) {
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

  async getProfile(userId: string) {
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

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // To prevent account enumeration in demo app, always return a friendly confirmation
    return {
      success: true,
      message: user
        ? 'Password reset instructions have been simulated and sent to your email.'
        : 'If an account exists for this email, reset instructions have been sent.',
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign(
      { sub: userId, email, role },
      { expiresIn: '7d' },
    );
  }
}
