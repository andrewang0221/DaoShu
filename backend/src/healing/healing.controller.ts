import { Body, Controller, Get, Post } from '@nestjs/common';
import { Public } from '../common';
import { HealingService } from './healing.service';

@Controller('healing')
export class HealingController {
  constructor(private readonly service: HealingService) {}

  /** 情绪识别与疏导建议 */
  @Post('assess')
  assess(@Body() body: { text: string }) {
    return this.service.assess(body.text);
  }

  /** 焦虑急救（高危自动转介） */
  @Post('sos')
  sos(@Body() body: { text: string }) {
    return this.service.sos(body.text);
  }

  /** 四类道家情绪调节练习（游客可浏览） */
  @Public()
  @Get('patterns')
  getPatterns() {
    return this.service.getPatterns();
  }

  /** 每周复盘模板 */
  @Post('weekly-review')
  weeklyReview(@Body() body: { records?: string[] }) {
    return this.service.weeklyReview(body.records);
  }
}