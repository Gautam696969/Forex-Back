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
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
let WalletController = class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    async resetBalance(req) {
        return this.walletService.resetDemoBalance(req.user.id);
    }
    async depositFunds(req, body) {
        return this.walletService.depositVirtualFunds(req.user.id, body.amount);
    }
    async getLedger(req) {
        return this.walletService.getLedger(req.user.id);
    }
};
__decorate([
    Post('reset'),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "resetBalance", null);
__decorate([
    Post('deposit'),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "depositFunds", null);
__decorate([
    Get('ledger'),
    __param(0, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getLedger", null);
WalletController = __decorate([
    UseGuards(JwtAuthGuard),
    Controller(['wallet', 'api/wallet']),
    __metadata("design:paramtypes", [WalletService])
], WalletController);
export { WalletController };
//# sourceMappingURL=wallet.controller.js.map