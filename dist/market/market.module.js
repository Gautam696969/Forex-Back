var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService } from './upstox-broker.service.js';
import { NseIpoService } from './nse-ipo.service.js';
import { MarketGateway } from './market.gateway.js';
import { MarketController } from './market.controller.js';
import { ApiController } from './api.controller.js';
import { PrismaService } from '../prisma.service.js';
let MarketModule = class MarketModule {
};
MarketModule = __decorate([
    Module({
        controllers: [MarketController, ApiController],
        providers: [ForexEngineService, UpstoxBrokerService, NseIpoService, MarketGateway, PrismaService],
        exports: [ForexEngineService, UpstoxBrokerService, NseIpoService, MarketGateway],
    })
], MarketModule);
export { MarketModule };
//# sourceMappingURL=market.module.js.map