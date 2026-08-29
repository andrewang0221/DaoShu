import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SymposiumService, StartSymposiumDto } from './symposium.service';
import { AuthUser, CurrentUser, Public } from '../common';

@Controller('symposium')
export class SymposiumController {
  constructor(private readonly service: SymposiumService) {}

  /** 推荐研讨主题（公开） */
  @Public()
  @Get('topics')
  topics() {
    return this.service.getTopics();
  }

  /** 发起研讨：数字人主持 + 经典角色对谈 → 纪要入知识库 */
  @Post('start')
  start(@CurrentUser() user: AuthUser, @Body() dto: StartSymposiumDto) {
    return this.service.start(user.id, dto);
  }

  /** 我的研讨纪要列表 */
  @Get('records')
  records(@CurrentUser() user: AuthUser) {
    return this.service.list(user.id);
  }

  /** 研讨纪要详情 */
  @Get('records/:id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.detail(user.id, id);
  }
}
