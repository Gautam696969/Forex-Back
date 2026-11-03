import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { WalletController } from './wallet.controller.js';
import { MarketModule } from '../market/market.module.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  imports: [MarketModule],
  controllers: [WalletController],
  providers: [WalletService, PrismaService],
  exports: [WalletService],
})
export class WalletModule {}
