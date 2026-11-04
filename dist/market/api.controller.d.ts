import { ForexEngineService } from './forex-engine.service.js';
import { UpstoxBrokerService } from './upstox-broker.service.js';
import { PrismaService } from '../prisma.service.js';
export declare class ApiController {
    private forexEngine;
    private upstoxBroker;
    private prisma;
    private readonly logger;
    constructor(forexEngine: ForexEngineService, upstoxBroker: UpstoxBrokerService, prisma: PrismaService);
    getIndices(res: any): Promise<any>;
    getCandles(symbol?: string, interval?: string, timeframe?: string, res?: any): Promise<any>;
    getStatus(res: any): any;
}
