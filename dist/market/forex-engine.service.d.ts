import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { EventEmitter } from 'events';
import { UpstoxBrokerService, CandleBar } from './upstox-broker.service.js';
export type { CandleBar };
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
    private upstoxBroker;
    private dbSaveInterval;
    private liveQuotes;
    private pairMeta;
    constructor(prisma: PrismaService, upstoxBroker: UpstoxBrokerService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    isMarketOpen(category?: 'EQUITIES' | 'COMMODITIES'): {
        isOpen: boolean;
        status: "OPEN" | "CLOSED";
        message: string;
        timing: string;
        currentIST: string;
    };
    private loadPairsFromDb;
    private persistQuotesToDb;
    getAllQuotes(): PairTick[];
    getQuote(symbol: string): PairTick | undefined;
    getCandleHistory(symbol: string, timeframe?: string): Promise<CandleBar[]>;
    getPairMeta(symbol: string): any;
    updatePairSpread(symbol: string, newSpread: number): void;
}
