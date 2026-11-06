import { Module } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService } from './upstox-broker.service.js';
import { NseIpoService } from './nse-ipo.service.js';
import { CentralApiService } from './central-api.service.js';
import { MarketGateway } from './market.gateway.js';
import { MarketController } from './market.controller.js';
import { ApiController } from './api.controller.js';
import { PrismaService } from '../prisma.service.js';
import { LogoModule } from '../logo/logo.module.js';

@Module({
  imports: [LogoModule],
  controllers: [MarketController, ApiController],
  providers: [CentralApiService, ForexEngineService, UpstoxBrokerService, NseIpoService, MarketGateway, PrismaService],
  exports: [CentralApiService, ForexEngineService, UpstoxBrokerService, NseIpoService, MarketGateway],
})
export class MarketModule {}
