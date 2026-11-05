import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✔ [DATABASE] Prisma connected to PostgreSQL successfully');
    } catch (err: any) {
      console.error(`\x1b[31m[DATABASE ERROR] Failed to connect to database: ${err?.message}\x1b[0m`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
