import { Injectable, NotFoundException } from '@nestjs/common';
import { KnowledgeRetriever } from '../chat/knowledge-retriever.service';
import {
  DAOXI_QUESTIONS,
  DAOXI_PERSONAS,
  DAOXI_DIMENSION_LABELS,
  INVITE_TEXTS,
} from './growth.data';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class GrowthService {
  constructor(private readonly retriever: KnowledgeRetriever) {}

  /** 道系人格测试问卷 */
  getQuiz() {
    return {
      title: '道系人格测试',
      desc: '8 道题，测出你的主道（8 维度）与显隐气质（16 型）。分享结果可解锁完整解读。',
      questions: DAOXI_QUESTIONS,
    };
  }

  /** 提交答案 → 16 型人格 + 分享卡数据 */
  submitQuiz(answers: Record<string, number>) {
    const scores: Record<string, number> = {};
    for (const q of DAOXI_QUESTIONS) {
      scores[q.dimension] = (scores[q.dimension] ?? 0) + (answers[q.id] ?? 0);
    }
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    const mode: 'yang' | 'yin' = total >= 10 ? 'yang' : 'yin';
    // 最高分维度 → 主型（并列时按题库维度顺序取先者）
    const order = ['dao', 'de', 'wuwei', 'rou', 'jing', 'pu', 'zhizu', 'ziran'];
    let top = order[0];
    let topScore = -1;
    for (const d of order) {
      if ((scores[d] ?? 0) > topScore) {
        top = d;
        topScore = scores[d] ?? 0;
      }
    }
    const persona =
      DAOXI_PERSONAS.find((p) => p.dimension === top && p.mode === mode) ?? DAOXI_PERSONAS[0];
    return {
      persona,
      scores,
      topDimension: { key: top, label: DAOXI_DIMENSION_LABELS[top], score: topScore },
      mode: mode === 'yang' ? '显（言行合一，外显践行）' : '隐（内敛蓄势，深藏若虚）',
      shareCard: {
        title: persona.title,
        judge: persona.judge,
        shareText: persona.shareText,
        color: persona.shareColor,
        tagLine: persona.tagLine,
      },
    };
  }

  /** 每日箴言卡：按"一年中的第几天"取章节（81 章轮转） */
  dailyProverb() {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    const dayOfYear = Math.floor((today.getTime() - start.getTime()) / DAY_MS) + 1;
    const chapterNo = ((dayOfYear - 1) % 81) + 1;
    const chapter = this.retriever.getChapter(chapterNo);
    if (!chapter) throw new NotFoundException('知识库未加载，无法生成箴言卡');
    const quote = (chapter.simplified ?? chapter.original).split(/[。！？!?]/)[0] + '。';
    const modern = (chapter.conceptNotes ?? '').replace(/\s+/g, ' ').slice(0, 70);
    const actions = [
      '把这句话抄在便签上，今天遇到不顺时念一遍。',
      '找一个真实场景（工作/家庭/人际），试着按这句话换一种做法。',
      '把这句箴言分享给一个正需要它的人。',
    ];
    const action = actions[(chapterNo - 1) % actions.length];
    return {
      date: today.toISOString().slice(0, 10),
      chapterNo,
      chapterTitle: chapter.title,
      source: chapter.source,
      quote,
      modern: (modern || chapter.summary) ?? '',
      action,
      design: {
        theme: '国风水墨',
        primary: '#3B4E63',
        accent: '#B8A477',
        layout: 'quote-center',
      },
    };
  }

  /** 邀请文案 */
  invite(personaTitle?: string) {
    const idx = Math.floor(Math.random() * INVITE_TEXTS.length);
    return {
      text: INVITE_TEXTS[idx].replace('{persona}', personaTitle ?? '上善若水型'),
    };
  }
}