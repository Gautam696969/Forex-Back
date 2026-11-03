import { IsString, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  symbol: string;

  @IsString()
  @IsIn(['BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP'])
  type: 'BUY' | 'SELL' | 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';

  @IsNumber()
  @Min(0.01)
  @Max(100.0)
  lots: number;

  @IsOptional()
  @IsNumber()
  targetPrice?: number;

  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @IsOptional()
  @IsNumber()
  takeProfit?: number;
}
