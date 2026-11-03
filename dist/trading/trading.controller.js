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
import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Request, } from '@nestjs/common';
import { TradingService } from './trading.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
let TradingController = class TradingController {
    tradingService;
    constructor(tradingService) {
        this.tradingService = tradingService;
    }
    async createOrder(req, body) {
        return this.tradingService.createOrder(req.user.id, body);
    }
    async getPositions(req) {
        return this.tradingService.getOpenPositions(req.user.id);
    }
    async closePosition(req, positionId) {
        return this.tradingService.closePosition(req.user.id, positionId, 'MANUAL');
    }
    async closeAllPositions(req) {
        return this.tradingService.closeAllPositions(req.user.id);
    }
    async modifyPosition(req, positionId, body) {
        return this.tradingService.modifyPosition(req.user.id, positionId, body);
    }
    async getPendingOrders(req) {
        return this.tradingService.getPendingOrders(req.user.id);
    }
    async cancelOrder(req, orderId) {
        return this.tradingService.cancelOrder(req.user.id, orderId);
    }
    async getTradeHistory(req, symbol, limit, offset) {
        return this.tradingService.getTradeHistory(req.user.id, {
            symbol,
            limit: limit ? parseInt(limit, 10) : 100,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }
    async getAccountSummary(req) {
        return this.tradingService.getAccountSummary(req.user.id);
    }
};
__decorate([
    Post('orders'),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateOrderDto]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "createOrder", null);
__decorate([
    Get('positions'),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "getPositions", null);
__decorate([
    Post('positions/:id/close'),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "closePosition", null);
__decorate([
    Post('positions/close-all'),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "closeAllPositions", null);
__decorate([
    Patch('positions/:id'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "modifyPosition", null);
__decorate([
    Get('orders/pending'),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "getPendingOrders", null);
__decorate([
    Delete('orders/:id'),
    __param(0, Request()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "cancelOrder", null);
__decorate([
    Get('history'),
    __param(0, Request()),
    __param(1, Query('symbol')),
    __param(2, Query('limit')),
    __param(3, Query('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "getTradeHistory", null);
__decorate([
    Get('summary'),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TradingController.prototype, "getAccountSummary", null);
TradingController = __decorate([
    UseGuards(JwtAuthGuard),
    Controller('trading'),
    __metadata("design:paramtypes", [TradingService])
], TradingController);
export { TradingController };
//# sourceMappingURL=trading.controller.js.map