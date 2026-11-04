import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import {
  RegisterDto,
  LoginDto,
  SendOtpDto,
  SendEmailOtpDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto.js';
import type { Response, Request as ExpressRequest } from 'express';

@Controller(['auth', 'api/auth'])
export class AuthController {
  constructor(private authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    // 15 minutes access token cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    // 7 days refresh token cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
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

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body);
    if (result.tokens) {
      this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    }
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
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

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() body: SendOtpDto) {
    return this.authService.sendMobileOtp(body);
  }

  @Post('send-email-otp')
  @HttpCode(HttpStatus.OK)
  async sendEmailOtp(@Body() body: SendEmailOtpDto) {
    return this.authService.sendEmailOtp(body.email, body.mobile);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: ExpressRequest,
    @Body('refreshToken') bodyRefreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: ExpressRequest,
    @Body('refreshToken') bodyRefreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = (req.cookies && req.cookies['refresh_token']) || bodyRefreshToken;
    this.clearAuthCookies(res);
    return this.authService.logout(rawToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
