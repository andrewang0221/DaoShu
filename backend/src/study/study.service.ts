import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';
import { KnowledgeRetriever } from '../chat/knowledge-retriever.service';

/** 游客免费研学章节数（默认前三章） */
export const GUEST_FREE_CHAPTERS = 3;

/** 笔记来源段落白名单 */
const NOTE_SECTIONS = ['original', 'simplified', 'chapterNote', 'conceptNotes', 'summary', 'annotation'] as const;
type NoteSection = (typeof NOTE_SECTIONS)[number] | 'mark';

export interface StudyNoteRow {
  id: string;
  section: NoteSection;
  quote: string | null;
  content: string;
  createdAt: string;
}

@Injectable()
export class StudyService {
  /** 演示模式：内存进度账本（userId -> 已研学章号集合），重启即清零 */
  private readonly demoProgress = new Map<string, Set<number>>();

  /** 演示模式：笔记账本（`${userId}:${no}` -> 笔记数组），重启即清零 */
  private readonly demoNotes = new Map<string, StudyNoteRow[]>();
  private nextDemoNoteId = 1;

  constructor(
    private readonly db: DatabaseService,
    private readonly retriever: KnowledgeRetriever,
  ) {}

  /** 取某用户已研学章号集合（游客返回空集合） */
  private async studiedSet(userId: string | null): Promise<Set<number>> {
    if (!userId) return new Set();
    if (IS_DEMO()) return this.demoProgress.get(userId) ?? new Set<number>();
    const rows = await this.db.query<{ chapter_no: number }>(
      `SELECT chapter_no FROM study_progress WHERE user_id = $1 AND status = 'studied'`,
      [userId],
    );
    return new Set(rows.map((r) => Number(r.chapter_no)));
  }

  /** 下一章：第一个未研学章号；全部学完返回 null（游客无进度记录，恒为第一章） */
  private nextChapterNo(nos: number[], studied: Set<number>, userId: string | null): number | null {
    if (!userId) return nos.length ? Math.min(...nos) : null;
    for (const no of nos) if (!studied.has(no)) return no;
    return null;
  }

  /** 章节列表（含学习进度标记；游客前三章外锁定） */
  async listChapters(userId: string | null) {
    const studied = await this.studiedSet(userId);
    const chapters = this.retriever.allChapters.map((ch) => ({
      no: ch.no,
      title: ch.title,
      excerpt: (ch.simplified ?? ch.original).replace(/\s+/g, '').slice(0, 24),
      studied: studied.has(ch.no),
      locked: !userId && ch.no > GUEST_FREE_CHAPTERS,
    }));
    const nos = chapters.map((c) => c.no);
    return {
      total: nos.length,
      guest: !userId,
      guestFreeChapters: GUEST_FREE_CHAPTERS,
      studiedCount: userId ? studied.size : 0,
      nextChapterNo: this.nextChapterNo(nos, studied, userId),
      chapters,
    };
  }

  /** 章节详情（游客仅可看前三章） */
  async getChapter(no: number, userId: string | null) {
    if (!Number.isInteger(no) || no < 1 || no > this.retriever.chapterCount) {
      throw new BadRequestException('章号需为 1-81');
    }
    if (!userId && no > GUEST_FREE_CHAPTERS) {
      throw new ForbiddenException('游客可免费研学前三章，登录后解锁全部 81 章');
    }
    const ch = this.retriever.getChapter(no);
    if (!ch) throw new NotFoundException('章节不存在（知识库未加载？）');
    const studied = await this.studiedSet(userId);
    return {
      guest: !userId,
      studied: userId ? studied.has(no) : false,
      chapter: ch,
    };
  }

  /** 标记某章研学完成（注册用户） */
  async complete(userId: string, no: number) {
    if (!Number.isInteger(no) || no < 1 || no > this.retriever.chapterCount) {
      throw new BadRequestException('章号需为 1-81');
    }
    if (!this.retriever.getChapter(no)) throw new NotFoundException('章节不存在（知识库未加载？）');
    if (IS_DEMO()) {
      const set = this.demoProgress.get(userId) ?? new Set<number>();
      set.add(no);
      this.demoProgress.set(userId, set);
    } else {
      await this.db.query(
        `INSERT INTO study_progress (user_id, chapter_no) VALUES ($1, $2)
         ON CONFLICT (user_id, chapter_no)
         DO UPDATE SET status = 'studied', studied_at = now(), updated_at = now()`,
        [userId, no],
      );
    }
    const studied = await this.studiedSet(userId);
    const nos = this.retriever.allChapters.map((c) => c.no);
    return {
      ok: true,
      chapterNo: no,
      studiedCount: studied.size,
      total: nos.length,
      nextChapterNo: this.nextChapterNo(nos, studied, userId),
    };
  }

  /** 学习进度汇总（我的页面 / 首页进度条） */
  async summary(userId: string) {
    const studied = await this.studiedSet(userId);
    const nos = this.retriever.allChapters.map((c) => c.no);
    return {
      total: nos.length,
      studiedCount: studied.size,
      nextChapterNo: this.nextChapterNo(nos, studied, userId),
      percent: nos.length ? Math.round((studied.size / nos.length) * 100) : 0,
    };
  }

  // ---------- 书斋：笔记与划句标注 ----------

  private assertChapterNo(no: number): void {
    if (!Number.isInteger(no) || no < 1 || no > this.retriever.chapterCount) {
      throw new BadRequestException('章号需为 1-81');
    }
    if (!this.retriever.getChapter(no)) throw new NotFoundException('章节不存在（知识库未加载？）');
  }

  private demoNotesKey(userId: string, no: number): string {
    return `${userId}:${no}`;
  }

  /** 某章笔记与标注列表 */
  async listNotes(userId: string, no: number): Promise<StudyNoteRow[]> {
    this.assertChapterNo(no);
    if (IS_DEMO()) return this.demoNotes.get(this.demoNotesKey(userId, no)) ?? [];
    return this.db.query<StudyNoteRow>(
      `SELECT id, section, quote, content, created_at AS "createdAt"
       FROM study_notes WHERE user_id = $1 AND chapter_no = $2
       ORDER BY created_at ASC`,
      [userId, no],
    );
  }

  /** 新增笔记（section 白名单校验；纯划句标注用 toggleMark） */
  async addNote(userId: string, no: number, input: { section?: string; quote?: string; content?: string }) {
    this.assertChapterNo(no);
    const section = NOTE_SECTIONS.includes(input.section as (typeof NOTE_SECTIONS)[number])
      ? (input.section as (typeof NOTE_SECTIONS)[number])
      : 'original';
    const quote = (input.quote ?? '').trim() || null;
    const content = (input.content ?? '').trim();
    if (!quote && !content) throw new BadRequestException('笔记内容不能为空');
    if (IS_DEMO()) {
      const list = this.demoNotes.get(this.demoNotesKey(userId, no)) ?? [];
      const row: StudyNoteRow = {
        id: `demo-note-${this.nextDemoNoteId++}`,
        section,
        quote,
        content,
        createdAt: new Date().toISOString(),
      };
      list.push(row);
      this.demoNotes.set(this.demoNotesKey(userId, no), list);
      return row;
    }
    const rows = await this.db.query<StudyNoteRow>(
      `INSERT INTO study_notes (user_id, chapter_no, section, quote, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, section, quote, content, created_at AS "createdAt"`,
      [userId, no, section, quote, content],
    );
    return rows[0];
  }

  /** 删除自己的笔记 */
  async removeNote(userId: string, noteId: string) {
    if (IS_DEMO()) {
      for (const [, list] of this.demoNotes) {
        const idx = list.findIndex((n) => n.id === noteId);
        if (idx >= 0) {
          list.splice(idx, 1);
          return { ok: true };
        }
      }
      throw new NotFoundException('笔记不存在');
    }
    const rows = await this.db.query<{ id: string }>(
      `DELETE FROM study_notes WHERE id = $1 AND user_id = $2 RETURNING id`,
      [noteId, userId],
    );
    if (!rows.length) throw new NotFoundException('笔记不存在');
    return { ok: true };
  }

  /** 划句标注 toggle：已标注则取消，未标注则新增（section='mark'，quote 存原句） */
  async toggleMark(userId: string, no: number, quote: string) {
    this.assertChapterNo(no);
    const q = (quote ?? '').trim();
    if (!q) throw new BadRequestException('标注内容不能为空');
    if (IS_DEMO()) {
      const key = this.demoNotesKey(userId, no);
      const list = this.demoNotes.get(key) ?? [];
      const idx = list.findIndex((n) => n.section === 'mark' && n.quote === q);
      if (idx >= 0) {
        list.splice(idx, 1);
        this.demoNotes.set(key, list);
        return { ok: true, marked: false };
      }
      list.push({
        id: `demo-note-${this.nextDemoNoteId++}`,
        section: 'mark',
        quote: q,
        content: '',
        createdAt: new Date().toISOString(),
      });
      this.demoNotes.set(key, list);
      return { ok: true, marked: true };
    }
    const removed = await this.db.query<{ id: string }>(
      `DELETE FROM study_notes
       WHERE user_id = $1 AND chapter_no = $2 AND section = 'mark' AND quote = $3
       RETURNING id`,
      [userId, no, q],
    );
    if (removed.length) return { ok: true, marked: false };
    await this.db.query(
      `INSERT INTO study_notes (user_id, chapter_no, section, quote, content)
       VALUES ($1, $2, 'mark', $3, '')`,
      [userId, no, q],
    );
    return { ok: true, marked: true };
  }
}
