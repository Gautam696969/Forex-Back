import { ForexEngineService } from './forex-engine.service.js';
import { PrismaService } from '../prisma.service.js';
export declare class MarketController {
    private forexEngine;
    private prisma;
    constructor(forexEngine: ForexEngineService, prisma: PrismaService);
    getPairs(): Promise<{
        currentBid: number;
        currentAsk: number;
        change24h: number;
        high24h: number;
        low24h: number;
        symbol: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        base: string;
        quote: string;
        displayName: string;
        category: string;
        digits: number;
        pipSize: number;
        contractSize: number;
        defaultSpread: number;
        minLot: number;
        maxLot: number;
        lotStep: number;
        active: boolean;
    }[]>;
    getHistory(symbol: string, timeframe?: string): {
        symbol: string;
        timeframe: string;
        candles: import("./forex-engine.service.js").CandleBar[];
    };
    getQuotes(): import("./forex-engine.service.js").PairTick[];
}
