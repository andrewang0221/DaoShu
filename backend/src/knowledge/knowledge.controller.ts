import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { KnowledgeService, RecommendDto } from './knowledge.service';
import { AuthUser, CurrentUser, Public, Roles } from '../common';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  /** 成员推荐知识 */
  @Post('recommend')
  recommend(@CurrentUser() user: AuthUser, @Body() dto: RecommendDto) {
    return this.knowledge.recommend(user.id, dto);
  }

  /** 检索总库（游客可预览，公开只读） */
  @Public()
  @Get('items')
  search(@Query('chapterNo') chapterNo?: string, @Query('keyword') keyword?: string) {
    return this.knowledge.search(chapterNo ? Number(chapterNo) : undefined, keyword);
  }
}

/** 管理端（需 admin 角色，演示模式自动放行） */
@Controller('admin/knowledge')
@Roles('admin')
export class AdminKnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Post('import')
  import() {
    return this.knowledge.adminImport();
  }

  @Get('review-queue')
  queue() {
    return this.knowledge.reviewQueue();
  }

  @Post('review/:id')
  review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: { action: 'approve' | 'reject' | 'needs_revision'; note?: string },
  ) {
    return this.knowledge.review(id, dto.action, dto.note, user.id);
  }
}
