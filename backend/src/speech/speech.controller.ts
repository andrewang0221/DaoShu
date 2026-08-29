/**
 * 语音交互接口（V2.6 · 讯飞）
 *
 * 用户端（/speech）：
 * - GET  /speech/config   获取 IAT/TTS 双签名直连 URL + 合成配置（凭据不下发）
 *
 * 管理端（/admin/speech，需 admin 角色）：
 * - GET  /admin/speech         配置详情（Key 脱敏）
 * - PUT  /admin/speech         保存配置（Key/Secret 空串 = 沿用已存值）
 * - POST /admin/speech/test    连通性测试（WebSocket 真实合成一段音频）
 */

import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { Roles } from '../common';
import { SpeechConfigInput, SpeechService } from './speech.service';

@Controller('speech')
export class SpeechController {
  constructor(private readonly speech: SpeechService) {}

  /** IAT/TTS 签名直连配置（前端 WS 语音识别与合成用） */
  @Get('config')
  config() {
    return this.speech.voiceAuth();
  }
}

@Controller('admin/speech')
@Roles('admin')
export class AdminSpeechController {
  constructor(private readonly speech: SpeechService) {}

  @Get()
  getConfig() {
    return this.speech.getConfig();
  }

  @Put()
  saveConfig(@Body() dto: SpeechConfigInput) {
    return this.speech.saveConfig(dto);
  }

  @Post('test')
  test(@Body() dto: SpeechConfigInput) {
    return this.speech.testConfig(dto);
  }
}
