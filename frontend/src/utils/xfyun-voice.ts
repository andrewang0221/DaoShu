/**
 * 讯飞语音交互（V2.6 · H5）
 *
 * - XfyunIatRecorder：麦克风 → 16k Int16 PCM → IAT WebSocket 流式识别（wpgs 动态修正）
 * - xfyunTts：文本 → TTS WebSocket 流式合成 mp3 → Blob 播放
 * - 签名 URL 由后端 /speech/config 下发，凭据不落前端
 */

import { get } from '../api/request';

export interface SpeechAuth {
  protocol: string;
  appId: string;
  iatUrl: string;
  ttsUrl: string;
  business: Record<string, unknown>;
  tts: { voice: string; speed: number };
}

let cachedAuth: SpeechAuth | null = null;

/** 获取签名直连配置（短缓存，签名 URL 有效期内复用） */
export async function getSpeechAuth(): Promise<SpeechAuth> {
  if (cachedAuth) return cachedAuth;
  const r = await get<SpeechAuth>('/speech/config');
  cachedAuth = r;
  // 签名有效期约 5 分钟，4 分钟后失效缓存
  setTimeout(() => (cachedAuth = null), 4 * 60 * 1000);
  return r;
}

// ---------- 音频工具 ----------

/** 设备采样率 → 16k Int16 PCM（线性平均降采样） */
export function downsampleTo16kInt16(input: Float32Array, inputRate: number): Int16Array {
  if (inputRate === 16000) {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) out[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
    return out;
  }
  const ratio = inputRate / 16000;
  const outLen = Math.floor(input.length / ratio);
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    let n = 0;
    for (let j = start; j < end; j++) {
      sum += input[j];
      n++;
    }
    const avg = n > 0 ? sum / n : 0;
    out[i] = Math.max(-1, Math.min(1, avg)) * 0x7fff;
  }
  return out;
}

function int16ToBase64(pcm: Int16Array): string {
  const buf = new Uint8Array(pcm.buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + CHUNK)) as unknown as number[]);
  }
  return btoa(binary);
}

// ---------- IAT 流式识别 ----------

interface IatCallbacks {
  /** 中间结果（可动态修正） */
  onPartial?: (text: string) => void;
  /** 结束/出错回调 */
  onDone: (text: string, err?: Error) => void;
}

export class XfyunIatRecorder {
  private ws: WebSocket | null = null;
  private audioCtx: (AudioContext & { sampleRate: number }) | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private segments = new Map<number, string>();
  private lastPartial = '';
  private stopped = false;
  private firstFrame = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly cb: IatCallbacks) {}

  /** 开始录音识别 */
  async start(): Promise<void> {
    this.stopped = false;
    const auth = await getSpeechAuth();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    this.audioCtx = new AudioContext() as AudioContext & { sampleRate: number };
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
    this.source.connect(this.processor);
    // 不接 destination（避免回声）
    this.processor.connect(this.audioCtx.destination);
    this.openWs(auth);
    this.processor.onaudioprocess = (e) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const pcm = downsampleTo16kInt16(e.inputBuffer.getChannelData(0), this.audioCtx!.sampleRate);
      const b64 = int16ToBase64(pcm);
      if (this.firstFrame) {
        this.firstFrame = false;
        this.ws.send(
          JSON.stringify({
            common: { app_id: auth.appId },
            business: auth.business,
            data: { status: 0, format: 'audio/L16;rate=16000', encoding: 'raw', audio: b64 },
          }),
        );
      } else {
        this.ws.send(
          JSON.stringify({
            data: { status: 1, format: 'audio/L16;rate=16000', encoding: 'raw', audio: b64 },
          }),
        );
      }
    };
  }

  private openWs(auth: SpeechAuth) {
    const ws = new WebSocket(auth.iatUrl);
    this.ws = ws;
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as {
          code: number;
          message: string;
          data?: {
            status: number;
            result?: {
              sn: number;
              pgs?: string;
              rg?: number[];
              ws?: { cw?: { w?: string }[] }[];
            };
          };
        };
        if (msg.code !== 0) {
          this.cleanup();
          this.cb.onDone(this.transcript(), new Error(`语音识别错误 ${msg.code}：${msg.message}`));
          return;
        }
        const r = msg.data?.result;
        if (r) {
          const text = (r.ws ?? []).map((w) => (w.cw ?? []).map((c) => c.w ?? '').join('')).join('');
          if (r.pgs === 'rpl' && r.rg) {
            for (let sn = r.rg[0]; sn <= r.rg[1]; sn++) this.segments.delete(sn);
          }
          this.segments.set(r.sn, text);
          const partial = this.transcript();
          this.lastPartial = partial;
          this.cb.onPartial?.(partial);
        }
        // 一段识别结束：讯飞单连接 60s/静音断句上限，立即重开连接续传
        if (msg.data?.status === 2 && !this.stopped) {
          this.firstFrame = true;
          this.reconnectTimer = setTimeout(() => this.reopenWs(), 120);
        }
      } catch {
        /* 忽略解析异常帧 */
      }
    };
    ws.onerror = () => {
      if (!this.stopped) {
        this.cleanup();
        this.cb.onDone(this.lastPartial, new Error('语音识别连接失败，请重试'));
      }
    };
  }

  private async reopenWs() {
    if (this.stopped) return;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    const auth = await getSpeechAuth();
    this.openWs(auth);
  }

  /** 拼接分段（按 sn 排序） */
  private transcript(): string {
    return Array.from(this.segments.keys())
      .sort((a, b) => a - b)
      .map((k) => this.segments.get(k) ?? '')
      .join('');
  }

  /** 停止录音并等待最终结果 */
  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          data: { status: 2, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' },
        }),
      );
      // 给服务端 800ms 返回最终结果，随后强制收尾
      const ws = this.ws;
      setTimeout(() => {
        this.cleanup();
        this.cb.onDone(this.transcript());
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      }, 800);
    } else {
      this.cleanup();
      this.cb.onDone(this.transcript());
    }
  }

  private cleanup() {
    try {
      this.processor && (this.processor.onaudioprocess = null);
      this.processor?.disconnect();
      this.source?.disconnect();
      this.stream?.getTracks().forEach((t) => t.stop());
      void this.audioCtx?.close();
    } catch {
      /* ignore */
    }
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.audioCtx = null;
  }
}

// ---------- TTS 流式合成 ----------

/**
 * 文本 → 讯飞 TTS WebSocket → mp3 Blob（分片 base64 解码后二进制拼接）
 * 返回可播放的 Blob URL；调用方负责 revokeObjectURL
 */
export async function xfyunTts(text: string, onChunk?: () => void): Promise<string> {
  const clean = text.trim().slice(0, 500);
  if (!clean) throw new Error('合成文本为空');
  const auth = await getSpeechAuth();
  return new Promise<string>((resolve, reject) => {
    const ws = new WebSocket(auth.ttsUrl);
    const chunks: Uint8Array[] = [];
    let settled = false;
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      reject(err);
    };
    const timer = setTimeout(() => fail(new Error('语音合成超时')), 20000);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          common: { app_id: auth.appId },
          business: {
            aue: 'lame',
            auf: 'audio/L16;rate=16000',
            vcn: auth.tts.voice,
            speed: auth.tts.speed,
            volume: 50,
            pitch: 50,
            tte: 'UTF8',
          },
          data: { status: 2, text: btoa(unescape(encodeURIComponent(clean))) },
        }),
      );
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as {
          code: number;
          message: string;
          data?: { audio?: string; status?: number };
        };
        if (msg.code !== 0) {
          clearTimeout(timer);
          fail(new Error(`语音合成错误 ${msg.code}：${msg.message || ''}`));
          return;
        }
        if (msg.data?.audio) {
          const bin = atob(msg.data.audio);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          chunks.push(bytes);
          onChunk?.();
        }
        if (msg.data?.status === 2) {
          clearTimeout(timer);
          if (settled) return;
          settled = true;
          const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
          resolve(URL.createObjectURL(blob));
          setTimeout(() => {
            try {
              ws.close();
            } catch {
              /* ignore */
            }
          }, 200);
        }
      } catch {
        /* 忽略解析异常帧 */
      }
    };
    ws.onerror = () => {
      clearTimeout(timer);
      fail(new Error('语音合成连接失败'));
    };
  });
}
