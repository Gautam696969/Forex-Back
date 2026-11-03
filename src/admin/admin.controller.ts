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
@Controller('admin')
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
}
