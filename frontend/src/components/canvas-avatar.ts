/**
 * 内置 2D 数字人（Canvas 绘制，三端通用）
 * - 风格：古老男女 / 现代男女 / 抽象水墨（旧 3 值自动映射）/ 三维立体（3D）
 * - 仅上半身（脖子以上特写）：肩部衣领 + 头部
 * - 生命感动画：呼吸浮动 / 随机眨眼 / 目光游移（眼神随状态变化）
 * - 表情系统：calm 平和 / smile 微笑 / thinking 沉思 / surprised 惊讶（眉、眼、口联动）
 * - 说话口型同步
 * - 通过 uni.createCanvasContext（旧版 Canvas API，小程序/H5/App 均支持）
 */

export type AvatarMood = 'calm' | 'smile' | 'thinking' | 'surprised';

export type AvatarStyle =
  | 'ancient_male'
  | 'ancient_female'
  | 'modern_male'
  | 'modern_female'
  | 'abstract'
  | '2d_cartoon'
  | '2d_real'
  | '3d'
  | 'laozi'
  | 'confucius'
  | 'zhuangzi'
  | 'mozi';

/** 三维立体形象参数（上传照片 → 后端 LLM 视觉解析生成） */
export interface Avatar3DParams {
  gender: 'male' | 'female';
  skin: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'bun' | 'cloud' | 'buzz' | 'ponytail';
  cloth: string;
  collar: string;
  eyeColor: string;
  browColor: string;
  bg: string;
  beard: boolean;
  glasses: boolean;
}

export const DEFAULT_3D_PARAMS: Avatar3DParams = {
  gender: 'male',
  skin: '#f0d2b0',
  hair: '#3b2f28',
  hairStyle: 'short',
  cloth: '#5b6b52',
  collar: '#e8dfc8',
  eyeColor: '#4a3527',
  browColor: '#3b2f28',
  bg: '#efe6d5',
  beard: false,
  glasses: false,
};

// ---------- 颜色工具（3D 光影用） ----------
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
/** 明暗调整：amt 正数提亮、负数压暗 */
function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `rgb(${cl(r)},${cl(g)},${cl(b)})`;
}
function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

interface StyleConfig {
  bg: string;        // 背景墨圈
  cloth: string;     // 肩部衣袍
  collar: string;    // 衣领
  skin: string;      // 肤色
  hair: string;      // 发色
  hairStyle: 'bun' | 'cloud' | 'short' | 'long' | 'abstract';
  beard: boolean;    // 长须
  browColor: string;
  ink: boolean;      // 抽象水墨模式
}

const STYLES: Record<string, StyleConfig> = {
  ancient_male: {
    bg: '#efe6d5', cloth: '#5b6b52', collar: '#e8dfc8', skin: '#f2d8b8',
    hair: '#4a3f33', hairStyle: 'bun', beard: true, browColor: '#4a3f33', ink: false,
  },
  ancient_female: {
    bg: '#efe6d5', cloth: '#a5677a', collar: '#f2e7d5', skin: '#f6ddc6',
    hair: '#3d2f2a', hairStyle: 'cloud', beard: false, browColor: '#5a4436', ink: false,
  },
  modern_male: {
    bg: '#e8ecef', cloth: '#4a5568', collar: '#f5f5f2', skin: '#f2d8b8',
    hair: '#2f2a26', hairStyle: 'short', beard: false, browColor: '#2f2a26', ink: false,
  },
  modern_female: {
    bg: '#f0e6e8', cloth: '#b56576', collar: '#f7ede4', skin: '#f6ddc6',
    hair: '#3a2d28', hairStyle: 'long', beard: false, browColor: '#4a352c', ink: false,
  },
  abstract: {
    bg: '#efe6d5', cloth: '#3a3226', collar: '#c9c0ae', skin: '#fdfaf2',
    hair: '#3a3226', hairStyle: 'abstract', beard: false, browColor: '#3a3226', ink: true,
  },
  // ---- 历史人物预设（老子 / 孔子 / 庄子 / 墨子） ----
  laozi: {
    bg: '#e9e6da', cloth: '#5a6e6b', collar: '#f0ead9', skin: '#ecd2b2',
    hair: '#ece7db', hairStyle: 'bun', beard: true, browColor: '#d8d2c4', ink: false,
    beardColor: '#f2eee4', // 雪白长须（太上老君意象）
  },
  confucius: {
    bg: '#ece5d6', cloth: '#6b4f35', collar: '#e5d9c0', skin: '#f0d6b8',
    hair: '#c9c2b4', hairStyle: 'bun', beard: true, browColor: '#b5ad9e', ink: false,
    beardColor: '#d8d0c0', // 花白长须（儒雅长者）
  },
  zhuangzi: {
    bg: '#e6e8e0', cloth: '#7a6a4f', collar: '#ddd4bd', skin: '#eed4b6',
    hair: '#33291f', hairStyle: 'long', beard: true, browColor: '#33291f', ink: false,
    beardColor: '#5a4d3c', // 逍遥散发 + 深色短须
  },
  mozi: {
    bg: '#e4e4e6', cloth: '#3a3a40', collar: '#cfc9ba', skin: '#e8c8a4',
    hair: '#26221d', hairStyle: 'bun', beard: true, browColor: '#26221d', ink: false,
    beardColor: '#3a332b', // 玄色短打 + 黑须（实干家）
  },
};

/** 旧风格值 → 新风格配置映射（兼容历史数据） */
function styleOf(raw?: string): StyleConfig {
  switch (raw) {
    case 'ancient_female':
    case 'modern_male':
    case 'modern_female':
    case 'abstract':
    case 'ancient_male':
    case 'laozi':
    case 'confucius':
    case 'zhuangzi':
    case 'mozi':
      return STYLES[raw];
    case '2d_real':
    case '3d':
      return STYLES.modern_male;
    default:
      return STYLES.ancient_male;
  }
}

export class CanvasAvatar {
  private ctx: UniApp.CanvasContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private speaking = false;
  private mood: AvatarMood = 'calm';
  private t = 0;
  private blinkAt = 50;
  private readonly style: StyleConfig;
  private readonly is3D: boolean;
  private readonly params3d: Avatar3DParams;

  constructor(
    private readonly canvasId: string,
    private readonly component: unknown,
    avatarStyle?: string,
    params3d?: Avatar3DParams | null,
  ) {
    this.style = styleOf(avatarStyle);
    this.params3d = params3d ?? DEFAULT_3D_PARAMS;
    this.is3D = avatarStyle === '3d' || !!params3d;
  }

  start(): void {
    this.ctx = uni.createCanvasContext(this.canvasId, this.component as never);
    this.timer = setInterval(() => this.frame(), 100);
  }

  setSpeaking(v: boolean): void {
    this.speaking = v;
  }

  /** 表情切换：calm / smile / thinking / surprised */
  setMood(mood: AvatarMood): void {
    this.mood = mood;
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // ---------- 主帧绘制 ----------
  private frame(): void {
    if (this.is3D) {
      this.frame3D();
      return;
    }
    const c = this.ctx;
    if (!c) return;
    this.t++;
    const s = this.style;

    // 眨眼节奏：随机间隔 3-6 秒，闭眼 0.4 秒
    if (this.t >= this.blinkAt) {
      this.blinkAt = this.t + 30 + Math.floor(Math.random() * 30);
    }
    const blinking = this.t >= this.blinkAt - 4;

    // 呼吸浮动
    const breath = Math.sin(this.t / 10) * 2;
    const bob = breath;
    const w = 240;
    const h = 300;
    const cx = w / 2;
    const baseY = 152 + bob;

    // ---- 表情参数（眉/眼/口联动） ----
    let eyeOpen = 1;        // 睁眼程度
    let browLift = 0;       // 眉毛上抬
    let browTilt = 0;       // 眉毛倾斜（正=皱眉）
    let mouthCurve = 0;     // 嘴角弧度（正=上扬）
    let gazeBoost = 0;      // 思思时目光上移
    if (this.mood === 'smile') {
      eyeOpen = 0.8;
      browLift = 2;
      mouthCurve = 5;
    } else if (this.mood === 'thinking') {
      eyeOpen = 0.65;
      browTilt = 4;
      gazeBoost = -5;
      mouthCurve = -2;
    } else if (this.mood === 'surprised') {
      eyeOpen = 1.35;
      browLift = 6;
      mouthCurve = 2;
    }

    // 目光游移：缓慢漂移，让眼神"活"起来（说话时更灵动）
    const drift = this.speaking ? 1.6 : 1;
    const gx = Math.sin(this.t / 15) * 3 * drift;
    const gy = Math.cos(this.t / 23) * 2 * drift + gazeBoost;

    // 口型：说话时开合，非说话时随表情
    const mouthOpen = this.speaking ? 3 + Math.abs(Math.sin(this.t / 2)) * 6 : 1;
    const mouthW = this.mood === 'smile' ? 12 : 9;

    c.clearRect(0, 0, w, h);

    // ---- 背景 ----
    c.setFillStyle(s.bg);
    c.beginPath();
    c.arc(cx, baseY, 106, 0, Math.PI * 2);
    c.fill();
    if (s.ink) {
      // 抽象风：背景水墨晕圈
      c.setStrokeStyle('rgba(58, 50, 38, 0.15)');
      c.setLineWidth(8);
      c.beginPath();
      c.arc(cx, baseY, 92 + breath, 0, Math.PI * 2);
      c.stroke();
    }

    // ---- 肩部衣袍（上半身底部） ----
    c.setFillStyle(s.cloth);
    c.beginPath();
    c.moveTo(cx - 52, baseY + 8);
    c.quadraticCurveTo(cx - 64, baseY + 88, cx - 56, baseY + 106);
    c.lineTo(cx + 56, baseY + 106);
    c.quadraticCurveTo(cx + 64, baseY + 88, cx + 52, baseY + 8);
    c.quadraticCurveTo(cx, baseY + 26, cx - 52, baseY + 8);
    c.fill();

    if (s.ink) {
      // 抽象风衣袍：枯笔飞白
      c.setStrokeStyle('rgba(253, 250, 242, 0.5)');
      c.setLineWidth(2);
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(cx - 40 + i * 16, baseY + 20);
        c.lineTo(cx - 44 + i * 16, baseY + 96);
        c.stroke();
      }
    }

    // ---- 衣领 ----
    c.setFillStyle(s.collar);
    if (s.hairStyle === 'short' || s.hairStyle === 'long') {
      // 现代圆领
      this.fillEllipse(c, cx, baseY + 12, 26, 14);
    } else if (s.hairStyle === 'abstract') {
      // 抽象弧线领
      c.setStrokeStyle(s.collar);
      c.setLineWidth(5);
      c.beginPath();
      c.arc(cx, baseY + 4, 30, 0.15 * Math.PI, 0.85 * Math.PI);
      c.stroke();
    } else {
      // 古代交领
      c.beginPath();
      c.moveTo(cx - 30, baseY + 6);
      c.lineTo(cx, baseY + 34);
      c.lineTo(cx + 30, baseY + 6);
      c.quadraticCurveTo(cx, baseY + 18, cx - 30, baseY + 6);
      c.fill();
      c.setFillStyle(s.cloth);
      c.beginPath();
      c.moveTo(cx - 30, baseY + 6);
      c.lineTo(cx - 22, baseY + 14);
      c.lineTo(cx, baseY + 34);
      c.lineTo(cx - 8, baseY + 14);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(cx + 30, baseY + 6);
      c.lineTo(cx + 22, baseY + 14);
      c.lineTo(cx, baseY + 34);
      c.lineTo(cx + 8, baseY + 14);
      c.closePath();
      c.fill();
    }

    // ---- 颈部 ----
    c.setFillStyle(s.skin);
    c.fillRect(cx - 10, baseY - 24, 20, 30);

    // ---- 头 ----
    if (s.ink) {
      // 抽象风：头为墨圈
      c.setStrokeStyle('#3a3226');
      c.setLineWidth(4);
      c.beginPath();
      c.arc(cx, baseY - 46, 34, 0, Math.PI * 2);
      c.stroke();
      c.setFillStyle(s.skin);
      c.beginPath();
      c.arc(cx, baseY - 46, 31, 0, Math.PI * 2);
      c.fill();
    } else {
      c.setFillStyle(s.skin);
      c.beginPath();
      c.arc(cx, baseY - 46, 34, 0, Math.PI * 2);
      c.fill();
      // 耳
      c.beginPath();
      c.arc(cx - 34, baseY - 46, 7, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(cx + 34, baseY - 46, 7, 0, Math.PI * 2);
      c.fill();
    }

    // ---- 发型 ----
    this.drawHair(c, cx, baseY, s);

    // ---- 眉（表情联动） ----
    c.setStrokeStyle(s.browColor);
    c.setLineWidth(2);
    const browY = baseY - 56 - browLift;
    // 左眉
    c.beginPath();
    c.moveTo(cx - 20, browY + browTilt);
    c.quadraticCurveTo(cx - 10, browY - 6 + browTilt * 0.5, cx - 4, browY + 1);
    c.stroke();
    // 右眉
    c.beginPath();
    c.moveTo(cx + 4, browY + 1);
    c.quadraticCurveTo(cx + 10, browY - 6 + browTilt * 0.5, cx + 20, browY + browTilt);
    c.stroke();

    // ---- 眼（眨眼 + 目光游移 + 表情睁闭） ----
    const eyeY = baseY - 46;
    const eyeR = 4 * eyeOpen;
    c.setFillStyle('#3a3226');
    c.setStrokeStyle('#3a3226');
    c.setLineWidth(1.6);
    for (const ex of [cx - 12, cx + 12]) {
      if (blinking) {
        c.beginPath();
        c.moveTo(ex - 8, eyeY);
        c.lineTo(ex + 8, eyeY);
        c.stroke();
      } else if (s.ink) {
        // 抽象风：墨点眼
        c.beginPath();
        c.arc(ex + gx * 0.6, eyeY + gy * 0.6, 4, 0, Math.PI * 2);
        c.fill();
      } else {
        // 写实眼：眼白 + 瞳孔（随目光偏移）
        c.setFillStyle('#fdfaf2');
        this.fillEllipse(c, ex, eyeY, 8, 6 * eyeOpen);
        c.setFillStyle('#3a3226');
        c.beginPath();
        c.arc(ex + gx, eyeY + gy, Math.min(eyeR, 4.5), 0, Math.PI * 2);
        c.fill();
      }
    }
    // 微笑时眼下弯纹
    if (this.mood === 'smile' && !s.ink) {
      c.setStrokeStyle('rgba(58, 50, 38, 0.25)');
      c.setLineWidth(1);
      for (const ex of [cx - 12, cx + 12]) {
        c.beginPath();
        c.moveTo(ex - 6, eyeY + 6);
        c.quadraticCurveTo(ex, eyeY + 9, ex + 6, eyeY + 6);
        c.stroke();
      }
    }

    // ---- 鼻 ----
    if (!s.ink) {
      c.setStrokeStyle('#d8b08c');
      c.setLineWidth(1.4);
      c.beginPath();
      c.moveTo(cx, baseY - 40);
      c.lineTo(cx - 2, baseY - 34);
      c.stroke();
    }

    // ---- 口（表情弧度 + 说话开合） ----
    const mouthY = baseY - 26;
    if (s.ink) {
      // 抽象风：一笔墨线口
      c.setStrokeStyle('#3a3226');
      c.setLineWidth(2.5);
      c.beginPath();
      c.moveTo(cx - 8, mouthY);
      c.quadraticCurveTo(cx, mouthY + mouthCurve + mouthOpen, cx + 8, mouthY);
      c.stroke();
    } else {
      c.setStrokeStyle('#8c4a3a');
      c.setLineWidth(1.6);
      c.beginPath();
      c.moveTo(cx - mouthW, mouthY);
      c.quadraticCurveTo(cx, mouthY + mouthCurve + mouthOpen * 2, cx + mouthW, mouthY);
      c.stroke();
      if (mouthOpen > 3) {
        // 张口时补口腔
        c.setFillStyle('#a05a48');
        this.fillEllipse(c, cx, mouthY + mouthOpen, mouthW - 2, mouthOpen);
      }
    }

    // ---- 长须（古老男 / 历史人物预设） ----
    if (s.beard) {
      c.setStrokeStyle(s.beardColor ?? '#cfc4ac');
      c.setLineWidth(1.4);
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(cx + i * 7, baseY - 22);
        c.quadraticCurveTo(cx + i * 7 + 2, baseY - 8, cx + i * 7 - 1, baseY + 6);
        c.stroke();
      }
    }

    c.draw();
  }

  // ---------- 椭圆填充（旧版 CanvasContext 无 ellipse，用 scale 实现） ----------
  private fillEllipse(
    c: UniApp.CanvasContext,
    x: number,
    y: number,
    rx: number,
    ry: number,
  ): void {
    if (rx <= 0 || ry <= 0) return;
    c.save();
    c.translate(x, y);
    c.scale(1, ry / rx);
    c.beginPath();
    c.arc(0, 0, rx, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // ---------- 发型绘制 ----------
  private drawHair(c: UniApp.CanvasContext, cx: number, baseY: number, s: StyleConfig): void {
    c.setFillStyle(s.hair);
    switch (s.hairStyle) {
      case 'bun': {
        // 发髻 + 发鬓
        c.beginPath();
        c.arc(cx, baseY - 82, 16, 0, Math.PI * 2);
        c.fill();
        c.fillRect(cx - 16, baseY - 78, 32, 12);
        c.beginPath();
        c.arc(cx - 34, baseY - 50, 10, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(cx + 34, baseY - 50, 10, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case 'cloud': {
        // 云髻 + 发簪（金色簪头）
        c.beginPath();
        c.arc(cx, baseY - 84, 18, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(cx - 12, baseY - 92, 10, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(cx + 12, baseY - 92, 10, 0, Math.PI * 2);
        c.fill();
        c.fillRect(cx - 30, baseY - 76, 60, 14);
        c.beginPath();
        c.arc(cx - 36, baseY - 50, 9, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(cx + 36, baseY - 50, 9, 0, Math.PI * 2);
        c.fill();
        c.setFillStyle('#c9a227');
        c.beginPath();
        c.arc(cx + 18, baseY - 88, 3.5, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case 'short': {
        // 现代短发
        c.beginPath();
        c.arc(cx, baseY - 54, 34, Math.PI * 1.05, Math.PI * 1.95);
        c.lineTo(cx + 30, baseY - 60);
        c.lineTo(cx - 30, baseY - 60);
        c.closePath();
        c.fill();
        c.fillRect(cx - 34, baseY - 62, 68, 12);
        break;
      }
      case 'long': {
        // 长发披肩
        c.beginPath();
        c.arc(cx, baseY - 56, 34, Math.PI * 1.02, Math.PI * 1.98);
        c.closePath();
        c.fill();
        c.fillRect(cx - 38, baseY - 64, 76, 14);
        c.beginPath();
        c.moveTo(cx - 38, baseY - 60);
        c.quadraticCurveTo(cx - 44, baseY - 10, cx - 34, baseY + 16);
        c.lineTo(cx - 20, baseY + 14);
        c.quadraticCurveTo(cx - 28, baseY - 24, cx - 26, baseY - 58);
        c.closePath();
        c.fill();
        c.beginPath();
        c.moveTo(cx + 38, baseY - 60);
        c.quadraticCurveTo(cx + 44, baseY - 10, cx + 34, baseY + 16);
        c.lineTo(cx + 20, baseY + 14);
        c.quadraticCurveTo(cx + 28, baseY - 24, cx + 26, baseY - 58);
        c.closePath();
        c.fill();
        break;
      }
      case 'abstract': {
        // 抽象风：头顶枯笔弧
        c.setStrokeStyle(s.hair);
        c.setLineWidth(6);
        c.beginPath();
        c.arc(cx, baseY - 50, 36, Math.PI * 1.15, Math.PI * 1.85);
        c.stroke();
        c.setLineWidth(3);
        c.beginPath();
        c.moveTo(cx - 20, baseY - 74);
        c.quadraticCurveTo(cx, baseY - 88, cx + 20, baseY - 74);
        c.stroke();
        break;
      }
    }
  }

  // ============================================================
  // 三维立体渲染（3d 风格：照片解析参数 → 球体光影 + 立体五官）
  // ============================================================

  /** 径向渐变（旧版 CanvasContext 兼容：无 createCircularGradient 时取中间色） */
  private radial(
    c: UniApp.CanvasContext,
    x: number,
    y: number,
    r: number,
    stops: [number, string][],
  ): void {
    const ctx = c as unknown as {
      createCircularGradient?: (
        x: number,
        y: number,
        r: number,
      ) => { addColorStop: (offset: number, color: string) => void };
    };
    const g = ctx.createCircularGradient?.(x, y, r);
    if (g) {
      for (const [offset, color] of stops) g.addColorStop(offset, color);
      c.setFillStyle(g as unknown as string);
    } else {
      c.setFillStyle(stops[Math.floor(stops.length / 2)]?.[1] ?? stops[0][1]);
    }
  }

  private frame3D(): void {
    const c = this.ctx;
    if (!c) return;
    this.t++;
    const p = this.params3d;

    // 眨眼节奏：随机间隔 3-6 秒，闭眼 0.4 秒
    if (this.t >= this.blinkAt) {
      this.blinkAt = this.t + 30 + Math.floor(Math.random() * 30);
    }
    const blinking = this.t >= this.blinkAt - 4;

    // 呼吸浮动
    const breath = Math.sin(this.t / 10) * 2;
    const w = 240;
    const h = 300;
    const cx = w / 2;
    const baseY = 152 + breath;
    const hy = baseY - 46; // 头心
    const hr = 34; // 头半径

    // ---- 表情参数（与 2D 联动规则一致） ----
    let eyeOpen = 1;
    let browLift = 0;
    let browTilt = 0;
    let mouthCurve = 0;
    let gazeBoost = 0;
    if (this.mood === 'smile') {
      eyeOpen = 0.8;
      browLift = 2;
      mouthCurve = 5;
    } else if (this.mood === 'thinking') {
      eyeOpen = 0.65;
      browTilt = 4;
      gazeBoost = -5;
      mouthCurve = -2;
    } else if (this.mood === 'surprised') {
      eyeOpen = 1.35;
      browLift = 6;
      mouthCurve = 2;
    }

    // 目光游移 + 口型
    const drift = this.speaking ? 1.6 : 1;
    const gx = Math.sin(this.t / 15) * 3 * drift;
    const gy = Math.cos(this.t / 23) * 2 * drift + gazeBoost;
    const mouthOpen = this.speaking ? 3 + Math.abs(Math.sin(this.t / 2)) * 6 : 1;
    const mouthW = this.mood === 'smile' ? 12 : 9;

    c.clearRect(0, 0, w, h);

    // ---- 背景（径向光晕） ----
    this.radial(c, cx - 20, hy - 30, 118, [
      [0, shade(p.bg, 18)],
      [1, shade(p.bg, -26)],
    ]);
    c.beginPath();
    c.arc(cx, hy, 108, 0, Math.PI * 2);
    c.fill();

    // ---- 肩部衣袍（上亮下暗 + 左肩受光） ----
    c.beginPath();
    c.moveTo(cx - 52, baseY + 8);
    c.quadraticCurveTo(cx - 64, baseY + 88, cx - 56, baseY + 106);
    c.lineTo(cx + 56, baseY + 106);
    c.quadraticCurveTo(cx + 64, baseY + 88, cx + 52, baseY + 8);
    c.quadraticCurveTo(cx, baseY + 26, cx - 52, baseY + 8);
    c.closePath();
    c.setFillStyle(shade(p.cloth, 8));
    c.fill();
    // 底部阴影
    c.beginPath();
    c.moveTo(cx - 58, baseY + 60);
    c.quadraticCurveTo(cx - 62, baseY + 90, cx - 56, baseY + 106);
    c.lineTo(cx + 56, baseY + 106);
    c.quadraticCurveTo(cx + 62, baseY + 90, cx + 58, baseY + 60);
    c.quadraticCurveTo(cx, baseY + 74, cx - 58, baseY + 60);
    c.closePath();
    c.setFillStyle('rgba(28, 24, 18, 0.18)');
    c.fill();
    // 左肩高光
    c.beginPath();
    c.moveTo(cx - 52, baseY + 8);
    c.quadraticCurveTo(cx - 60, baseY + 60, cx - 54, baseY + 78);
    c.quadraticCurveTo(cx - 42, baseY + 60, cx - 44, baseY + 14);
    c.closePath();
    c.setFillStyle('rgba(255, 255, 255, 0.10)');
    c.fill();

    // ---- 衣领（立体环领） ----
    c.setFillStyle(shade(p.collar, -6));
    this.fillEllipse(c, cx, baseY + 14, 27, 15);
    c.setFillStyle(shade(p.collar, 10));
    this.fillEllipse(c, cx, baseY + 11, 22, 11);

    // ---- 颈部（含下颌投影） ----
    c.setFillStyle(shade(p.skin, -14));
    c.fillRect(cx - 10, baseY - 24, 20, 30);
    c.setFillStyle('rgba(28, 24, 18, 0.22)');
    c.fillRect(cx - 10, baseY - 24, 20, 9);

    // ---- 头部球体（左上受光） ----
    this.radial(c, cx - 11, hy - 13, hr + 12, [
      [0, shade(p.skin, 20)],
      [0.55, p.skin],
      [1, shade(p.skin, -24)],
    ]);
    c.beginPath();
    c.arc(cx, hy, hr, 0, Math.PI * 2);
    c.fill();

    // ---- 耳（含耳窝阴影） ----
    for (const exx of [cx - hr, cx + hr]) {
      c.setFillStyle(shade(p.skin, -8));
      c.beginPath();
      c.arc(exx, hy + 2, 7, 0, Math.PI * 2);
      c.fill();
      c.setFillStyle('rgba(28, 24, 18, 0.18)');
      this.fillEllipse(c, exx + (exx < cx ? 2 : -2), hy + 2, 3, 5);
    }

    // ---- 发型（立体分层） ----
    this.drawHair3D(c, cx, hy, hr, p);

    // ---- 眉（粗而柔和，表情联动） ----
    (c as unknown as { setLineCap?: (v: string) => void }).setLineCap?.('round');
    c.setStrokeStyle(p.browColor);
    c.setLineWidth(3.2);
    const browY = baseY - 56 - browLift;
    c.beginPath();
    c.moveTo(cx - 20, browY + browTilt + 1);
    c.quadraticCurveTo(cx - 10, browY - 6 + browTilt * 0.5, cx - 4, browY + 1);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + 4, browY + 1);
    c.quadraticCurveTo(cx + 10, browY - 6 + browTilt * 0.5, cx + 20, browY + browTilt + 1);
    c.stroke();

    // ---- 眼（眼窝阴影 + 眼白 + 虹膜 + 高光 + 眼睑） ----
    const eyeY = hy;
    for (const ex of [cx - 12, cx + 12]) {
      c.setFillStyle('rgba(42, 33, 24, 0.12)');
      this.fillEllipse(c, ex, eyeY - 3, 10, 6);
      if (blinking) {
        c.setStrokeStyle(p.browColor);
        c.setLineWidth(2);
        c.beginPath();
        c.moveTo(ex - 8, eyeY);
        c.lineTo(ex + 8, eyeY);
        c.stroke();
      } else {
        // 眼白
        c.setFillStyle('#fbf8f2');
        this.fillEllipse(c, ex, eyeY, 8.2, 6.2 * eyeOpen);
        // 下眼睑阴影
        c.setFillStyle('rgba(140, 111, 82, 0.25)');
        this.fillEllipse(c, ex, eyeY + 4.4 * eyeOpen, 7.6, 1.4);
        // 虹膜 + 瞳孔 + 高光（随目光偏移）
        const ir = Math.min(4.6 * eyeOpen + 0.6, 5.2);
        c.setFillStyle(p.eyeColor);
        c.beginPath();
        c.arc(ex + gx, eyeY + gy, ir, 0, Math.PI * 2);
        c.fill();
        c.setFillStyle('#14100c');
        c.beginPath();
        c.arc(ex + gx, eyeY + gy, ir * 0.45, 0, Math.PI * 2);
        c.fill();
        c.setFillStyle('#ffffff');
        c.beginPath();
        c.arc(ex + gx - 1.6, eyeY + gy - 1.8, 1.3, 0, Math.PI * 2);
        c.fill();
        // 上眼睑线
        c.setStrokeStyle(p.browColor);
        c.setLineWidth(1.6);
        c.beginPath();
        c.moveTo(ex - 8, eyeY - 2);
        c.quadraticCurveTo(ex, eyeY - 6.5 * eyeOpen - 1, ex + 8, eyeY - 2);
        c.stroke();
      }
    }

    // ---- 鼻（侧影 + 鼻梁高光 + 鼻孔） ----
    c.setStrokeStyle('rgba(122, 85, 64, 0.55)');
    c.setLineWidth(1.8);
    c.beginPath();
    c.moveTo(cx - 1, baseY - 44);
    c.quadraticCurveTo(cx - 4, baseY - 38, cx - 3, baseY - 34);
    c.stroke();
    c.setStrokeStyle('rgba(255, 255, 255, 0.35)');
    c.setLineWidth(1.2);
    c.beginPath();
    c.moveTo(cx + 2, baseY - 43);
    c.lineTo(cx + 2, baseY - 36);
    c.stroke();
    c.setFillStyle('rgba(90, 58, 40, 0.45)');
    this.fillEllipse(c, cx - 4, baseY - 32.5, 1.6, 1.1);
    this.fillEllipse(c, cx + 4, baseY - 32.5, 1.6, 1.1);

    // ---- 口（唇形 + 口腔 + 说话开合） ----
    const mouthY = baseY - 26;
    const lip = p.gender === 'female' ? '#b46a6a' : '#a05a48';
    if (mouthOpen > 3) {
      // 张口：口腔
      c.setFillStyle('#6e3a30');
      this.fillEllipse(c, cx, mouthY + mouthOpen * 0.6, mouthW, mouthOpen);
      // 上唇
      c.setStrokeStyle(lip);
      c.setLineWidth(2.2);
      c.beginPath();
      c.moveTo(cx - mouthW, mouthY - 1);
      c.quadraticCurveTo(cx - mouthW * 0.4, mouthY - 3.5, cx, mouthY - 1.5);
      c.quadraticCurveTo(cx + mouthW * 0.4, mouthY - 3.5, cx + mouthW, mouthY - 1);
      c.stroke();
      // 下唇
      c.beginPath();
      c.moveTo(cx - mouthW, mouthY + 1);
      c.quadraticCurveTo(cx, mouthY + mouthOpen * 1.6 + 2, cx + mouthW, mouthY + 1);
      c.stroke();
    } else {
      // 闭口唇线 + 下唇反光
      c.setStrokeStyle(lip);
      c.setLineWidth(2);
      c.beginPath();
      c.moveTo(cx - mouthW, mouthY);
      c.quadraticCurveTo(cx, mouthY + mouthCurve + 2, cx + mouthW, mouthY);
      c.stroke();
      c.setStrokeStyle('rgba(255, 255, 255, 0.28)');
      c.setLineWidth(1.2);
      c.beginPath();
      c.moveTo(cx - mouthW * 0.6, mouthY + 3.5 + mouthCurve * 0.3);
      c.quadraticCurveTo(cx, mouthY + 6 + mouthCurve * 0.4, cx + mouthW * 0.6, mouthY + 3.5 + mouthCurve * 0.3);
      c.stroke();
    }

    // ---- 微笑苹果肌 ----
    if (this.mood === 'smile') {
      c.setStrokeStyle('rgba(122, 85, 64, 0.3)');
      c.setLineWidth(1);
      for (const ex of [cx - 16, cx + 16]) {
        c.beginPath();
        c.moveTo(ex, baseY - 34);
        c.quadraticCurveTo(ex + (ex < cx ? -3 : 3), baseY - 29, ex, baseY - 25);
        c.stroke();
      }
    }

    // ---- 胡须（下颌 + 唇上须） ----
    if (p.beard) {
      c.setFillStyle(shade(p.hair, 14));
      c.beginPath();
      c.moveTo(cx - 16, baseY - 22);
      c.quadraticCurveTo(cx - 20, baseY - 4, cx - 8, baseY + 2);
      c.quadraticCurveTo(cx, baseY + 6, cx + 8, baseY + 2);
      c.quadraticCurveTo(cx + 20, baseY - 4, cx + 16, baseY - 22);
      c.quadraticCurveTo(cx, baseY - 14, cx - 16, baseY - 22);
      c.closePath();
      c.fill();
      c.setStrokeStyle(shade(p.hair, 6));
      c.setLineWidth(2.4);
      c.beginPath();
      c.moveTo(cx - 9, baseY - 30);
      c.quadraticCurveTo(cx, baseY - 27.5, cx + 9, baseY - 30);
      c.stroke();
    }

    // ---- 眼镜 ----
    if (p.glasses) {
      c.setStrokeStyle('rgba(45, 38, 30, 0.9)');
      c.setLineWidth(2);
      for (const ex of [cx - 12, cx + 12]) {
        c.beginPath();
        c.arc(ex, eyeY, 11, 0, Math.PI * 2);
        c.stroke();
        c.setFillStyle('rgba(255, 255, 255, 0.10)');
        c.beginPath();
        c.arc(ex, eyeY, 11, 0, Math.PI * 2);
        c.fill();
      }
      c.beginPath();
      c.moveTo(cx - 2, eyeY - 3);
      c.lineTo(cx + 2, eyeY - 3);
      c.stroke();
      c.beginPath();
      c.moveTo(cx - 23, eyeY - 2);
      c.lineTo(cx - 34, eyeY - 5);
      c.moveTo(cx + 23, eyeY - 2);
      c.lineTo(cx + 34, eyeY - 5);
      c.stroke();
    }

    // ---- 耳饰（女性金珠） ----
    if (p.gender === 'female') {
      c.setFillStyle('#c9a227');
      c.beginPath();
      c.arc(cx - hr + 1, hy + 12, 2.2, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(cx + hr - 1, hy + 12, 2.2, 0, Math.PI * 2);
      c.fill();
    }

    c.draw();
  }

  // ---------- 三维发型（渐变发盖 + 分层细节） ----------
  private drawHair3D(
    c: UniApp.CanvasContext,
    cx: number,
    hy: number,
    hr: number,
    p: Avatar3DParams,
  ): void {
    const cap = (r: number, dy: number): void => {
      this.radial(c, cx - 10, hy - 22 + dy, r + 6, [
        [0, shade(p.hair, 16)],
        [1, shade(p.hair, -18)],
      ]);
      c.beginPath();
      c.arc(cx, hy - 3 + dy, r, Math.PI * 1.02, Math.PI * 1.98);
      c.closePath();
      c.fill();
    };
    const hairline = (halfW: number): void => {
      c.fillRect(cx - halfW, hy - 16, halfW * 2, 12);
    };

    switch (p.hairStyle) {
      case 'buzz': {
        // 圆寸：薄发盖
        cap(hr - 1, -1);
        break;
      }
      case 'short': {
        // 短发 + 鬓角
        cap(hr + 1, 0);
        hairline(hr + 1);
        c.fillRect(cx - hr - 1, hy - 14, 7, 18);
        c.fillRect(cx + hr - 6, hy - 14, 7, 18);
        break;
      }
      case 'long': {
        // 长发披肩（两侧发束 + 高光发丝）
        cap(hr + 2, 0);
        hairline(hr + 2);
        for (const s of [-1, 1]) {
          c.beginPath();
          c.moveTo(cx + s * (hr + 2), hy - 14);
          c.quadraticCurveTo(cx + s * (hr + 9), hy + 30, cx + s * (hr - 2), hy + 78);
          c.lineTo(cx + s * (hr - 14), hy + 74);
          c.quadraticCurveTo(cx + s * (hr - 9), hy + 20, cx + s * (hr - 12), hy - 12);
          c.closePath();
          c.fill();
        }
        c.setStrokeStyle('rgba(255, 255, 255, 0.18)');
        c.setLineWidth(1.5);
        c.beginPath();
        c.moveTo(cx - 20, hy - 30);
        c.quadraticCurveTo(cx - 8, hy - 40, cx + 6, hy - 36);
        c.stroke();
        break;
      }
      case 'bun': {
        // 发髻球
        cap(hr + 1, 0);
        hairline(hr + 1);
        this.radial(c, cx - 4, hy - hr - 20, 18, [
          [0, shade(p.hair, 22)],
          [1, shade(p.hair, -16)],
        ]);
        c.beginPath();
        c.arc(cx, hy - hr - 12, 15, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case 'cloud': {
        // 云髻三球 + 两侧发包 + 金簪
        cap(hr + 1, 0);
        hairline(hr + 1);
        c.beginPath();
        c.arc(cx, hy - hr - 12, 14, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(cx - 11, hy - hr - 19, 9, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(cx + 11, hy - hr - 19, 9, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(cx - hr - 3, hy - 4, 9, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(cx + hr + 3, hy - 4, 9, 0, Math.PI * 2);
        c.fill();
        c.setFillStyle('#c9a227');
        c.beginPath();
        c.arc(cx + 16, hy - hr - 16, 3.5, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case 'ponytail': {
        // 侧马尾 + 皮筋
        cap(hr + 1, 0);
        hairline(hr + 1);
        c.beginPath();
        c.moveTo(cx + hr - 2, hy - 10);
        c.quadraticCurveTo(cx + hr + 16, hy + 16, cx + hr + 8, hy + 44);
        c.quadraticCurveTo(cx + hr - 2, hy + 40, cx + hr - 8, hy + 12);
        c.closePath();
        c.fill();
        c.setStrokeStyle('rgba(140, 74, 58, 0.8)');
        c.setLineWidth(2);
        c.beginPath();
        c.arc(cx + hr + 2, hy - 8, 5, 0, Math.PI * 2);
        c.stroke();
        break;
      }
    }
  }
}
