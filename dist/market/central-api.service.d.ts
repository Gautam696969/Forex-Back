import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export interface ApiHealthStatus {
    ok: boolean;
    lastSuccessTime: string | null;
    lastError: string | null;
    failCount: number;
    lastTested: string;
}
export interface WrapOptions {
    apiName: string;
    url?: string;
    isUpstream?: boolean;
}
export declare class CentralApiService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private recurringTestTimer;
    private apiHealthMap;
    private apiTestHandlers;
    onModuleInit(): void;
    onModuleDestroy(): void;
    registerTestHandler(apiName: string, handler: () => Promise<any>): void;
    getISTString(date?: Date): string;
    getISTTimeOnly(date?: Date): string;
    execute<T>(options: WrapOptions, fn: () => Promise<T>): Promise<T>;
    wrapRoute<T>(res: any, apiName: string, url: string, fn: () => Promise<T>): Promise<any>;
    fetchWithTimeout(url: string, options?: RequestInit, timeoutMs?: number, upstreamApiName?: string): Promise<Response>;
    recordSuccess(apiName: string): void;
    recordFailure(apiName: string, reason: string): void;
    getHealthSummary(): {
        status: string;
        apis: Record<string, ApiHealthStatus>;
    };
    runSelfTest(isStartup?: boolean): Promise<void>;
}
