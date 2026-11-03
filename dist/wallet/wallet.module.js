var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { WalletController } from './wallet.controller.js';
import { MarketModule } from '../market/market.module.js';
import { PrismaService } from '../prisma.service.js';
let WalletModule = class WalletModule {
};
WalletModule = __decorate([
    Module({
        imports: [MarketModule],
        controllers: [WalletController],
        providers: [WalletService, PrismaService],
        exports: [WalletService],
    })
], WalletModule);
export { WalletModule };
//# sourceMappingURL=wallet.module.js.map