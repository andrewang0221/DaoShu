import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, Public } from '../common';
import { IprService } from './ipr.service';

/**
 * 知识产权服务（V2.9）
 * - GET  /ipr/catalog        服务目录（公开）
 * - GET  /ipr/works          我的沉淀作品候选（需登录）
 * - POST /ipr/applications   提交申请（需登录）
 * - GET  /ipr/applications   我的申请列表（需登录）
 * - GET  /ipr/applications/:id 申请详情（本人）
 */
@Controller('ipr')
export class IprController {
  constructor(private readonly service: IprService) {}

  /** 服务目录（游客可浏览） */
  @Public()
  @Get('catalog')
  catalog() {
    return this.service.catalog();
  }

  /** 我的沉淀作品（可一键发起申请的原创内容） */
  @Get('works')
  works(@CurrentUser() user: { id: string }) {
    return this.service.myWorks(user.id);
  }

  /** 提交著作权代办 / 数字存证申请 */
  @Post('applications')
  submit(
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      serviceType: string;
      workTitle: string;
      workType?: string;
      workSource?: string;
      workRefId?: string;
      workMeta?: Record<string, unknown>;
      applicant?: Record<string, unknown>;
    },
  ) {
    return this.service.submit(user.id, body ?? {});
  }

  /** 我的申请列表 */
  @Get('applications')
  myApplications(@CurrentUser() user: { id: string }) {
    return this.service.myApplications(user.id);
  }

  /** 申请详情（本人） */
  @Get('applications/:id')
  detail(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.service.detail(id, user.id, false);
  }
}
