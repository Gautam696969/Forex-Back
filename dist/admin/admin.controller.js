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
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getStats() {
        return this.adminService.getAdminStats();
    }
    async getUsers() {
        return this.adminService.getAllUsers();
    }
    async adjustBalance(req, targetUserId, body) {
        return this.adminService.adjustUserBalance(req.user.id, req.user.email, targetUserId, body.amount, body.reason);
    }
    async adjustBalanceAlias(req, body) {
        return this.adminService.adjustUserBalance(req.user.id, req.user.email, body.userId, body.amount, body.reason);
    }
    async resetUser(req, targetUserId, body) {
        return this.adminService.resetUserDemoAccount(req.user.id, req.user.email, targetUserId, body.reason);
    }
    async resetUserAlias(req, body) {
        return this.adminService.resetUserDemoAccount(req.user.id, req.user.email, body.userId, body.reason);
    }
    async updateUserKyc(req, targetUserId, body) {
        return this.adminService.updateUserKyc(req.user.id, req.user.email, targetUserId, body.kycStatus);
    }
    async updateUserRole(req, targetUserId, body) {
        return this.adminService.updateUserRole(req.user.id, req.user.email, targetUserId, body.role);
    }
    async updatePair(req, pairId, body) {
        return this.adminService.updatePairSettings(req.user.id, req.user.email, pairId, body);
    }
    async getAuditLogs() {
        return this.adminService.getAuditLogs();
    }
    async getAllPositions() {
        return this.adminService.getAllPositions();
    }
    async closePositionForce(req, positionId, body) {
        return this.adminService.closePositionForce(req.user.id, req.user.email, positionId, body.reason || 'Admin manual square-off');
    }
    async getAdminIpos() {
        return this.adminService.getAdminIpos();
    }
    async updateAdminIpo(req, ipoId, body) {
        return this.adminService.updateAdminIpo(req.user.id, req.user.email, ipoId, body);
    }
    async getAdminIpoApplications() {
        return this.adminService.getAdminIpoApplications();
    }
};
__decorate([
    Get('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    Get('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    Post('users/:id/adjust-balance'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "adjustBalance", null);
__decorate([
    Post('balance/adjust'),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "adjustBalanceAlias", null);
__decorate([
    Post('users/:id/reset'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetUser", null);
__decorate([
    Post('balance/reset'),
    __param(0, Request()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetUserAlias", null);
__decorate([
    Patch('users/:id/kyc'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserKyc", null);
__decorate([
    Patch('users/:id/role'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserRole", null);
__decorate([
    Patch('pairs/:id'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePair", null);
__decorate([
    Get('audit-logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    Get('positions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllPositions", null);
__decorate([
    Post('positions/:id/close'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "closePositionForce", null);
__decorate([
    Get('ipos'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdminIpos", null);
__decorate([
    Patch('ipos/:id'),
    __param(0, Request()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAdminIpo", null);
__decorate([
    Get('ipo-applications'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdminIpoApplications", null);
AdminController = __decorate([
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles('ADMIN'),
    Controller(['admin', 'api/admin']),
    __metadata("design:paramtypes", [AdminService])
], AdminController);
export { AdminController };
//# sourceMappingURL=admin.controller.js.map