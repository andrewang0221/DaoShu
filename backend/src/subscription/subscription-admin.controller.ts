/**
 * 管理端套餐配置接口（V2.3，参考 galaxyopc 套餐管理）
 *
 * - GET    /admin/plans         套餐列表
 * - POST   /admin/plans         新增/覆盖套餐（按 code upsert）
 * - DELETE /admin/plans/:code   删除套餐（内置三级套餐不可删）
 */

import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Roles } from '../common';
import { SubscriptionService, PlanInput } from './subscription.service';

@Controller('admin/plans')
@Roles('admin')
export class SubscriptionAdminController {
  constructor(private readonly service: SubscriptionService) {}

  @Get()
  list() {
    return this.service.adminPlans();
  }

  @Post()
  upsert(@Body() dto: PlanInput) {
    return this.service.upsertPlan(dto);
  }

  @Delete(':code')
  async remove(@Param('code') code: string) {
    await this.service.deletePlan(code);
    return { ok: true };
  }
}
