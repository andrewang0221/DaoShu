import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthUser, CurrentUser, Public } from '../common';
import { IndustryService } from './industry.service';

@Controller('industry')
export class IndustryController {
  constructor(private readonly service: IndustryService) {}

  /** 行业 Agent 矩阵列表（预置 + 自定义，游客可浏览） */
  @Public()
  @Get('agents')
  list() {
    return this.service.list();
  }

  /** 我已解锁的行业包 */
  @Get('unlocks')
  myUnlocks(@CurrentUser() user: AuthUser) {
    return this.service.myUnlocks(user.id);
  }

  /**
   * 自定义行业识别（FR-P 核心）：输入一段自我描述
   * （如"我是一名建筑工人"），系统识别行业并生成专属行业 Agent。
   */
  @Post('detect')
  detect(@CurrentUser() user: AuthUser, @Body() body: { profile: string }) {
    return this.service.detect(body?.profile ?? '', user.id);
  }

  /** 单个行业 Agent 详情（含注入包，游客可浏览） */
  @Public()
  @Get('agents/:code')
  get(@Param('code') code: string) {
    return this.service.get(code);
  }

  /** 行业场景问答 */
  @Post('agents/:code/invoke')
  invoke(@CurrentUser() user: AuthUser, @Param('code') code: string, @Body() body: { question: string }) {
    return this.service.invoke(code, body?.question ?? '', user.id);
  }

  /** 积分解锁行业包（FR-P02；生成者本人免费） */
  @Post('agents/:code/unlock')
  unlock(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.service.unlock(code, user.id);
  }

  /** 行业案例库（FR-P03：最近调用问答沉淀，游客可浏览） */
  @Public()
  @Get('agents/:code/cases')
  cases(@Param('code') code: string) {
    return this.service.cases(code);
  }
}
