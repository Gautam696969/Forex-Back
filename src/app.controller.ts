import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'online',
      service: 'FourX Indian Stock Market & Investment API',
      version: '1.0.0',
      market: 'NSE/BSE (Live Ticks & Real Data Feed)',
      timestampIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      endpoints: {
        indices: '/api/indices',
        candles: '/api/candles',
        auth: {
          register: '/api/auth/register',
          login: '/api/auth/login',
          me: '/api/auth/me',
          sendOtp: '/api/auth/send-otp',
          verifyOtp: '/api/auth/verify-otp',
          refresh: '/api/auth/refresh',
          logout: '/api/auth/logout',
        },
        market: {
          pairs: '/market/pairs',
          quotes: '/market/quotes',
          status: '/market/status',
          ipos: '/market/ipos',
          mutualFunds: '/market/mutual-funds',
          commodities: '/market/commodities',
        },
      },
    };
  }
}
