import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { EvolutionService } from './evolution.service';
import { AuthUser, CurrentUser } from '../common';

@Controller('evolution')
export class EvolutionController {
  constructor(private readonly evolution: EvolutionService) {}

  /** 获取成长复盘列表 */
  @Get('reviews/:dhId')
  reviews(@Param('dhId') dhId: string) {
    return this.evolution.getGrowthReviews(dhId);
  }

  /** 生成成长复盘 */
  @Post('reviews/:dhId')
  generateReview(@CurrentUser() user: AuthUser, @Param('dhId') dhId: string) {
    return this.evolution.generateGrowthReview(dhId, user?.id);
  }

  /** 获取进化指标 */
  @Get('metrics/:dhId')
  metrics(@Param('dhId') dhId: string) {
    return this.evolution.getEvolutionMetrics(dhId);
  }

  /** 获取记忆列表 */
  @Get('memory/:dhId')
  memory(@Param('dhId') dhId: string) {
    return this.evolution.getMemories(dhId);
  }

  /** 检索相关记忆 */
  @Post('memory/:dhId/search')
  searchMemory(@Param('dhId') dhId: string, @Body('query') query: string) {
    return this.evolution.searchMemory(dhId, query);
  }

  /** 确认记忆 */
  @Post('memory/:dhId/:memoryId/confirm')
  confirmMemory(@Param('dhId') dhId: string, @Param('memoryId') memoryId: string) {
    return this.evolution.confirmMemory(dhId, memoryId);
  }

  /** 删除记忆（遗忘权） */
  @Delete('memory/:dhId/:memoryId')
  deleteMemory(@Param('dhId') dhId: string, @Param('memoryId') memoryId: string) {
    return this.evolution.deleteMemory(dhId, memoryId);
  }

  /** 一致性审计 */
  @Post('audit')
  audit(@CurrentUser() user: AuthUser, @Body() dto: { anchorPrompt: string; responseText: string }) {
    return this.evolution.auditConsistency(dto.anchorPrompt, dto.responseText, user?.id);
  }
}
