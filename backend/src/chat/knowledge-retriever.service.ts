import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface AnnotationItem {
  type: 'note' | 'wang' | 'organizer' | 'quote';
  text: string;
}
export interface Annotation {
  no: number;
  sentence: string;
  items: AnnotationItem[];
}
export interface Chapter {
  no: number;
  rawNo: string;
  title: string;
  source: string;
  chapterNote: string;
  original: string;
  simplified: string | null;
  phonetics: string | null;
  conceptNotes: string;
  summary: string | null;
  annotations: Annotation[];
  appendix: string | null;
  images: string[];
}
export interface RetrievedChapter {
  chapter: Chapter;
  score: number;
  matchedAnnotations: Annotation[];
}

/** 从 query 提取字符二元组作为检索词（轻量中文分词） */
function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  const chars = s.replace(/[^\u4e00-\u9fff]/g, '');
  for (let i = 0; i < chars.length - 1; i++) out.add(chars.slice(i, i + 2));
  return out;
}

@Injectable()
export class KnowledgeRetriever implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeRetriever.name);
  private chapters: Chapter[] = [];

  onModuleInit(): void {
    const path = this.resolveKbPath();
    if (!path) {
      this.logger.error('知识库加载失败：未找到 taoteching-wsy-2026.json（已尝试 cwd 及模块各级上级目录）');
      return;
    }
    try {
      const kb = JSON.parse(readFileSync(path, 'utf8')) as { chapters: Chapter[] };
      this.chapters = kb.chapters ?? [];
      this.logger.log(`知识库已加载：${this.chapters.length} 章（${path}）`);
    } catch (e) {
      this.logger.error(`知识库加载失败：${(e as Error).message}`);
    }
  }

  /** 知识库文件定位：兼容从项目根目录或 backend 目录启动 */
  private resolveKbPath(): string | null {
    const file = 'taoteching-wsy-2026.json';
    const candidates: string[] = [];
    if (process.env.KB_PATH) candidates.push(resolve(process.env.KB_PATH));
    const walkUp = (start: string, depth: number): void => {
      let dir = start;
      for (let i = 0; i < depth; i++) {
        candidates.push(resolve(dir, 'knowledge-base', file));
        candidates.push(resolve(dir, 'backend', 'knowledge-base', file));
        const parent = resolve(dir, '..');
        if (parent === dir) break;
        dir = parent;
      }
    };
    walkUp(process.cwd(), 3);
    walkUp(__dirname, 6);
    for (const p of candidates) {
      try {
        readFileSync(p);
        return p;
      } catch {
        /* 尝试下一个候选路径 */
      }
    }
    return null;
  }

  get loaded(): boolean {
    return this.chapters.length > 0;
  }

  get chapterCount(): number {
    return this.chapters.length;
  }

  /** 全量章节（按知识库原序，供章节研学等模块遍历） */
  get allChapters(): Chapter[] {
    return this.chapters;
  }

  getChapter(no: number): Chapter | undefined {
    return this.chapters.find((c) => c.no === no);
  }

  /**
   * 关键词检索：按二元组重叠对章节打分，返回 TopK 及命中的注解条目
   */
  search(query: string, topK = 3): RetrievedChapter[] {
    const terms = bigrams(query);
    const results: RetrievedChapter[] = [];
    for (const ch of this.chapters) {
      const corpus = `${ch.title}${ch.simplified ?? ''}${ch.summary ?? ''}${ch.conceptNotes}`;
      const corpusSet = bigrams(corpus);
      let score = 0;
      for (const t of terms) if (corpusSet.has(t)) score += 1;
      // 整句命中加权
      if (query.length >= 4 && corpus.includes(query)) score += 10;
      if (score === 0) continue;
      const matchedAnnotations = ch.annotations.filter((a) => {
        const s = `${a.sentence}${a.items.map((i) => i.text).join('')}`;
        return [...terms].some((t) => s.includes(t));
      });
      results.push({ chapter: ch, score, matchedAnnotations });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}
