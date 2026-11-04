import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { CentralApiService } from './central-api.service.js';
export declare const YAHOO_SYMBOL_MAP: Record<string, string>;
export declare const YAHOO_INTERVAL_MAP: Record<string, {
    interval: string;
    range: string;
}>;
export interface CandleBar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    istDate?: string;
}
export interface LiveQuote {
    symbol: string;
    bid: number;
    ask: number;
    digits: number;
    change24h: number;
    changeAmount: number;
    high24h: number;
    low24h: number;
    open24h: number;
    close24h: number;
    volume24h: number;
    timestamp: number;
    lastUpdatedIST: string;
    category: 'INDICES' | 'STOCKS' | 'COMMODITIES';
}
export interface InstrumentInfo {
    symbol: string;
    displayName: string;
    instrumentKey: string;
    segment: 'NSE_INDEX' | 'BSE_INDEX' | 'NSE_EQ' | 'MCX_FO';
    category: 'INDICES' | 'STOCKS' | 'COMMODITIES';
    sector?: string;
    digits: number;
    pipSize: number;
    defaultSpread: number;
    lotSize: number;
}
export interface BrokerHealthInfo {
    status: 'healthy' | 'degraded' | 'stale' | 'offline';
    market: {
        isOpen: boolean;
        status: 'OPEN' | 'CLOSED';
        message: string;
        timing: string;
        currentIST: string;
    };
    webSocket: {
        connected: boolean;
        mode: 'WEBSOCKET' | 'REST_POLL';
        reconnectAttempts: number;
        lastConnectedAtIST?: string;
        lastDisconnectedAtIST?: string;
        lastHeartbeatIST?: string;
    };
    feed: {
        lastTickTimestamp: number;
        lastTickIST: string;
        ticksReceivedTotal: number;
        subscribedSymbolsCount: number;
        isStale: boolean;
        lastRestSyncIST?: string;
    };
    token: {
        hasToken: boolean;
        valid: boolean;
        autoRefreshConfigured: boolean;
        statusMessage: string;
    };
}
export declare const INSTRUMENT_MASTER: Record<string, InstrumentInfo>;
export declare class UpstoxBrokerService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
    private centralApi;
    private readonly logger;
    private quotes;
    private candleCache;
    private pollTimer;
    private watchdogTimer;
    private heartbeatTimer;
    private wsClient;
    private isWsConnected;
    private wsMode;
    private reconnectAttempts;
    private lastConnectedAt;
    private lastDisconnectedAt;
    private lastHeartbeatAt;
    private lastTickTimestamp;
    private ticksReceivedTotal;
    private lastRestSyncAt;
    private tokenValid;
    private tokenStatusMessage;
    private readonly backoffSchedule;
    constructor(centralApi: CentralApiService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    private stopAllTimers;
    getHealthInfo(): BrokerHealthInfo;
    isMarketOpen(category?: 'EQUITIES' | 'COMMODITIES'): {
        isOpen: boolean;
        status: 'OPEN' | 'CLOSED';
        message: string;
        timing: string;
        currentIST: string;
    };
    getInstrument(symbol: string): InstrumentInfo | null;
    getQuote(symbol: string): LiveQuote | null;
    getAllQuotes(): LiveQuote[];
    getCandles(symbol?: string, timeframe?: string): Promise<{
        symbol: string;
        interval: string;
        timeframe: string;
        candles: CandleBar[];
        lastUpdated: string;
        lastCandle?: CandleBar;
    }>;
    fetchCandlesFromYahoo(inst: InstrumentInfo, normTf: string): Promise<CandleBar[]>;
    private fetchCandlesFromUpstox;
    private parseAndSortCandles;
    private aggregateCandles;
    refreshQuotes(): Promise<void>;
    syncQuotesFromYahoo(): Promise<LiveQuote[]>;
    private startStaleFeedWatchdog;
    private startStreamingOrPolling;
    private initUpstoxWebSocket;
    private scheduleReconnect;
    private resubscribeAllSymbols;
    private handleTokenExpired;
    private handleWsMessage;
    private handleUpstoxWsFeeds;
    private logBrokerResponse;
    private formatIST;
}
