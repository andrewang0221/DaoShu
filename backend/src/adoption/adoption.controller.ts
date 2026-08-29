import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  AdoptionService,
  CreateDigitalHumanDto,
  UpdateDigitalHumanDto,
} from './adoption.service';
import { AuthUser, avatarUploadDir, modelUploadDir, CurrentUser } from '../common';
import { GlbGenerationService } from './glb-generation.service';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_GLB_BYTES = 50 * 1024 * 1024; // 50MB

@Controller('adoption')
export class AdoptionController {
  constructor(
    private readonly adoption: AdoptionService,
    private readonly glbGen: GlbGenerationService,
  ) {}

  /** 拼接上传文件的公网访问 URL（ASSET_PUBLIC_BASE 作主机前缀，目录由 base 决定；否则按请求 host） */
  private assetUrl(name: string, base: string, req?: Request): string {
    const clean = base.replace(/^\/?|\/$/g, '');
    const configured = process.env.ASSET_PUBLIC_BASE;
    if (configured && /^https?:\/\//.test(configured)) {
      // 仅取协议+主机部分，历史配置可能含 /uploads/avatars 之类的路径，需剥离避免覆盖 base 目录
      let prefix = configured.replace(/\/$/, '');
      const m = prefix.match(/^(https?:\/\/[^/]+)/);
      if (m) prefix = m[1];
      return `${prefix}/${clean}/${name}`;
    }
    const host = req?.get?.('host') ?? `localhost:${process.env.PORT ?? 3081}`;
    return `http://${host}/${clean}/${name}`;
  }

  @Get('quiz')
  getQuiz() {
    return this.adoption.getQuiz();
  }

  @Post('quiz')
  submitQuiz(
    @CurrentUser() user: AuthUser,
    @Body('answers') answers: Record<string, number> | undefined,
  ) {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      throw new BadRequestException('问卷答案格式不正确');
    }
    return this.adoption.submitQuiz(user.id, answers);
  }

  /** 上传人物照片（认养形象参考），返回可公网访问的绝对 URL */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@UploadedFile() file?: Express.Multer.File, @Req() req?: Request) {
    if (!file) throw new BadRequestException('未收到照片文件');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 JPG / PNG / WebP 图片');
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new BadRequestException('照片大小不能超过 5MB');
    }
    const ext = file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg';
    const name = `${randomUUID()}${ext}`;
    fs.writeFileSync(path.join(avatarUploadDir(), name), file.buffer);
    return { url: this.assetUrl(name, '/uploads/avatars', req), size: file.size, mimetype: file.mimetype };
  }

  /** 上传 .glb 三维头像模型文件（由 Instant-Avatar / DreamFace 等外部工具产出），返回可公网访问的绝对 URL */
  @Post('glb')
  @UseInterceptors(FileInterceptor('file'))
  uploadGlb(@UploadedFile() file?: Express.Multer.File, @Req() req?: Request) {
    if (!file) throw new BadRequestException('未收到模型文件');
    if (file.size > MAX_GLB_BYTES) {
      throw new BadRequestException('模型文件不能超过 50MB');
    }
    if (!file.buffer.subarray(0, 4).toString('ascii').startsWith('glTF')) {
      throw new BadRequestException('仅支持 GLB 格式（.glb）三维模型文件');
    }
    const name = `${randomUUID()}.glb`;
    fs.writeFileSync(path.join(modelUploadDir(), name), file.buffer);
    return { url: this.assetUrl(name, '/uploads/models', req), size: file.size };
  }

  /** 照片 → 3D 生成服务（Instant-Avatar / DreamFace 等）→ .glb 模型，全程不依赖视觉大模型 */
  @Post('avatar-glb')
  @UseInterceptors(FileInterceptor('file'))
  async generateAvatarGlb(@UploadedFile() file?: Express.Multer.File, @Req() req?: Request) {
    if (!file) throw new BadRequestException('未收到照片文件');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 JPG / PNG / WebP 图片');
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new BadRequestException('照片大小不能超过 5MB');
    }
    const glb = await this.glbGen.generate(file.buffer, file.mimetype, `photo${file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg'}`);
    const name = `${randomUUID()}.glb`;
    fs.writeFileSync(path.join(modelUploadDir(), name), glb);
    return { glbUrl: this.assetUrl(name, '/uploads/models', req), size: glb.length };
  }

  @Post('digital-human')
  createDigitalHuman(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDigitalHumanDto,
  ) {
    return this.adoption.createDigitalHuman(user.id, dto);
  }

  /** 局部更新当前数字人（chat 页换头像 / 局部重设形象） */
  @Put('digital-human')
  updateDigitalHuman(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDigitalHumanDto,
  ) {
    return this.adoption.updateDigitalHuman(user.id, dto);
  }

  @Post('contract/:digitalHumanId')
  signContract(@CurrentUser() user: AuthUser, @Param('digitalHumanId') id: string) {
    return this.adoption.signContract(user.id, id);
  }

  @Get('panel/:digitalHumanId?')
  panel(@CurrentUser() user: AuthUser, @Param('digitalHumanId') digitalHumanId?: string) {
    return this.adoption.panel(user.id, digitalHumanId);
  }
}
