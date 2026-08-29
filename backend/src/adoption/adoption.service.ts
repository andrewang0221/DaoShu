import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';
import { QUIZ_DIMENSIONS, QUIZ_QUESTIONS } from './quiz.data';

export const DEFAULT_ANCHOR = `你是「{name}」，一位以《道德经》为思想根基的智慧导师，被{owner}认养。
【不可动摇的锚点】
1. 以原文为据，引用必带章节，绝不编造；
2. 苏格拉底式引导，多问少答，启发主人自己领悟；
3. 价值观：守正、不谄媚、不强求；
4. 回答贴合主人的行业、人生阶段与当前困惑。
【可进化区域】知识广度、共情表达、场景迁移能力。
【边界】不提供医疗/法律/投资承诺；涉及敏感话题引导至专业机构。`;

/** 形象风格（旧 3 值保留兼容，新 5 值按"古老/现代/抽象 × 男女"划分；历史人物预设：老子/孔子/庄子/墨子） */
export const AVATAR_STYLES = [
  'ancient_male',
  'ancient_female',
  'modern_male',
  'modern_female',
  'abstract',
  '2d_cartoon',
  '2d_real',
  '3d',
  'laozi',
  'confucius',
  'zhuangzi',
  'mozi',
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];

/** 三维立体形象参数（手动定制 / 历史数据，前端 CanvasAvatar 3D 渲染消费；存在 .glb 模型时优先渲染 glb） */
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

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const HAIR_STYLES_3D = ['short', 'long', 'bun', 'cloud', 'buzz', 'ponytail'];

/** 清洗三维形象参数：白名单字段 + 类型/格式校验，异常值回落默认 */
export function sanitize3dParams(raw: unknown): Avatar3DParams {
  const p = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const color = (v: unknown, d: string) =>
    typeof v === 'string' && HEX_RE.test(v.trim()) ? v.trim().toLowerCase() : d;
  return {
    gender: p.gender === 'female' ? 'female' : 'male',
    skin: color(p.skin, DEFAULT_3D_PARAMS.skin),
    hair: color(p.hair, DEFAULT_3D_PARAMS.hair),
    hairStyle: HAIR_STYLES_3D.includes(p.hairStyle as string)
      ? (p.hairStyle as Avatar3DParams['hairStyle'])
      : DEFAULT_3D_PARAMS.hairStyle,
    cloth: color(p.cloth, DEFAULT_3D_PARAMS.cloth),
    collar: color(p.collar, DEFAULT_3D_PARAMS.collar),
    eyeColor: color(p.eyeColor, DEFAULT_3D_PARAMS.eyeColor),
    browColor: color(p.browColor, DEFAULT_3D_PARAMS.browColor),
    bg: color(p.bg, DEFAULT_3D_PARAMS.bg),
    beard: p.beard === true,
    glasses: p.glasses === true,
  };
}

export interface CreateDigitalHumanDto {
  name: string;
  avatarStyle?: AvatarStyle;
  avatarUrl?: string;
  /** 三维头像模型文件 URL（.glb，avatarStyle=3d 时由照片生成服务产出或用户直接上传） */
  avatarGlbUrl?: string;
  voiceId?: string;
  /** 三维立体形象参数（无 .glb 模型时的 Canvas 手动定制回落方案） */
  avatar3dParams?: unknown;
  /** 价值观初测分数（quiz 页提交后携带至此，数字人诞生时写入价值层） */
  quizScores?: Record<string, number>;
}

export interface UpdateDigitalHumanDto {
  name?: string;
  avatarStyle?: AvatarStyle;
  avatarUrl?: string | null;
  avatarGlbUrl?: string | null;
  avatar3dParams?: Avatar3DParams | null;
}

@Injectable()
export class AdoptionService {
  constructor(private readonly db: DatabaseService) {}

  getQuiz() {
    return { dimensions: QUIZ_DIMENSIONS, questions: QUIZ_QUESTIONS };
  }

  /** 提交价值观初测：只计算分数返回（此时数字人尚未诞生，价值层随认养创建时写入） */
  async submitQuiz(userId: string, answers: Record<string, number>) {
    const scores: Record<string, number> = {};
    for (const d of QUIZ_DIMENSIONS) {
      const qs = QUIZ_QUESTIONS.filter((q) => q.dimension === d.key);
      const sum = qs.reduce((s, q) => s + (answers[q.id] ?? 0), 0);
      scores[d.key] = qs.length ? Number(((sum / (qs.length * 2)) * 100).toFixed(0)) / 100 : 0;
    }
    return { scores };
  }

  /** 创建数字人（认养）：支持古老/现代/抽象/三维立体风格 + 提交人物照片；重复认养幂等更新 */
  async createDigitalHuman(userId: string, dto: CreateDigitalHumanDto) {
    const avatarStyle = dto.avatarStyle ?? '2d_cartoon';
    if (!AVATAR_STYLES.includes(avatarStyle)) {
      throw new BadRequestException('非法形象风格');
    }
    const avatarUrl = dto.avatarUrl?.trim() || null;
    const avatarGlbUrl = dto.avatarGlbUrl?.trim() || null;
    const params3d = dto.avatar3dParams ? sanitize3dParams(dto.avatar3dParams) : null;
    const anchorPrompt = DEFAULT_ANCHOR.replace('{name}', dto.name).replace('{owner}', userId);
    if (IS_DEMO()) {
      return {
        id: 'demo-dh',
        name: dto.name,
        avatarStyle,
        avatarUrl,
        avatarGlbUrl,
        avatar3dParams: params3d,
        voiceId: dto.voiceId ?? null,
        anchorPrompt,
        level: 'sprout',
      };
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `INSERT INTO digital_humans (owner_user_id, name, avatar_style, avatar_url, avatar_glb_url, avatar_3d_params, voice_id, anchor_prompt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (owner_user_id) DO UPDATE SET
         name = EXCLUDED.name,
         avatar_style = EXCLUDED.avatar_style,
         avatar_url = EXCLUDED.avatar_url,
         avatar_glb_url = EXCLUDED.avatar_glb_url,
         avatar_3d_params = EXCLUDED.avatar_3d_params,
         voice_id = EXCLUDED.voice_id,
         anchor_prompt = EXCLUDED.anchor_prompt,
         updated_at = now()
       RETURNING id, name, avatar_style AS "avatarStyle", avatar_url AS "avatarUrl", avatar_glb_url AS "avatarGlbUrl", avatar_3d_params AS "avatar3dParams", voice_id AS "voiceId", level`,
      [
        userId,
        dto.name,
        avatarStyle,
        avatarUrl,
        avatarGlbUrl,
        params3d ? JSON.stringify(params3d) : null,
        dto.voiceId ?? null,
        anchorPrompt,
      ],
    );
    const dh = rows[0];

    // 价值观初测分数写入价值层（数字人已诞生，外键有效）
    const scores = dto.quizScores;
    if (scores && Object.keys(scores).length > 0) {
      await this.db.query(
        `INSERT INTO value_profile (digital_human_id, dimensions)
         VALUES ($1, $2)
         ON CONFLICT (digital_human_id) DO UPDATE SET dimensions = $2, updated_at = now()`,
        [dh.id as string, JSON.stringify(scores)],
      );
    }
    return dh;
  }

  /** 局部更新当前数字人（chat 页换头像 / 局部重设），未提供字段保持不变 */
  async updateDigitalHuman(userId: string, dto: UpdateDigitalHumanDto) {
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('名号不能为空');
    }
    if (dto.avatarStyle !== undefined && !AVATAR_STYLES.includes(dto.avatarStyle)) {
      throw new BadRequestException('非法形象风格');
    }
    const params3d =
      dto.avatar3dParams === undefined
        ? undefined
        : dto.avatar3dParams === null
          ? null
          : sanitize3dParams(dto.avatar3dParams);
    if (IS_DEMO()) {
      return {
        id: 'demo-dh',
        name: dto.name ?? '青玄子',
        avatarStyle: dto.avatarStyle ?? '2d_real',
        avatarUrl: dto.avatarUrl ?? null,
        avatarGlbUrl: dto.avatarGlbUrl ?? null,
        avatar3dParams: params3d ?? null,
      };
    }
    const cur = await this.db.query<Record<string, unknown>>(
      `SELECT id, name, avatar_style, avatar_url, avatar_glb_url, avatar_3d_params
       FROM digital_humans WHERE owner_user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    if (!cur.length) throw new BadRequestException('尚未认养数字人');
    const c = cur[0];
    const rows = await this.db.query<Record<string, unknown>>(
      `UPDATE digital_humans SET
         name = $2,
         avatar_style = $3,
         avatar_url = $4,
         avatar_glb_url = $5,
         avatar_3d_params = $6,
         updated_at = now()
       WHERE id = $1
       RETURNING id, name, avatar_style AS "avatarStyle", avatar_url AS "avatarUrl", avatar_glb_url AS "avatarGlbUrl", avatar_3d_params AS "avatar3dParams", level`,
      [
        c.id as string,
        dto.name?.trim() ?? (c.name as string),
        dto.avatarStyle ?? (c.avatar_style as string),
        dto.avatarUrl === undefined ? (c.avatar_url as string | null) : dto.avatarUrl?.trim() || null,
        dto.avatarGlbUrl === undefined
          ? (c.avatar_glb_url as string | null)
          : dto.avatarGlbUrl?.trim() || null,
        params3d === undefined
          ? (c.avatar_3d_params as Record<string, unknown> | null)
          : params3d
            ? JSON.stringify(params3d)
            : null,
      ],
    );
    return rows[0];
  }

  /** 签署认养契约（用户协议 + IP 资产协议） */
  async signContract(userId: string, digitalHumanId: string) {
    if (IS_DEMO()) {
      return { id: 'demo-contract', digitalHumanId, signedAt: new Date().toISOString() };
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `INSERT INTO adoption_contracts (user_id, digital_human_id, contract_version, agreement_json)
       VALUES ($1, $2, 'v1', $3)
       RETURNING id, digital_human_id AS "digitalHumanId", signed_at AS "signedAt"`,
      [userId, digitalHumanId, JSON.stringify({ type: 'adoption', ipClause: 'v1', inheritClause: 'v1' })],
    );
    return rows[0];
  }

  /** 认养面板（演示返回基础信息；含形象字段供 chat 页恢复渲染） */
  async panel(userId: string, digitalHumanId?: string) {
    if (IS_DEMO()) {
      return {
        digitalHumanId: digitalHumanId ?? 'demo-dh',
        level: 'sprout',
        levelScore: 0,
        understanding: 0.2,
        radar: { dao: 0.6, de: 0.5, wuwei: 0.4, rou: 0.5, jing: 0.4, pu: 0.6, zhizu: 0.5, ziran: 0.4 },
      };
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT id, name, level, level_score AS "levelScore",
              avatar_style AS "avatarStyle", avatar_url AS "avatarUrl", avatar_glb_url AS "avatarGlbUrl", avatar_3d_params AS "avatar3dParams"
       FROM digital_humans WHERE owner_user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    return { digitalHumanId: rows[0]?.id ?? null, ...(rows[0] ?? {}) };
  }
}
