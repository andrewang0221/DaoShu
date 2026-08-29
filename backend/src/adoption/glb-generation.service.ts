import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

/**
 * 照片 → 3D 头像（.glb）生成前置模块
 *
 * 不依赖任何视觉大模型：将用户照片转发给专门的「照片转 3D」生成服务
 * （自部署 Instant-Avatar / DreamFace，或任何兼容 HTTP 网关），直接拿回 .glb 网格文件。
 *
 * 环境变量配置：
 * - GLB_GEN_API_URL  必填。生成服务地址，POST multipart（字段名 image）。
 * - GLB_GEN_API_KEY  可选。以 Bearer Token 随请求携带。
 * - GLB_GEN_TIMEOUT_MS 可选。生成超时（毫秒），默认 300000（5 分钟，3D 生成普遍较慢）。
 *
 * 响应协议（自动识别）：
 * 1. 二进制 glb（Content-Type: model/gltf-binary / application/octet-stream）→ 直接落盘；
 * 2. JSON：{ glb_url | model_url | url | output } → 后端下载该 URL 的 glb 落盘。
 */
@Injectable()
export class GlbGenerationService {
  private readonly logger = new Logger(GlbGenerationService.name);

  /** 是否已配置照片生成服务 */
  get enabled(): boolean {
    return !!process.env.GLB_GEN_API_URL;
  }

  /** 照片 → glb 二进制 */
  async generate(photo: Buffer, mime: string, filename: string): Promise<Buffer> {
    const url = process.env.GLB_GEN_API_URL;
    if (!url) {
      throw new ServiceUnavailableException(
        '照片生成 3D 服务尚未配置（GLB_GEN_API_URL），可改用「直接上传 GLB 模型」',
      );
    }
    const apiKey = process.env.GLB_GEN_API_KEY;
    const timeoutMs = Number(process.env.GLB_GEN_TIMEOUT_MS ?? 300000);

    const form = new FormData();
    form.append('image', new Blob([new Uint8Array(photo)], { type: mime }), filename);

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
        body: form,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      this.logger.warn(`照片生成 3D 服务请求失败：${(e as Error).message}`);
      throw new ServiceUnavailableException('照片生成 3D 服务暂不可用，请稍后重试或直接上传 GLB');
    }
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      this.logger.warn(`照片生成 3D 服务返回 ${resp.status}：${detail.slice(0, 300)}`);
      throw new BadRequestException(`3D 生成服务返回错误（${resp.status}），请更换照片重试或直接上传 GLB`);
    }

    const ctype = resp.headers.get('content-type') ?? '';
    if (/json/i.test(ctype)) {
      const json = (await resp.json().catch(() => null)) as Record<string, unknown> | null;
      const glbUrl = this.pickGlbUrl(json);
      if (!glbUrl) {
        throw new BadRequestException('3D 生成服务未返回模型地址，请直接上传 GLB');
      }
      return this.download(glbUrl, timeoutMs);
    }
    // 二进制响应直接落盘
    const buf = Buffer.from(await resp.arrayBuffer());
    this.assertGlb(buf);
    return buf;
  }

  /** 生成服务返回的 JSON 中提取 glb 下载地址 */
  private pickGlbUrl(json: Record<string, unknown> | null): string | null {
    if (!json) return null;
    const candidates = [json.glb_url, json.model_url, json.url, json.output];
    for (const c of candidates) {
      if (typeof c === 'string' && /^https?:\/\//.test(c)) return c;
      if (c && typeof c === 'object') {
        const nested = c as Record<string, unknown>;
        const inner = nested.glb_url ?? nested.url ?? nested.model_url;
        if (typeof inner === 'string' && /^https?:\/\//.test(inner)) return inner;
      }
    }
    return null;
  }

  private async download(url: string, timeoutMs: number): Promise<Buffer> {
    const resp = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!resp.ok) {
      throw new BadRequestException(`下载 3D 模型失败（${resp.status}）`);
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    this.assertGlb(buf);
    return buf;
  }

  /** 校验 glb 魔数（前 4 字节为 'glTF'） */
  private assertGlb(buf: Buffer): void {
    if (buf.length < 12 || buf.subarray(0, 4).toString('ascii') !== 'glTF') {
      throw new BadRequestException('返回内容不是有效的 GLB 模型文件');
    }
  }
}
