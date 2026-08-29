import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DaoService, PublishInquiryDto, AnswerDto } from './dao.service';
import { AuthUser, CurrentUser, Public } from '../common';

@Controller('dao')
export class DaoController {
  constructor(private readonly service: DaoService) {}

  /** 求道帖列表（公开可读，供游客浏览）：all / bounty / open */
  @Public()
  @Get('inquiries')
  list(@Query('filter') filter?: string) {
    return this.service.list(null, filter ?? 'all');
  }

  /** 我的求道帖 */
  @Get('my-inquiries')
  my(@CurrentUser() user: AuthUser) {
    return this.service.list(user.id, 'mine');
  }

  /** 帖子详情（公开） */
  @Public()
  @Get('inquiries/:id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  /** 发布求道帖：免费 / 有偿（悬赏积分） */
  @Post('inquiries')
  publish(@CurrentUser() user: AuthUser, @Body() dto: PublishInquiryDto) {
    return this.service.publish(user.id, user.username ?? user.email ?? user.phone ?? '道友', dto);
  }

  /** 回答：人工回答，或让数字人自动作答 */
  @Post('inquiries/:id/answers')
  answer(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AnswerDto,
  ) {
    return this.service.answer(id, user.id, user.username ?? user.email ?? user.phone ?? '道友', dto);
  }

  /** 发布者采纳回答（悬赏结算） */
  @Post('inquiries/:id/accept/:answerId')
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('answerId') answerId: string) {
    return this.service.accept(id, user.id, answerId);
  }
}
