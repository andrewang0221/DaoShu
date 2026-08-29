import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { CurrentUser, IS_DEMO, Public } from '../common';
import { StudyService } from './study.service';

@Controller('study')
export class StudyController {
  constructor(private readonly service: StudyService) {}

  /** 从请求头解析可选用户：游客返回 null（演示模式固定 demo-user） */
  private optionalUserId(req: Request): string | null {
    if (IS_DEMO()) return 'demo-user';
    const header: string | undefined = req.headers?.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET ?? 'dev-secret') as {
        id?: string;
      };
      return payload.id ?? null;
    } catch {
      return null;
    }
  }

  /** 章节列表（游客可访问，含进度与锁定标记） */
  @Public()
  @Get('chapters')
  chapters(@Req() req: Request) {
    return this.service.listChapters(this.optionalUserId(req));
  }

  /** 章节详情（游客仅可看前三章） */
  @Public()
  @Get('chapters/:no')
  chapter(@Req() req: Request, @Param('no') no: string) {
    return this.service.getChapter(Number(no), this.optionalUserId(req));
  }

  /** 标记研学完成（需登录） */
  @Post('chapters/:no/complete')
  complete(@CurrentUser() user: { id: string }, @Param('no') no: string) {
    return this.service.complete(user.id, Number(no));
  }

  /** 学习进度汇总（需登录） */
  @Get('progress')
  progress(@CurrentUser() user: { id: string }) {
    return this.service.summary(user.id);
  }

  // ---------- 书斋：笔记与划句标注（均需登录） ----------

  /** 某章笔记与标注列表 */
  @Get('chapters/:no/notes')
  listNotes(@CurrentUser() user: { id: string }, @Param('no') no: string) {
    return this.service.listNotes(user.id, Number(no));
  }

  /** 新增笔记（可带 quote 引用原句） */
  @Post('chapters/:no/notes')
  addNote(
    @CurrentUser() user: { id: string },
    @Param('no') no: string,
    @Body() body: { section?: string; quote?: string; content?: string },
  ) {
    return this.service.addNote(user.id, Number(no), body ?? {});
  }

  /** 删除笔记 */
  @Delete('notes/:id')
  removeNote(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.service.removeNote(user.id, id);
  }

  /** 划句标注 toggle（再点一次取消） */
  @Post('chapters/:no/marks')
  toggleMark(
    @CurrentUser() user: { id: string },
    @Param('no') no: string,
    @Body() body: { quote: string },
  ) {
    return this.service.toggleMark(user.id, Number(no), body?.quote ?? '');
  }
}
