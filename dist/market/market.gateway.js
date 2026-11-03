var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { ForexEngineService } from './forex-engine.service.js';
let MarketGateway = class MarketGateway {
    forexEngine;
    server;
    constructor(forexEngine) {
        this.forexEngine = forexEngine;
    }
    afterInit(server) {
        this.forexEngine.on('ticks', (ticks) => {
            server.emit('market:ticks', ticks);
        });
        this.forexEngine.on('new_bar', (data) => {
            server.emit('market:bar', data);
        });
    }
    handleConnection(client) {
        client.emit('market:ticks', this.forexEngine.getAllQuotes());
    }
    handleDisconnect(client) {
    }
    handleJoinAccount(client, data) {
        if (data?.accountId) {
            client.join(`account_${data.accountId}`);
            return { status: 'joined', room: `account_${data.accountId}` };
        }
    }
    handleSubscribeSymbol(client, data) {
        if (data?.symbol) {
            const history = this.forexEngine.getCandleHistory(data.symbol, data.timeframe || '1m');
            client.emit('market:history', { symbol: data.symbol, history });
        }
    }
    notifyAccount(accountId, event, payload) {
        if (this.server) {
            this.server.to(`account_${accountId}`).emit(event, payload);
        }
    }
    broadcast(event, payload) {
        if (this.server) {
            this.server.emit(event, payload);
        }
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], MarketGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('join_account'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, Object]),
    __metadata("design:returntype", void 0)
], MarketGateway.prototype, "handleJoinAccount", null);
__decorate([
    SubscribeMessage('subscribe_symbol'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, Object]),
    __metadata("design:returntype", void 0)
], MarketGateway.prototype, "handleSubscribeSymbol", null);
MarketGateway = __decorate([
    Injectable(),
    WebSocketGateway({
        cors: {
            origin: '*',
            credentials: true,
        },
    }),
    __param(0, Inject(forwardRef(() => ForexEngineService))),
    __metadata("design:paramtypes", [ForexEngineService])
], MarketGateway);
export { MarketGateway };
//# sourceMappingURL=market.gateway.js.map