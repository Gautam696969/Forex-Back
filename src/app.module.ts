import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service.js';
import { AuthModule } from './auth/auth.module.js';
import { MarketModule } from './market/market.module.js';
import { TradingModule } from './trading/trading.module.js';
import { WalletModule } from './wallet/wallet.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    MarketModule,
    TradingModule,
    WalletModule,
    AdminModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
