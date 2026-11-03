import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ForexEngineService } from './forex-engine.service.js';
export declare class MarketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private forexEngine;
    server: Server;
    constructor(forexEngine: ForexEngineService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinAccount(client: Socket, data: {
        accountId: string;
    }): {
        status: string;
        room: string;
    } | undefined;
    handleSubscribeSymbol(client: Socket, data: {
        symbol: string;
        timeframe?: string;
    }): void;
    notifyAccount(accountId: string, event: string, payload: any): void;
    broadcast(event: string, payload: any): void;
}
