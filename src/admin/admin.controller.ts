import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller(['admin', 'api/admin'])
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getAdminStats();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('users/:id/adjust-balance')
  async adjustBalance(
    @Request() req: any,
    @Param('id') targetUserId: string,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.adminService.adjustUserBalance(
      req.user.id,
      req.user.email,
      targetUserId,
      body.amount,
      body.reason,
    );
  }

  // Alias for /admin/balance/adjust
  @Post('balance/adjust')
  async adjustBalanceAlias(
    @Request() req: any,
    @Body() body: { userId: string; amount: number; reason: string },
  ) {
    return this.adminService.adjustUserBalance(
      req.user.id,
      req.user.email,
      body.userId,
      body.amount,
      body.reason,
    );
  }

  @Post('users/:id/reset')
  async resetUser(
    @Request() req: any,
    @Param('id') targetUserId: string,
    @Body() body: { reason: string },
  ) {
    return this.adminService.resetUserDemoAccount(
      req.user.id,
      req.user.email,
      targetUserId,
      body.reason,
    );
  }

  // Alias for /admin/balance/reset
  @Post('balance/reset')
  async resetUserAlias(
    @Request() req: any,
    @Body() body: { userId: string; reason: string },
  ) {
    return this.adminService.resetUserDemoAccount(
      req.user.id,
      req.user.email,
      body.userId,
      body.reason,
    );
  }

  @Patch('users/:id/kyc')
  async updateUserKyc(
    @Request() req: any,
    @Param('id') targetUserId: string,
    @Body() body: { kycStatus: string },
  ) {
    return this.adminService.updateUserKyc(
      req.user.id,
      req.user.email,
      targetUserId,
      body.kycStatus,
    );
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Request() req: any,
    @Param('id') targetUserId: string,
    @Body() body: { role: string },
  ) {
    return this.adminService.updateUserRole(
      req.user.id,
      req.user.email,
      targetUserId,
      body.role,
    );
  }

  @Patch('pairs/:id')
  async updatePair(
    @Request() req: any,
    @Param('id') pairId: string,
    @Body() body: { defaultSpread?: number; active?: boolean; minLot?: number; maxLot?: number },
  ) {
    return this.adminService.updatePairSettings(
      req.user.id,
      req.user.email,
      pairId,
      body,
    );
  }

  @Get('audit-logs')
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Get('positions')
  async getAllPositions() {
    return this.adminService.getAllPositions();
  }

  @Post('positions/:id/close')
  async closePositionForce(
    @Request() req: any,
    @Param('id') positionId: string,
    @Body() body: { reason?: string },
  ) {
    return this.adminService.closePositionForce(
      req.user.id,
      req.user.email,
      positionId,
      body.reason || 'Admin manual square-off',
    );
  }

  @Get('ipos')
  async getAdminIpos() {
    return this.adminService.getAdminIpos();
  }

  @Patch('ipos/:id')
  async updateAdminIpo(
    @Request() req: any,
    @Param('id') ipoId: string,
    @Body() body: { gmp?: number; status?: string; priceBand?: string; subscriptionRate?: number },
  ) {
    return this.adminService.updateAdminIpo(
      req.user.id,
      req.user.email,
      ipoId,
      body,
    );
  }

  @Get('ipo-applications')
  async getAdminIpoApplications() {
    return this.adminService.getAdminIpoApplications();
  }
}
