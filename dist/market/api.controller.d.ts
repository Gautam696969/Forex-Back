import { OnModuleInit } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService } from './upstox-broker.service.js';
import { NseIpoService } from './nse-ipo.service.js';
import { CentralApiService } from './central-api.service.js';
import { PrismaService } from '../prisma.service.js';
export declare class ApiController implements OnModuleInit {
    private centralApi;
    private forexEngine;
    private upstoxBroker;
    private nseIpoService;
    private prisma;
    constructor(centralApi: CentralApiService, forexEngine: ForexEngineService, upstoxBroker: UpstoxBrokerService, nseIpoService: NseIpoService, prisma: PrismaService);
    onModuleInit(): void;
    getIndicesData(): Promise<{
        symbol: string;
        displayName: any;
        price: any;
        change: number;
        changePercent: number;
        high: any;
        low: any;
        prevClose: number | undefined;
        isPositive: boolean;
        digits: any;
        lastUpdatedIST: string;
    }[]>;
    getQuotesData(): Promise<{
        symbol: string;
        price: number;
        bid: number;
        ask: number;
        change: number;
        changePercent: number;
        open: number;
        high: number;
        low: number;
        prevClose: number;
        volume: number;
        lastUpdatedIST: string;
        category: "INDICES" | "STOCKS" | "COMMODITIES";
    }[]>;
    getPairsData(category?: string): Promise<any[]>;
    getCandlesData(symbol?: string, interval?: string): Promise<{
        symbol: string;
        interval: string;
        timeframe: string;
        candles: import("./upstox-broker.service.js").CandleBar[];
        lastUpdated: string;
        lastCandle?: import("./upstox-broker.service.js").CandleBar;
    }>;
    getStatusData(): Promise<{
        isOpen: boolean;
        status: "OPEN" | "CLOSED";
        dataFeed: string;
        database: string;
        timing: string;
        currentIST: string;
        message: string;
    }>;
    getIpoData(status?: string): Promise<{
        ipos: import("./nse-ipo.service.js").IpoItem[];
        lastUpdated: string;
        source: string;
    }>;
    getIndices(req: any, res: any): Promise<any>;
    getQuotes(req: any, res: any): Promise<any>;
    getPairs(category: string, req: any, res: any): Promise<any>;
    getCandles(symbol?: string, interval?: string, timeframe?: string, req?: any, res?: any): Promise<any>;
    getChart(symbol: string | undefined, range: string | undefined, req: any, res: any): Promise<any>;
    getStatus(req: any, res: any): Promise<any>;
    getIpo(status: string, req: any, res: any): Promise<any>;
    getIposAlias(status: string, req: any, res: any): Promise<any>;
    getHealth(res: any): any;
}
