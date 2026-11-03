export declare class CreateOrderDto {
    symbol: string;
    type: 'BUY' | 'SELL' | 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
    lots: number;
    targetPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
}
