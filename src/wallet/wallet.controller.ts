import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post('reset')
  async resetBalance(@Request() req: any) {
    return this.walletService.resetDemoBalance(req.user.id);
  }

  @Post('deposit')
  async depositFunds(@Request() req: any, @Body() body: { amount: number }) {
    return this.walletService.depositVirtualFunds(req.user.id, body.amount);
  }

  @Get('ledger')
  async getLedger(@Request() req: any) {
    return this.walletService.getLedger(req.user.id);
  }
}
