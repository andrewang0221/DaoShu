import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common';

/** 管理端接口（需 admin 角色；演示模式自动放行） */
@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('users')
  users() {
    return this.admin.listUsers();
  }

  @Post('users/:id/status')
  setUserStatus(@Param('id') id: string, @Body('status') status: 'active' | 'banned') {
    return this.admin.setUserStatus(id, status);
  }

  @Get('points/transactions')
  pointTransactions() {
    return this.admin.listPointTransactions();
  }

  @Get('audit-logs')
  auditLogs() {
    return this.admin.listAuditLogs();
  }
}
