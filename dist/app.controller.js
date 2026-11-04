var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get } from '@nestjs/common';
let AppController = class AppController {
    getRoot() {
        return {
            status: 'online',
            service: 'FourX Indian Stock Market & Investment API',
            version: '1.0.0',
            market: 'NSE/BSE (Live Ticks & Real Data Feed)',
            timestampIST: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
            endpoints: {
                indices: '/api/indices',
                candles: '/api/candles',
                auth: {
                    register: '/api/auth/register',
                    login: '/api/auth/login',
                    me: '/api/auth/me',
                    sendOtp: '/api/auth/send-otp',
                    verifyOtp: '/api/auth/verify-otp',
                    refresh: '/api/auth/refresh',
                    logout: '/api/auth/logout',
                },
                market: {
                    pairs: '/market/pairs',
                    quotes: '/market/quotes',
                    status: '/market/status',
                    ipos: '/market/ipos',
                    mutualFunds: '/market/mutual-funds',
                    commodities: '/market/commodities',
                },
            },
        };
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getRoot", null);
AppController = __decorate([
    Controller()
], AppController);
export { AppController };
//# sourceMappingURL=app.controller.js.map