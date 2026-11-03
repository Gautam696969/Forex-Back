import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { EventEmitter } from 'events';
export interface CandleBar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface PairTick {
    symbol: string;
    bid: number;
    ask: number;
    digits: number;
    spreadPips: number;
    change24h: number;
    high24h: number;
    low24h: number;
    timestamp: number;
}
export declare class ForexEngineService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
    private prisma;
    private updateInterval;
    private dbSaveInterval;
    private realSyncInterval;
    private liveQuotes;
    private candleHistory;
    private pairMeta;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    private loadPairsFromDb;
    private fetchRealStockData;
    private initializeHistoricalCandles;
    private startSimulationLoop;
    private generateTicks;
    private updateLiveBar;
    private persistQuotesToDb;
    getAllQuotes(): PairTick[];
    getQuote(symbol: string): PairTick | undefined;
    getCandleHistory(symbol: string, timeframe?: string): CandleBar[];
    getPairMeta(symbol: string): any;
    updatePairSpread(symbol: string, newSpread: number): void;
}
