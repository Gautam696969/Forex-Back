var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TradingService } from './trading.service.js';
import { TradingController } from './trading.controller.js';
import { MarketModule } from '../market/market.module.js';
import { PrismaService } from '../prisma.service.js';
let TradingModule = class TradingModule {
};
TradingModule = __decorate([
    Module({
        imports: [MarketModule],
        controllers: [TradingController],
        providers: [TradingService, PrismaService],
        exports: [TradingService],
    })
], TradingModule);
export { TradingModule };
//# sourceMappingURL=trading.module.js.map