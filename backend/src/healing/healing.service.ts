import { Injectable } from '@nestjs/common';
import {
  EMOTION_LEXICON,
  HIGH_RISK_KEYWORDS,
  REFERRAL_TEXT,
  SOS_STEPS,
  HEALING_PATTERNS,
  WEEKLY_REVIEW_TEMPLATE,
} from './healing.data';

export interface EmotionAssessResult {
  emotion: string;
  emotionLabel: string;
  intensity: 'calm' | 'mild' | 'strong';
  riskLevel: 'none' | 'high';
  patternKey: string | null;
  patternLabel: string | null;
  suggestion: string;
  referral?: string;
}

@Injectable()
export class HealingService {
  /** 情绪识别：分类 + 强度 + 风险 + 建议模式 */
  assess(text: string): EmotionAssessResult {
    const risk = HIGH_RISK_KEYWORDS.some((k) => text.includes(k));
    let best: { label: string; weight: number; pattern: string; key: string } | null = null;
    let bestHits = 0;
    for (const e of EMOTION_LEXICON) {
      const hits = e.keywords.filter((k) => text.includes(k)).length;
      if (hits > bestHits || (hits === bestHits && best && e.weight > best.weight)) {
        bestHits = hits;
        best = { label: e.label, weight: e.weight, pattern: e.pattern, key: e.key };
      }
    }
    const emotion = best ?? { label: '未识别', weight: 0, pattern: 'none', key: 'unknown' };
    const intensity =
      emotion.weight >= 2 ? 'strong' : emotion.weight === 1 ? 'mild' : 'calm';
    const pattern = HEALING_PATTERNS.find((p) => p.key === emotion.pattern);

    return {
      emotion: emotion.key,
      emotionLabel: emotion.label,
      intensity,
      riskLevel: risk ? 'high' : 'none',
      patternKey: emotion.pattern !== 'none' ? emotion.pattern : null,
      patternLabel: pattern?.label ?? null,
      suggestion:
        risk
          ? '检测到高危信号，请优先引导转介专业心理支持。'
          : pattern
            ? `建议练习「${pattern.label}」：${pattern.practice[0]?.step} — ${pattern.practice[0]?.guidance}`
            : '当前情绪平稳，可继续常规陪伴；建议保持每日一次静心练习。',
      ...(risk ? { referral: REFERRAL_TEXT } : {}),
    };
  }

  /** 焦虑急救：高危 → 转介；否则分步引导 */
  sos(text: string) {
    const assessed = this.assess(text);
    return {
      ...assessed,
      steps: assessed.riskLevel === 'high' ? undefined : SOS_STEPS,
      quote: assessed.riskLevel === 'high' ? undefined : '民不畏威，则大威至。先安顿好自己，再面对世界。——《道德经》第七十二章（意引）',
    };
  }

  /** 四类道家情绪调节练习全集 */
  getPatterns() {
    return HEALING_PATTERNS;
  }

  /** 每周复盘（上善若水周报），records 可选传入本周记录 */
  weeklyReview(records?: string[]) {
    return {
      template: WEEKLY_REVIEW_TEMPLATE,
      records: records ?? [],
      quote: '上善若水。水善利万物而不争。——《道德经》第八章',
      tip: '建议每周日晚 20 分钟完成，节假日顺延；周报仅自己可见，可用于与数字人对话复盘。',
    };
  }
}