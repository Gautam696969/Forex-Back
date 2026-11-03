import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TradingService } from './trading.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('trading')
export class TradingController {
  constructor(private tradingService: TradingService) {}

  @Post('orders')
  async createOrder(@Request() req: any, @Body() body: CreateOrderDto) {
    return this.tradingService.createOrder(req.user.id, body);
  }

  @Get('positions')
  async getPositions(@Request() req: any) {
    return this.tradingService.getOpenPositions(req.user.id);
  }

  @Post('positions/:id/close')
  async closePosition(@Request() req: any, @Param('id') positionId: string) {
    return this.tradingService.closePosition(req.user.id, positionId, 'MANUAL');
  }

  @Post('positions/close-all')
  async closeAllPositions(@Request() req: any) {
    return this.tradingService.closeAllPositions(req.user.id);
  }

  @Patch('positions/:id')
  async modifyPosition(
    @Request() req: any,
    @Param('id') positionId: string,
    @Body() body: { stopLoss?: number; takeProfit?: number },
  ) {
    return this.tradingService.modifyPosition(req.user.id, positionId, body);
  }

  @Get('orders/pending')
  async getPendingOrders(@Request() req: any) {
    return this.tradingService.getPendingOrders(req.user.id);
  }

  @Delete('orders/:id')
  async cancelOrder(@Request() req: any, @Param('id') orderId: string) {
    return this.tradingService.cancelOrder(req.user.id, orderId);
  }

  @Get('history')
  async getTradeHistory(
    @Request() req: any,
    @Query('symbol') symbol?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.tradingService.getTradeHistory(req.user.id, {
      symbol,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('summary')
  async getAccountSummary(@Request() req: any) {
    return this.tradingService.getAccountSummary(req.user.id);
  }
}
