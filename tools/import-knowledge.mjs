#!/usr/bin/env node
/**
 * 将 knowledge-base/taoteching-wsy-2026.json 导入 knowledge_items（管理员导入，直接 approved）
 *
 * 用法：
 *   DATABASE_URL=postgres://user:pass@localhost:5432/taoteching node tools/import-knowledge.mjs
 *   （幂等：可重复执行，先清空 chapter_no 相同的历史管理员导入条目再插入）
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';

const KB = 'knowledge-base/taoteching-wsy-2026.json';
const SOURCE_LABEL = '汪胜岩《道德经》注解（2026整理本）';
const { Pool } = pg;

function toContent(ch) {
  return JSON.stringify({
    original: ch.original,
    simplified: ch.simplified,
    phonetics: ch.phonetics,
    chapterNote: ch.chapterNote,
    conceptNotes: ch.conceptNotes,
    annotations: ch.annotations,
    summary: ch.summary,
    appendix: ch.appendix,
    images: ch.images,
  });
}

const kb = JSON.parse(readFileSync(KB, 'utf8'));
if (kb.chapters.length !== 81) {
  console.error(`[FATAL] 知识库章节数异常：${kb.chapters.length}（期望 81）`);
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // 幂等：清空同来源管理员导入记录
  await client.query(`DELETE FROM knowledge_items WHERE source_type = 'admin_import' AND source = $1`, [SOURCE_LABEL]);
  let n = 0;
  for (const ch of kb.chapters) {
    await client.query(
      `INSERT INTO knowledge_items (status, source_type, chapter_no, title, content, source, tags, version)
       VALUES ('approved', 'admin_import', $1, $2, $3, $4, $5, 1)`,
      [ch.no, `道德经·第${ch.rawNo}章·${ch.title}`,
       toContent(ch), SOURCE_LABEL, JSON.stringify(['帛书甲乙本', `第${ch.no}章`])],
    );
    n++;
  }
  await client.query('COMMIT');
  console.log(`✅ 导入完成：${n} 章（status=approved / admin_import）`);
} catch (e) {
  await client.query('ROLLBACK');
  console.error('导入失败，已回滚：', e.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
