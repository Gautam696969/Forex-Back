import { Module } from '@nestjs/common';
import { TradingService } from './trading.service.js';
import { TradingController } from './trading.controller.js';
import { MarketModule } from '../market/market.module.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  imports: [MarketModule],
  controllers: [TradingController],
  providers: [TradingService, PrismaService],
  exports: [TradingService],
})
export class TradingModule {}
