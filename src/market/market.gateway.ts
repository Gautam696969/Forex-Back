import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { ForexEngineService, PairTick } from './forex-engine.service.js';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class MarketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ForexEngineService))
    private forexEngine: ForexEngineService,
  ) {}

  afterInit(server: Server) {
    // Listen for tick simulation events and broadcast
    this.forexEngine.on('ticks', (ticks: PairTick[]) => {
      server.emit('market:ticks', ticks);
    });

    this.forexEngine.on('new_bar', (data: any) => {
      server.emit('market:bar', data);
    });
  }

  handleConnection(client: Socket) {
    // Send immediate initial quotes to newly connected client
    client.emit('market:ticks', this.forexEngine.getAllQuotes());
  }

  handleDisconnect(client: Socket) {
    // Client disconnected
  }

  @SubscribeMessage('join_account')
  handleJoinAccount(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { accountId: string },
  ) {
    if (data?.accountId) {
      client.join(`account_${data.accountId}`);
      return { status: 'joined', room: `account_${data.accountId}` };
    }
  }

  @SubscribeMessage('subscribe_symbol')
  async handleSubscribeSymbol(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbol: string; timeframe?: string },
  ) {
    if (data?.symbol) {
      const history = await this.forexEngine.getCandleHistory(data.symbol, data.timeframe || '1m');
      client.emit('market:history', { symbol: data.symbol, history });
    }
  }

  // Helper method for trading engine to send private account updates
  public notifyAccount(accountId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`account_${accountId}`).emit(event, payload);
    }
  }

  public broadcast(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
    }
  }
}
