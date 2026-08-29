import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../common';
import { IprService } from './ipr.service';

/**
 * 管理端 · 知识产权审核（V2.9，需 admin 角色；演示模式自动放行）
 * - GET  /admin/ipr/applications        申请列表（?status= 过滤）
 * - GET  /admin/ipr/applications/:id    申请详情
 * - POST /admin/ipr/applications/:id/review  受理 / 发证 / 驳回
 * - GET  /admin/ipr/stats               申请统计
 */
@Controller('admin/ipr')
@Roles('admin')
export class IprAdminController {
  constructor(private readonly service: IprService) {}

  @Get('applications')
  list(@Query('status') status?: string) {
    return this.service.adminList(status);
  }

  @Get('applications/:id')
  detail(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.service.detail(id, user.id, true);
  }

  @Post('applications/:id/review')
  review(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { action: 'accept' | 'certify' | 'reject'; reason?: string; certNo?: string; certUrl?: string },
  ) {
    return this.service.adminReview(user.id, id, body?.action, body ?? {});
  }

  @Get('stats')
  stats() {
    return this.service.adminStats();
  }
}
