import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GrowthService } from './growth.service';

@Controller('growth')
export class GrowthController {
  constructor(private readonly service: GrowthService) {}

  /** 道系人格测试问卷 */
  @Get('daoxi-quiz')
  getQuiz() {
    return this.service.getQuiz();
  }

  /** 提交答案 → 16 型人格 + 分享卡 */
  @Post('daoxi-quiz')
  submitQuiz(@Body() body: { answers: Record<string, number> }) {
    return this.service.submitQuiz(body.answers);
  }

  /** 每日箴言卡 */
  @Get('proverb-card')
  dailyProverb() {
    return this.service.dailyProverb();
  }

  /** 邀请文案 */
  @Get('invite')
  invite(@Query('persona') persona?: string) {
    return this.service.invite(persona);
  }
}