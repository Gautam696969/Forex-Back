import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { MarketModule } from '../market/market.module.js';
import { TradingModule } from '../trading/trading.module.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  imports: [MarketModule, TradingModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}
