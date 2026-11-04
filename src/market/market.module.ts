import { Module } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService } from './upstox-broker.service.js';
import { NseIpoService } from './nse-ipo.service.js';
import { MarketGateway } from './market.gateway.js';
import { MarketController } from './market.controller.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [MarketController],
  providers: [ForexEngineService, UpstoxBrokerService, NseIpoService, MarketGateway, PrismaService],
  exports: [ForexEngineService, UpstoxBrokerService, NseIpoService, MarketGateway],
})
export class MarketModule {}
