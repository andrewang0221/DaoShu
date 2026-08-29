import { Body, Controller, Get, Post } from '@nestjs/common';
import { DaoshuService } from './daoshu.service';

@Controller('daoshu')
export class DaoshuController {
  constructor(private readonly service: DaoshuService) {}

  /** 对齐框架（注入包）：总纲 + 八维规则 + 反思链 + 审计口径 */
  @Get('frameworks')
  getFrameworks() {
    return this.service.getFrameworks();
  }

  /** 反思链四问：对文本做决策前自检 */
  @Post('reflect')
  reflect(@Body() body: { text: string }) {
    return this.service.reflect(body.text);
  }

  /** 审计 API：四维评分（无为/守中/自然/知足） */
  @Post('audit')
  audit(@Body() body: { text: string }) {
    return this.service.audit(body.text);
  }

  /** 对齐知识库条目 */
  @Get('alignment-knowledge')
  getAlignmentKnowledge() {
    return this.service.getAlignmentKnowledge();
  }

  /** 元层规律库条目 */
  @Get('meta-knowledge')
  getMetaKnowledge() {
    return this.service.getMetaKnowledge();
  }
}