import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { CentralApiService } from './central-api.service.js';
export interface IpoItem {
    id: string;
    symbol: string;
    companyName: string;
    category: 'MAINLINE' | 'SME';
    priceBand: string;
    minPrice: number;
    maxPrice: number;
    lotSize: number;
    issueSize: string;
    openDate: string;
    closeDate: string;
    listingDate?: string;
    gmp?: number | null;
    subscriptionRate: number;
    status: 'OPEN' | 'UPCOMING' | 'CLOSED' | 'LISTED';
    about?: string;
    source: string;
    lastUpdatedIST: string;
    subscriptionBreakdown?: {
        qib: string;
        nii: string;
        retail: string;
        total: string;
    };
}
export declare class NseIpoService implements OnModuleInit, OnModuleDestroy {
    private centralApi;
    private readonly logger;
    private cachedIpos;
    private lastFetchedAt;
    private isFetching;
    private refreshTimer;
    private cookieJar;
    constructor(centralApi: CentralApiService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    getIpos(status?: string): Promise<{
        ipos: IpoItem[];
        lastUpdated: string;
        source: string;
    }>;
    getIpoDetail(symbolOrId: string): Promise<IpoItem | null>;
    refreshIpos(): Promise<IpoItem[]>;
    private extractSubscriptionBreakdown;
    private enrichIpoWithDetail;
    private parseNseDate;
    private ensureNseCookies;
    private fetchNseJson;
}
