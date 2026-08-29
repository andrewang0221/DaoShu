/**
 * 语音服务（V2.6 · 讯飞开放平台）
 *
 * - ASR：后端 HMAC-SHA256 签名生成 IAT WebSocket 直连 URL（凭据不落前端），前端流式推送 16k PCM
 * - TTS：后端签名生成在线语音合成（流式版）WebSocket 直连 URL，前端直连合成 mp3 并驱动数字人口型
 * - 配置：speech_configs 表（管理后台 /admin/speech 可改），未配置时回落环境变量
 */

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';

const IAT_HOST = 'iat-api.xfyun.cn';
const IAT_PATH = '/v2/iat';
const TTS_HOST = 'tts-api.xfyun.cn';
const TTS_PATH = '/v2/tts';

export interface SpeechConfig {
  provider: string;
  appId: string;
  apiKey: string;
  apiSecret: string;
  ttsVoice: string;
  ttsSpeed: number;
  enabled: boolean;
}

export interface SpeechConfigInput {
  appId?: string;
  apiKey?: string;
  apiSecret?: string;
  ttsVoice?: string;
  ttsSpeed?: number;
  enabled?: boolean;
}

/** 讯飞 WebSocket 鉴权签名（IAT/TTS 通用：GET {path} HTTP/1.1） */
function signedWsUrl(apiKey: string, apiSecret: string, host: string, path: string): string {
  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  const signature = createHmac('sha256', apiSecret).update(signatureOrigin).digest('base64');
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  const params = new URLSearchParams({ authorization, date, host });
  return `wss://${host}${path}?${params.toString()}`;
}

@Injectable()
export class SpeechService {
  private readonly logger = new Logger(SpeechService.name);

  constructor(private readonly db: DatabaseService) {}

  /** 读取生效配置：speech_configs 表优先，环境变量兜底 */
  async getActiveConfig(): Promise<SpeechConfig | null> {
    if (!IS_DEMO()) {
      const rows = await this.db.query<Record<string, unknown>>(
        `SELECT provider, app_id, api_key, api_secret, tts_voice, tts_speed, enabled
         FROM speech_configs WHERE enabled = true ORDER BY updated_at DESC LIMIT 1`,
      );
      const r = rows[0];
      if (r?.app_id && r.api_key && r.api_secret) {
        return {
          provider: (r.provider as string) ?? 'xfyun',
          appId: r.app_id as string,
          apiKey: r.api_key as string,
          apiSecret: r.api_secret as string,
          ttsVoice: (r.tts_voice as string) ?? 'xiaoyan',
          ttsSpeed: (r.tts_speed as number) ?? 50,
          enabled: true,
        };
      }
    }
    const appId = process.env.XFYUN_APP_ID;
    const apiKey = process.env.XFYUN_API_KEY;
    const apiSecret = process.env.XFYUN_API_SECRET;
    if (appId && apiKey && apiSecret) {
      return {
        provider: 'xfyun',
        appId,
        apiKey,
        apiSecret,
        ttsVoice: process.env.XFYUN_TTS_VOICE ?? 'xiaoyan',
        ttsSpeed: 50,
        enabled: true,
      };
    }
    return null;
  }

  /** 语音直连配置（IAT 识别 + TTS 合成双签名 URL，凭据不外泄） */
  async voiceAuth(): Promise<{
    protocol: string;
    appId: string;
    iatUrl: string;
    ttsUrl: string;
    business: Record<string, unknown>;
    tts: { voice: string; speed: number };
  }> {
    const cfg = await this.getActiveConfig();
    if (!cfg) {
      throw new BadRequestException(
        '语音服务尚未配置：请在管理后台「语音配置」填入讯飞 AppID / APIKey / APISecret',
      );
    }
    return {
      protocol: 'xfyun',
      appId: cfg.appId,
      iatUrl: signedWsUrl(cfg.apiKey, cfg.apiSecret, IAT_HOST, IAT_PATH),
      ttsUrl: signedWsUrl(cfg.apiKey, cfg.apiSecret, TTS_HOST, TTS_PATH),
      business: { language: 'zh_cn', domain: 'iat', accent: 'mandarin', dwa: 'wpgs', eos: 6000 },
      tts: { voice: cfg.ttsVoice, speed: cfg.ttsSpeed },
    };
  }

  // ---------- 管理端 ----------

  /** 语音配置详情（脱敏） */
  async getConfig(): Promise<{
    configured: boolean;
    appId?: string;
    apiKeyMasked?: string;
    apiSecretMasked?: string;
    ttsVoice: string;
    ttsSpeed: number;
    enabled: boolean;
    source: 'db' | 'env' | 'none';
  }> {
    if (!IS_DEMO()) {
      const rows = await this.db.query<Record<string, unknown>>(
        `SELECT app_id, api_key, api_secret, tts_voice, tts_speed, enabled
         FROM speech_configs ORDER BY updated_at DESC LIMIT 1`,
      );
      const r = rows[0];
      if (r) {
        return {
          configured: !!(r.app_id && r.api_key && r.api_secret),
          appId: r.app_id as string | undefined,
          apiKeyMasked: mask(r.api_key as string),
          apiSecretMasked: mask(r.api_secret as string),
          ttsVoice: (r.tts_voice as string) ?? 'xiaoyan',
          ttsSpeed: (r.tts_speed as number) ?? 50,
          enabled: (r.enabled as boolean) ?? true,
          source: 'db',
        };
      }
    }
    const appId = process.env.XFYUN_APP_ID;
    const apiKey = process.env.XFYUN_API_KEY;
    const apiSecret = process.env.XFYUN_API_SECRET;
    if (appId && apiKey && apiSecret) {
      return {
        configured: true,
        appId,
        apiKeyMasked: mask(apiKey),
        apiSecretMasked: mask(apiSecret),
        ttsVoice: process.env.XFYUN_TTS_VOICE ?? 'xiaoyan',
        ttsSpeed: 50,
        enabled: true,
        source: 'env',
      };
    }
    return { configured: false, ttsVoice: 'xiaoyan', ttsSpeed: 50, enabled: false, source: 'none' };
  }

  /** 保存配置（apiKey/apiSecret 传空串或缺省 = 沿用已存值） */
  async saveConfig(dto: SpeechConfigInput) {
    if (IS_DEMO()) {
      return { ok: true, demo: true, message: '演示模式：配置请在完整模式或云端管理后台保存' };
    }
    const cur = await this.db.query<Record<string, unknown>>(
      `SELECT id, app_id, api_key, api_secret FROM speech_configs ORDER BY updated_at DESC LIMIT 1`,
    );
    const appId = dto.appId?.trim();
    if (!appId) throw new BadRequestException('AppID 不能为空');
    const apiKey = dto.apiKey?.trim() || (cur[0]?.api_key as string | undefined);
    const apiSecret = dto.apiSecret?.trim() || (cur[0]?.api_secret as string | undefined);
    if (!apiKey || !apiSecret) throw new BadRequestException('APIKey / APISecret 不能为空');
    const ttsVoice = dto.ttsVoice || 'xiaoyan';
    const ttsSpeed = dto.ttsSpeed ?? 50;
    const enabled = dto.enabled ?? true;
    if (cur[0]?.id) {
      await this.db.query(
        `UPDATE speech_configs SET app_id=$1, api_key=$2, api_secret=$3, tts_voice=$4, tts_speed=$5, enabled=$6, updated_at=now() WHERE id=$7`,
        [appId, apiKey, apiSecret, ttsVoice, ttsSpeed, enabled, cur[0].id],
      );
    } else {
      await this.db.query(
        `INSERT INTO speech_configs (provider, app_id, api_key, api_secret, tts_voice, tts_speed, enabled)
         VALUES ('xfyun', $1, $2, $3, $4, $5, $6)`,
        [appId, apiKey, apiSecret, ttsVoice, ttsSpeed, enabled],
      );
    }
    return { ok: true };
  }

  /**
   * 连通性测试：用直传凭据（缺省读已存配置）签名后连 TTS WebSocket 合成一小段音频。
   * 凭据错误/服务未开通会收到讯飞错误码，据此返回明确提示。
   */
  async testConfig(dto: SpeechConfigInput): Promise<{ ok: boolean; message: string }> {
    const dbCfg = await this.getActiveConfig();
    const appId = dto.appId?.trim() || dbCfg?.appId;
    const apiKey = dto.apiKey?.trim() || dbCfg?.apiKey;
    const apiSecret = dto.apiSecret?.trim() || dbCfg?.apiSecret;
    if (!appId || !apiKey || !apiSecret) {
      throw new BadRequestException('请先填写完整的 AppID / APIKey / APISecret');
    }
    const vcn = dto.ttsVoice || dbCfg?.ttsVoice || 'xiaoyan';
    const speed = dto.ttsSpeed ?? dbCfg?.ttsSpeed ?? 50;

    const url = signedWsUrl(apiKey, apiSecret, TTS_HOST, TTS_PATH);
    const text = Buffer.from('道可道，非常道。', 'utf-8').toString('base64');

    return new Promise((resolve) => {
      let audioBytes = 0;
      let settled = false;
      const finish = (ok: boolean, message: string) => {
        if (settled) return;
        settled = true;
        try {
          ws.close();
        } catch {
          /* ignore */
        }
        resolve({ ok, message });
      };
      const WS = require('ws') as typeof import('ws');
      const ws = new WS(url);
      const timer = setTimeout(() => finish(false, '测试超时（15 秒无响应）'), 15000);
      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            common: { app_id: appId },
            business: { aue: 'lame', auf: 'audio/L16;rate=16000', vcn, speed, volume: 50, pitch: 50, tte: 'UTF8' },
            data: { status: 2, text },
          }),
        );
      });
      ws.on('message', (raw: unknown) => {
        try {
          const msg = JSON.parse(String(raw)) as {
            code: number;
            message: string;
            data?: { audio?: string; status?: number };
          };
          if (msg.code !== 0) {
            clearTimeout(timer);
            finish(false, `讯飞返回错误 ${msg.code}：${msg.message || '请检查凭据/服务授权'}`);
            return;
          }
          if (msg.data?.audio) audioBytes += Math.floor((msg.data.audio.length * 3) / 4);
          if (msg.data?.status === 2) {
            clearTimeout(timer);
            finish(
              audioBytes > 0,
              audioBytes > 0
                ? `连通性测试通过，合成音频约 ${audioBytes} 字节（音色 ${vcn}）`
                : '握手成功但未返回音频，请检查发音人授权',
            );
          }
        } catch {
          /* 忽略解析异常帧 */
        }
      });
      ws.on('error', (err: Error) => {
        clearTimeout(timer);
        finish(false, `WebSocket 连接失败：${err.message}`);
      });
      ws.on('close', () => {
        clearTimeout(timer);
        finish(audioBytes > 0, audioBytes > 0 ? `连通性测试通过，合成音频约 ${audioBytes} 字节` : '连接已关闭（未收到音频）');
      });
    });
  }
}

function mask(s: string | undefined): string | undefined {
  if (!s) return undefined;
  if (s.length <= 8) return '****';
  return `${s.slice(0, 4)}****${s.slice(-4)}`;
}
