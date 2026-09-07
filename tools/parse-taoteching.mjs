#!/usr/bin/env node
/**
 * 解析本地受保护原始资料为 81 章结构化知识库 JSON
 *
 * 输出结构：
 * {
 *   meta: { source, baseText, chapters, generatedAt, warnings[] },
 *   chapters: [{
 *     no, rawNo, title,
 *     source: '帛书甲乙本' | '通行本',
 *     chapterNote,            // 章首说明（如"核心概念已见第一章…"）
 *     original,               // 帛书甲乙本原文（含异文标注）
 *     simplified,             // 通行简体字版（可能为 null）
 *     phonetics,              // 生僻字注音·繁简对照（可能为 null/空）
 *     conceptNotes,           // 核心概念铺垫/章内概念说明（第1章有专节）
 *     annotations: [{ no, sentence, items: [{type:'note'|'wang'|'organizer'|'quote', text}] }],
 *     summary,                // 小结（可能为 null）
 *     appendix,               // 附论等附加章节（第1章有）
 *     images: [string]        // 引用的图片路径（文件可能缺失）
 *   }]
 * }
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_SRC = join(ROOT, 'private', 'taoteching-source.md');
const SRC = process.env.TAOTECHING_SOURCE_PATH
  ? resolve(ROOT, process.env.TAOTECHING_SOURCE_PATH)
  : DEFAULT_SRC;
const OUT = join(ROOT, 'knowledge-base', 'taoteching-wsy-2026.json');

const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
function cnToNum(s) {
  if (s.includes('十')) {
    const [a, b] = s.split('十');
    return (a ? CN[a] : 1) * 10 + (b ? CN[b] : 0);
  }
  return CN[s] ?? 0;
}
const numToCn = (n) => {
  const units = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n < 10) return units[n];
  if (n === 10) return '十';
  if (n < 20) return '十' + units[n % 10];
  return units[Math.floor(n / 10)] + '十' + (n % 10 ? units[n % 10] : '');
};

let text = '';
try {
  text = readFileSync(SRC, 'utf8');
} catch (error) {
  console.error(`[FATAL] 无法读取源文件：${SRC}`);
  console.error('请在本地提供受保护原始资料，并通过 TAOTECHING_SOURCE_PATH 指定路径。');
  throw error;
}
const lines = text.split(/\r?\n/);

// 1. 定位章节
const chapterStarts = [];
lines.forEach((ln, i) => {
  const m = ln.match(/^## 道德经 第(.+?)章\s*$/);
  if (m) chapterStarts.push({ index: i, rawNo: m[1], no: cnToNum(m[1]) });
});
if (chapterStarts.length !== 81) {
  console.error(`[FATAL] 章节数异常：${chapterStarts.length}（期望 81）`);
  process.exit(1);
}

const warnings = [];
const chapters = [];

for (let ci = 0; ci < chapterStarts.length; ci++) {
  const start = chapterStarts[ci];
  const endIdx = ci + 1 < chapterStarts.length ? chapterStarts[ci + 1].index : lines.length;
  const body = lines.slice(start.index + 1, endIdx);

  const ch = {
    no: start.no,
    rawNo: start.rawNo,
    title: '',
    source: '帛书甲乙本',
    chapterNote: '',
    original: '',
    simplified: null,
    phonetics: null,
    conceptNotes: '',
    annotations: [],
    summary: null,
    appendix: null,
    images: [],
  };

  let section = 'header'; // header|original|concept|annotations|appendix|summary
  let mode = 'none';      // original 段内: none|simplified|phonetics
  let curAnno = null;
  const conceptBuf = [];
  const summaryBuf = [];
  const appendixBuf = [];

  const closeAnno = () => {
    if (curAnno) { ch.annotations.push(curAnno); curAnno = null; }
  };
  const stripQuote = (ln) => ln.replace(/^\s*>\s?/, '');

  for (const ln of body) {
    const h3 = ln.match(/^###\s+(.+)$/);
    const h4 = ln.match(/^####\s*(\d+)\.\s*(.*)$/);
    const isChapterNote = /^> /.test(ln);

    if (h3) {
      closeAnno();
      const t = h3[1];
      if (t.startsWith('一、原文')) {
        section = 'original'; mode = 'none';
        if (t.includes('通行本')) ch.source = '通行本';
      } else if (t.startsWith('二、核心概念铺垫')) {
        section = 'concept';
      } else if (t.includes('逐句注解')) {
        section = 'annotations';
      } else if (t.startsWith('五、附论') || t.startsWith('四、')) {
        section = 'appendix';
      } else if (t.includes('小结')) {
        section = 'summary';
      } else {
        section = 'other';
      }
      continue;
    }

    if (h4) {
      closeAnno();
      curAnno = { no: Number(h4[1]), sentence: h4[2].trim(), items: [] };
      continue;
    }

    if (section === 'header') {
      if (isChapterNote) {
        ch.chapterNote = (ch.chapterNote ? ch.chapterNote + '\n' : '') + stripQuote(ln).trim();
      } else if (/^!\[.*\]\((.+)\)$/.test(ln)) {
        ch.images.push(ln.match(/^!\[.*\]\((.+)\)$/)[1]);
      }
      continue;
    }

    if (section === 'original') {
      if (/^!\[.*\]\((.+)\)$/.test(ln)) { ch.images.push(ln.match(/^!\[.*\]\((.+)\)$/)[1]); continue; }
      if (ln.startsWith('> **通行简体字版')) {
        mode = 'simplified';
        ch.simplified = stripQuote(ln).replace(/^\*\*通行简体字版\*\*[:：]?\s*/, '').trim();
        continue;
      }
      if (ln.startsWith('> **生僻字注音')) {
        mode = 'phonetics';
        ch.phonetics = stripQuote(ln).replace(/^\*\*生僻字注音[^:：]*\*\*[:：]?\s*/, '').trim();
        continue;
      }
      if (ln.startsWith('>')) {
        const s = stripQuote(ln).trim();
        if (mode === 'none') ch.original += (ch.original ? '\n' : '') + s;
        else conceptBuf.push(s); // 注音行后的补充说明（如 【整理者按】底本说明）
        continue;
      }
      if (mode !== 'none') {
        // 注音/简体行后的非引用行（分隔线/空行/粗体说明/图片）
        const b = ln.match(/^\*\*(.+)\*\*\s*$/);
        if (b) conceptBuf.push(b[1]);
      }
      continue;
    }

    if (section === 'concept') {
      if (/^!\[.*\]\((.+)\)$/.test(ln)) { ch.images.push(ln.match(/^!\[.*\]\((.+)\)$/)[1]); continue; }
      if (/^\s*-{3,}\s*$/.test(ln)) continue;
      if (ln.trim()) conceptBuf.push(ln.trim());
      continue;
    }

    if (section === 'annotations') {
      if (!curAnno) continue;
      const t = ln.trim();
      if (!t || /^-{3,}$/.test(t)) continue;
      if (/^!\[.*\]\((.+)\)$/.test(t)) { ch.images.push(t.match(/^!\[.*\]\((.+)\)$/)[1]); continue; }
      // 提取文本并按内容分类（支持 - 、> 、** 三种前缀形式）
      let text = null;
      let type = 'note';
      if (t.startsWith('- ')) text = t.slice(2).trim();
      else if (t.startsWith('> ')) { text = t.slice(2).trim(); type = 'quote'; }
      else if (/^\*\*.+\*\*$/.test(t)) text = t.replace(/^\*\*|\*\*$/g, '').trim();
      if (text === null) continue;
      if (text.startsWith('【汪按】')) type = 'wang';
      else if (text.startsWith('【整理者按】')) type = 'organizer';
      curAnno.items.push({ type, text });
      continue;
    }

    if (section === 'appendix') {
      if (ln.trim()) appendixBuf.push(ln.trim());
      continue;
    }

    if (section === 'summary') {
      if (/^!\[.*\]\((.+)\)$/.test(ln)) { ch.images.push(ln.match(/^!\[.*\]\((.+)\)$/)[1]); continue; }
      if (/^\s*-{3,}\s*$/.test(ln)) continue;
      if (ln.trim()) summaryBuf.push(ln.trim());
      continue;
    }
  }
  closeAnno();

  ch.conceptNotes = conceptBuf.join('\n');
  ch.summary = summaryBuf.length ? summaryBuf.join('\n') : null;
  ch.appendix = appendixBuf.length ? appendixBuf.join('\n') : null;

  // 标题：取简体版（无则原文）前 3 个汉字（如"道可道"），空则用章节号
  const hanzi = (ch.simplified || ch.original || '').replace(/[^\u4e00-\u9fff]/g, '');
  ch.title = hanzi ? hanzi.slice(0, 3) : `第${ch.rawNo}章`;

  if (!ch.original) warnings.push(`第${ch.rawNo}章：缺少原文`);
  if (!ch.simplified) warnings.push(`第${ch.rawNo}章：缺少通行简体字版`);
  if (!ch.summary) warnings.push(`第${ch.rawNo}章：缺少小结`);
  if (ch.annotations.length === 0) warnings.push(`第${ch.rawNo}章：无逐句注解`);
  if (ch.original && !ch.original.includes('>') && ch.original.split('\n').length === 1 && ch.original.length < 10) {
    warnings.push(`第${ch.rawNo}章：原文过短，疑似解析异常`);
  }

  chapters.push(ch);
}

// 排序并校验连续性
chapters.sort((a, b) => a.no - b.no);
const missing = [];
for (let n = 1; n <= 81; n++) {
  if (!chapters.some((c) => c.no === n)) missing.push(n);
}
if (missing.length) warnings.push(`缺失章节：${missing.join(',')}`);

const meta = {
  source: '受版权保护的内部原始资料（未入库）',
  baseText: '帛书甲乙本（个别章通行本）',
  author: '汪胜岩（注解）',
  compiled: '2026',
  chapters: chapters.length,
  generatedAt: new Date().toISOString(),
  warnings,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ meta, chapters }, null, 2), 'utf8');

// 报告
const annoTotal = chapters.reduce((s, c) => s + c.annotations.length, 0);
const itemByType = {};
chapters.forEach((c) => c.annotations.forEach((a) => a.items.forEach((i) => {
  itemByType[i.type] = (itemByType[i.type] || 0) + 1;
})));
// 源文件按语统计（仅正文部分，排除作品信息/凡例/序言）
const bodyText = lines.slice(chapterStarts[0].index).join('\n');
const srcWang = (bodyText.match(/【汪按】/g) || []).length;
const srcOrg = (bodyText.match(/【整理者按】/g) || []).length;
// 解析出的按语（含 conceptNotes 中的概念逻辑图标记）
const outWang = chapters.reduce((s, c) => s + c.annotations.reduce((x, a) => x + a.items.filter((i) => i.type === 'wang').length, 0), 0);
const outOrgAnno = chapters.reduce((s, c) => s + c.annotations.reduce((x, a) => x + a.items.filter((i) => i.type === 'organizer').length, 0), 0);
const outOrgConcept = chapters.reduce((s, c) => s + (c.conceptNotes.match(/【整理者按】/g) || []).length, 0);
console.log(`✅ 生成 ${OUT}`);
console.log(`   章节：${chapters.length}（1-${chapters[chapters.length - 1].no}）`);
console.log(`   逐句注解条目：${annoTotal}`);
console.log(`   注解内容类型：${JSON.stringify(itemByType)}`);
console.log(`   有小结章节：${chapters.filter((c) => c.summary).length}/81`);
console.log(`   有简体版章节：${chapters.filter((c) => c.simplified).length}/81`);
console.log(`   【汪按】源文件 ${srcWang} → 解析 ${outWang}`);
console.log(`   【整理者按】源文件 ${srcOrg} → 注解 ${outOrgAnno} + 概念说明 ${outOrgConcept} = ${outOrgAnno + outOrgConcept}`);
console.log(`   警告：${warnings.length}`);
warnings.forEach((w) => console.log(`   ⚠ ${w}`));
