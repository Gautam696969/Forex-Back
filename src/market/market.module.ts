import { Module } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { MarketGateway } from './market.gateway.js';
import { MarketController } from './market.controller.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [MarketController],
  providers: [ForexEngineService, MarketGateway, PrismaService],
  exports: [ForexEngineService, MarketGateway],
})
export class MarketModule {}
