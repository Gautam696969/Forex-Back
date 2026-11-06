import { Module } from '@nestjs/common';
import { LogoController } from './logo.controller.js';
import { LogoService } from './logo.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [LogoController],
  providers: [LogoService, PrismaService],
  exports: [LogoService],
})
export class LogoModule {}

