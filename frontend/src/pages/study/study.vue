<template>
  <view class="page">
    <!-- ===================== 书斋（目录） ===================== -->
    <block v-if="!reading">
      <view class="hero">
        <view class="hero-back" @tap="goBack">‹ 返回</view>
        <view class="hero-title">章节研学</view>
        <view class="hero-sub">日诵一章 · 日省一理 · 日行一道 · 进度随身</view>
      </view>

      <!-- 学习进度 / 游客提示 -->
      <view class="card progress-card">
        <template v-if="!list.guest">
          <view class="progress-head">
            <text class="progress-label">研学进度</text>
            <text class="progress-num">{{ list.studiedCount }} / {{ list.total }} 章</text>
          </view>
          <view class="progress-bar">
            <view class="progress-inner" :style="{ width: percent + '%' }"></view>
          </view>
          <view class="progress-actions">
            <view class="btn primary" @tap="continueStudy">{{ nextText }}</view>
          </view>
        </template>
        <template v-else>
          <view class="guest-tip">
            <text class="guest-title">游客试学 · 前三章免费瞻览</text>
            <text class="guest-desc">登录后解锁全部 {{ list.total }} 章，并可记录研学进度、写笔记、划句标注</text>
            <view class="btn primary" @tap="goLogin">登录 / 注册</view>
          </view>
        </template>
      </view>

      <!-- 筛选 -->
      <view class="filter-row">
        <view class="filter-opt" :class="{ active: filter === 'all' }" @tap="filter = 'all'">全部</view>
        <view class="filter-opt" :class="{ active: filter === 'todo' }" @tap="filter = 'todo'">未学</view>
        <view class="filter-opt" :class="{ active: filter === 'done' }" @tap="filter = 'done'">已学</view>
      </view>

      <!-- 目录（仿书页） -->
      <view class="toc-book">
        <view class="toc-title">目 录</view>
        <view class="toc-grid">
          <view
            v-for="ch in filteredChapters"
            :key="ch.no"
            class="toc-cell"
            :class="{ studied: ch.studied, locked: ch.locked }"
            @tap="openChapter(ch.no)"
          >
            <text class="toc-no">{{ ch.no }}</text>
            <text class="toc-name">{{ ch.title }}</text>
            <text v-if="ch.studied" class="toc-done">✓</text>
            <text v-else-if="ch.locked" class="toc-lock">🔒</text>
          </view>
        </view>
      </view>
    </block>

    <!-- ===================== 读书页（仿纸质书） ===================== -->
    <view v-else class="reader">
      <view class="reader-top">
        <view class="rt-btn" @tap="closeReader">‹ 书斋</view>
        <view class="rt-title">第{{ curNo }}章 · {{ curTitle }}</view>
        <view class="rt-right">
          <view class="rt-fbtn" @tap="fontDown">A-</view>
          <view class="rt-fbtn" @tap="fontUp">A+</view>
          <view class="rt-btn" :class="{ done: curStudied }" @tap="markStudied">
            {{ curStudied ? '已研学' : '标记' }}
          </view>
        </view>
      </view>

      <swiper
        class="book-swiper"
        :current="pageIndex"
        :duration="280"
        @change="(e: any) => (pageIndex = e.detail.current)"
      >
        <swiper-item v-for="(pg, idx) in pages" :key="idx">
          <scroll-view class="book-page" scroll-y>
            <view class="page-inner">
              <!-- 封面页 -->
              <block v-if="pg.kind === 'title'">
                <view class="tp-wrap">
                  <view class="tp-ornament">☯</view>
                  <text class="tp-no">第 {{ curNo }} 章</text>
                  <text class="tp-title">{{ curTitle }}</text>
                  <text class="tp-source">{{ curChapter?.source }}</text>
                  <view class="tp-divider"></view>
                  <text class="tp-hint">点句划线标注 · 长按原句作批注</text>
                  <view v-if="curStudied" class="tp-studied">✓ 此章已研学</view>
                </view>
              </block>

              <!-- 帛书原文（逐句可标注） -->
              <block v-else-if="pg.kind === 'original'">
                <view class="pg-label"><text class="pg-label-text">{{ pg.label }}</text></view>
                <view class="original-body">
                  <text
                    v-for="(s, i) in pg.sentences"
                    :key="i"
                    class="sentence"
                    :class="{ marked: s.marked }"
                    @tap="toggleMark(s)"
                    @longpress="openNoteDialog('original', '帛书原文', s.text)"
                  >{{ s.text }}</text>
                </view>
                <view class="pg-actions">
                  <view class="mini-btn" @tap="openNoteDialog('original', '帛书原文', '')">✎ 作批注</view>
                </view>
              </block>

              <!-- 拼音 -->
              <block v-else-if="pg.kind === 'phonetics'">
                <view class="pg-label"><text class="pg-label-text">{{ pg.label }}</text></view>
                <text class="para phonetic">{{ pg.text }}</text>
              </block>

              <!-- 概念逻辑图 -->
              <block v-else-if="pg.kind === 'image'">
                <view class="pg-label"><text class="pg-label-text">{{ pg.label }}</text></view>
                <image
                  v-for="(img, i) in pg.images"
                  :key="i"
                  class="concept-img"
                  :src="conceptImgUrl(img)"
                  mode="widthFix"
                  @tap="previewImages(pg.images, i)"
                />
                <text class="img-hint">点击图片可全屏查看</text>
              </block>

              <!-- 普通文本段（今译/章旨/概念/小结） -->
              <block v-else-if="pg.kind === 'text'">
                <view class="pg-label"><text class="pg-label-text">{{ pg.label }}</text></view>
                <text class="para">{{ pg.text }}</text>
                <view class="pg-actions">
                  <view class="mini-btn" @tap="openNoteDialog(pg.section, pg.label, '')">✎ 作批注</view>
                </view>
              </block>

              <!-- 逐句注解 -->
              <block v-else-if="pg.kind === 'annotations'">
                <view class="pg-label"><text class="pg-label-text">{{ pg.label }}</text></view>
                <view v-for="(a, i) in pg.anns" :key="i" class="ann">
                  <text class="ann-sentence">{{ a.sentence }}</text>
                  <text v-for="(it, j) in a.items" :key="j" class="ann-item">
                    <text v-if="it.type" class="ann-item-type" :class="{ wang: it.type === '汪按' }">{{ it.type === '汪按' ? '【汪按】' : `【${it.type}】` }}</text>{{ it.text }}
                  </text>
                </view>
                <view class="pg-actions">
                  <view class="mini-btn" @tap="openNoteDialog('annotation', '逐句注解', '')">✎ 作批注</view>
                </view>
              </block>

              <!-- 读书笔记 -->
              <block v-else-if="pg.kind === 'notes'">
                <view class="pg-label"><text class="pg-label-text">{{ pg.label }}</text></view>
                <view v-if="chapterNotes.length === 0" class="notes-empty">
                  <text>此章尚无笔记</text>
                  <text class="notes-empty-sub">点段落旁「✎ 作批注」或长按原句，写下心得</text>
                </view>
                <view v-for="n in chapterNotes" :key="n.id" class="note-item">
                  <view class="note-head">
                    <text class="note-sec">{{ sectionLabel(n.section) }}</text>
                    <text class="note-del" @tap="deleteNote(n)">✕</text>
                  </view>
                  <text v-if="n.quote" class="note-quote">「{{ n.quote }}」</text>
                  <text v-if="n.content" class="note-content">{{ n.content }}</text>
                </view>
                <view class="add-note-btn" @tap="openNoteDialog('original', '帛书原文', '')">＋ 写笔记</view>
              </block>

              <!-- 卷终 -->
              <block v-else-if="pg.kind === 'end'">
                <view class="end-wrap">
                  <view class="tp-ornament">☯</view>
                  <text class="end-text">第 {{ curNo }} 章 · 研读竟</text>
                  <view
                    class="btn primary end-btn"
                    :class="{ disabled: curStudied }"
                    @tap="markStudied"
                  >{{ curStudied ? '✓ 已记录研学' : '完成研学 · 标记进度' }}</view>
                  <view class="end-nav">
                    <view class="end-nav-btn" :class="{ disabled: curNo <= 1 }" @tap="openChapter(curNo - 1)">上一章</view>
                    <view class="end-nav-btn" :class="{ disabled: curNo >= list.total }" @tap="openChapter(curNo + 1)">下一章</view>
                  </view>
                </view>
              </block>
            </view>
            <view class="page-footer">
              <text class="pf-num">{{ idx + 1 }} / {{ pages.length }}</text>
            </view>
          </scroll-view>
        </swiper-item>
      </swiper>

      <view class="reader-bottom">
        <view class="pg-btn" :class="{ disabled: pageIndex <= 0 }" @tap="prevPage">‹ 上一页</view>
        <text class="pg-indicator">{{ pageIndex + 1 }} / {{ pages.length }}</text>
        <view class="pg-btn" :class="{ disabled: pageIndex >= pages.length - 1 }" @tap="nextPage">下一页 ›</view>
      </view>

      <!-- 笔记弹层 -->
      <view v-if="noteDlg.show" class="note-mask" @tap="noteDlg.show = false">
        <view class="note-panel" @tap.stop>
          <view class="note-panel-head">
            <text class="note-panel-title">批注 · {{ noteDlg.sectionLabel }}</text>
            <text class="note-panel-close" @tap="noteDlg.show = false">✕</text>
          </view>
          <text v-if="noteDlg.quote" class="note-panel-quote">「{{ noteDlg.quote }}」</text>
          <textarea
            v-model="noteDlg.content"
            class="note-input"
            maxlength="500"
            placeholder="落笔写下的，才是你的心得…"
          />
          <view class="btn primary" :class="{ disabled: savingNote }" @tap="saveNote">
            {{ savingNote ? '落笔中…' : '存入笔记' }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { api, StudyChapter, StudyChapterList, StudyNote } from '../../api';
import { useAppStore } from '../../store';

const store = useAppStore();
store.restore();

// ---------- 书斋（目录） ----------
const loading = ref(false);
const list = ref<StudyChapterList>({
  total: 81,
  guest: true,
  guestFreeChapters: 3,
  studiedCount: 0,
  nextChapterNo: 1,
  chapters: [],
});
const filter = ref<'all' | 'todo' | 'done'>('all');

const percent = computed(() =>
  list.value.total ? Math.round((list.value.studiedCount / list.value.total) * 100) : 0,
);
const nextText = computed(() => {
  if (!list.value.studiedCount) return '从第一章开始研学';
  if (!list.value.nextChapterNo) return '八十一章已圆满 · 温故知新';
  return `继续研学 · 第${list.value.nextChapterNo}章`;
});
const filteredChapters = computed(() => {
  const all = list.value.chapters;
  if (filter.value === 'todo') return all.filter((c) => !c.studied && !c.locked);
  if (filter.value === 'done') return all.filter((c) => c.studied);
  return all;
});

// ---------- 读书页 ----------
type BookPage =
  | { kind: 'title'; label: string }
  | { kind: 'original'; label: string; sentences: { text: string; marked: boolean }[] }
  | { kind: 'phonetics'; label: string; text: string }
  | { kind: 'text'; label: string; section: string; text: string }
  | { kind: 'annotations'; label: string; anns: { sentence: string; items: { type: string; text: string }[] }[] }
  | { kind: 'notes'; label: string }
  | { kind: 'end'; label: string };

const SECTION_LABELS: Record<string, string> = {
  original: '帛书原文',
  simplified: '今译',
  chapterNote: '章旨',
  conceptNotes: '概念要义',
  summary: '本章小结',
  annotation: '逐句注解',
  mark: '划句标注',
};

const reading = ref(false);
const readerLoading = ref(false);
const curNo = ref(1);
const curChapter = ref<StudyChapter | null>(null);
const curStudied = ref(false);
const curGuest = ref(true);
const pages = ref<BookPage[]>([]);
const pageIndex = ref(0);
const marks = ref<Set<string>>(new Set());
const notes = ref<StudyNote[]>([]);

const curTitle = computed(() => curChapter.value?.title ?? '');
const chapterNotes = computed(() => notes.value.filter((n) => n.section !== 'mark'));

// ---------- 字号调节（用户可自行调整，本地持久化） ----------
const FONT_KEY = 'study_font_size';
const fontSize = ref(Number(uni.getStorageSync(FONT_KEY)) || 36);
const readerVars = computed(() => ({ '--fs-main': `${fontSize.value}rpx` }));
function fontDown() {
  fontSize.value = Math.max(26, fontSize.value - 2);
  uni.setStorageSync(FONT_KEY, fontSize.value);
}
function fontUp() {
  fontSize.value = Math.min(56, fontSize.value + 2);
  uni.setStorageSync(FONT_KEY, fontSize.value);
}

// ---------- 概念逻辑图 ----------
function conceptImgUrl(img: string): string {
  return `/static/concept-maps/${img}`;
}
function previewImages(images: string[], index: number) {
  uni.previewImage({ urls: images.map(conceptImgUrl), current: index });
}

/** 按句切分（保留标点） */
function splitSentences(text: string): string[] {
  const out: string[] = [];
  const parts = (text ?? '').replace(/\s+/g, ' ').split(/([。！？；!?;])/);
  for (let i = 0; i < parts.length; i += 2) {
    const s = (parts[i] + (parts[i + 1] ?? '')).trim();
    if (s) out.push(s);
  }
  return out;
}

/** 章节内容 → 书页序列：每个小版块独占一页（页内可上下滚动翻阅）
 *  封面 → 帛书原文（一页）→ 通行简体（一页）→ 注音（一页）→ 概念逻辑图（一页）
 *  → 逐句注解（一页）→ 章节小结（一页）→ 读书笔记 → 卷终 */
function buildPages(ch: StudyChapter): BookPage[] {
  const pages: BookPage[] = [{ kind: 'title', label: '封面' }];
  // 一、帛书甲乙本原文（整章一页，逐句可标注）
  pages.push({
    kind: 'original',
    label: '帛书原文',
    sentences: splitSentences(ch.original).map((t) => ({ text: t, marked: marks.value.has(t) })),
  });
  // 一（续）：通行简体字版
  if (ch.simplified) {
    pages.push({ kind: 'text', label: '通行简体字版', section: 'simplified', text: ch.simplified });
  }
  // 生僻字注音
  if (ch.phonetics) {
    pages.push({ kind: 'phonetics', label: '注音', text: ch.phonetics });
  }
  // 二、概念逻辑图（整章一页，多图纵向排列）
  if (ch.images?.length) {
    pages.push({ kind: 'image', label: '概念逻辑图', images: ch.images });
  }
  // 三、逐句注解（整章一页，页内滚动）
  if (ch.annotations.length) {
    pages.push({ kind: 'annotations', label: '逐句注解', anns: ch.annotations });
  }
  // 四、章节小结
  if (ch.summary) {
    pages.push({ kind: 'text', label: '章节小结', section: 'summary', text: ch.summary });
  }
  pages.push({ kind: 'notes', label: '读书笔记' });
  pages.push({ kind: 'end', label: '卷终' });
  return pages;
}

/** 标注变化后同步句子的 marked 状态（不重建书页，保持翻页位置） */
function applyMarks() {
  for (const pg of pages.value) {
    if (pg.kind === 'original') {
      for (const s of pg.sentences) s.marked = marks.value.has(s.text);
    }
  }
}

async function loadList() {
  loading.value = true;
  try {
    list.value = await api.studyChapters();
  } catch {
    /* 静默失败 */
  } finally {
    loading.value = false;
  }
}

/** 进入某章阅读（reading 状态下也可用于翻章） */
async function openChapter(no: number) {
  if (no < 1 || no > list.value.total) return;
  const cell = list.value.chapters.find((c) => c.no === no);
  if (cell?.locked) {
    uni.showModal({
      title: '游客试学',
      content: `游客可免费研学前三章，登录后解锁全部 ${list.value.total} 章。是否前往登录？`,
      confirmText: '去登录',
      success: (r) => {
        if (r.confirm) goLogin();
      },
    });
    return;
  }
  readerLoading.value = true;
  try {
    const detail = await api.studyChapter(no);
    curNo.value = no;
    curChapter.value = detail.chapter;
    curStudied.value = detail.studied;
    curGuest.value = detail.guest;
    notes.value = [];
    marks.value = new Set();
    if (!detail.guest) {
      try {
        notes.value = await api.studyNotes(no);
        marks.value = new Set(
          notes.value.filter((n) => n.section === 'mark' && n.quote).map((n) => n.quote!),
        );
      } catch {
        /* 静默：笔记拉取失败不阻塞阅读 */
      }
    }
    pages.value = buildPages(detail.chapter);
    pageIndex.value = 0;
    reading.value = true;
  } catch {
    /* 静默失败 */
  } finally {
    readerLoading.value = false;
  }
}

function closeReader() {
  reading.value = false;
  loadList();
}

function prevPage() {
  if (pageIndex.value > 0) pageIndex.value -= 1;
}
function nextPage() {
  if (pageIndex.value < pages.value.length - 1) pageIndex.value += 1;
}

// ---------- 划句标注 ----------
async function toggleMark(s: { text: string; marked: boolean }) {
  if (curGuest.value) {
    promptLogin('登录后可划句标注');
    return;
  }
  try {
    const res = await api.studyToggleMark(curNo.value, s.text);
    if (res.marked) marks.value.add(s.text);
    else marks.value.delete(s.text);
    s.marked = res.marked;
  } catch {
    /* request 已提示 */
  }
}

// ---------- 笔记 ----------
const noteDlg = ref({
  show: false,
  section: 'original',
  sectionLabel: '帛书原文',
  quote: '',
  content: '',
});
const savingNote = ref(false);

function openNoteDialog(section: string, sectionLabel: string, quote: string) {
  if (curGuest.value) {
    promptLogin('登录后可写批注');
    return;
  }
  noteDlg.value = { show: true, section, sectionLabel, quote: quote ?? '', content: '' };
}

async function saveNote() {
  const content = noteDlg.value.content.trim();
  if (!content && !noteDlg.value.quote) {
    uni.showToast({ title: '写点心得再存吧', icon: 'none' });
    return;
  }
  savingNote.value = true;
  try {
    const row = await api.studyAddNote(curNo.value, {
      section: noteDlg.value.section,
      quote: noteDlg.value.quote || undefined,
      content,
    });
    notes.value.push(row);
    noteDlg.value.show = false;
    uni.showToast({ title: '已存入笔记', icon: 'success' });
  } catch {
    /* request 已提示 */
  } finally {
    savingNote.value = false;
  }
}

async function deleteNote(n: StudyNote) {
  uni.showModal({
    title: '删除笔记',
    content: '确定删除这条笔记吗？',
    confirmText: '删除',
    success: async (r) => {
      if (!r.confirm) return;
      try {
        await api.studyDeleteNote(n.id);
        notes.value = notes.value.filter((x) => x.id !== n.id);
        marks.value = new Set(
          notes.value.filter((x) => x.section === 'mark' && x.quote).map((x) => x.quote!),
        );
        applyMarks();
        uni.showToast({ title: '已删除', icon: 'none' });
      } catch {
        /* request 已提示 */
      }
    },
  });
}

function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? section;
}

// ---------- 研学进度 ----------
async function markStudied() {
  if (curStudied.value) return;
  if (curGuest.value) {
    promptLogin('登录后可记录研学进度');
    return;
  }
  try {
    const res = await api.studyComplete(curNo.value);
    curStudied.value = true;
    list.value.studiedCount = res.studiedCount;
    list.value.nextChapterNo = res.nextChapterNo;
    const cell = list.value.chapters.find((c) => c.no === curNo.value);
    if (cell) cell.studied = true;
    uni.showToast({ title: '已记录研学进度', icon: 'success' });
  } catch {
    /* request 已提示 */
  }
}

function continueStudy() {
  const target = list.value.studiedCount ? list.value.nextChapterNo : list.value.chapters[0]?.no;
  if (target) openChapter(target);
}

function promptLogin(msg: string) {
  uni.showModal({
    title: '游客试学',
    content: `${msg}，是否前往登录？`,
    confirmText: '去登录',
    success: (r) => {
      if (r.confirm) goLogin();
    },
  });
}

function goLogin() {
  if (store.isLoggedIn) return;
  uni.navigateTo({ url: '/pages/login/login' });
}

/** 返回上一页（tab 页无页面栈，直接回首页） */
function goBack() {
  if (getCurrentPages().length > 1) uni.navigateBack();
  else uni.switchTab({ url: '/pages/index/index' });
}

onLoad(() => {
  loadList();
});

onShow(() => {
  store.restore();
  loadList();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #efe9da;
  padding-bottom: 40rpx;
}
.hero {
  background: linear-gradient(135deg, #1a1a2e, #2c2c54);
  padding: 96rpx 40rpx 50rpx;
  position: relative;
  text-align: center;
}
.hero-back {
  position: absolute;
  top: 30rpx;
  left: 24rpx;
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);
  font-size: 26rpx;
}
.hero-title {
  color: #c9a96e;
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
  font-family: 'KaiTi', 'STKaiti', serif;
}
.hero-sub {
  color: rgba(255, 255, 255, 0.7);
  font-size: 24rpx;
  margin-top: 12rpx;
}
.card {
  background: #fffdf7;
  border-radius: 20rpx;
  padding: 30rpx;
  margin: 24rpx 30rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(26, 26, 46, 0.06);
}
.progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.progress-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #3a3226;
}
.progress-num {
  font-size: 28rpx;
  color: #5b6b52;
  font-weight: 600;
}
.progress-bar {
  height: 16rpx;
  background: #efe9d8;
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 26rpx;
}
.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #5b6b52, #c9a96e);
  border-radius: 8rpx;
  transition: width 0.4s ease;
}
.progress-actions {
  display: flex;
}
.btn {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.btn.primary {
  background: linear-gradient(135deg, #5b6b52, #3f4d38);
  color: #fdfaf2;
}
.btn.disabled {
  opacity: 0.6;
}
.guest-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
}
.guest-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #3a3226;
}
.guest-desc {
  font-size: 24rpx;
  color: #8a7f6a;
  text-align: center;
  line-height: 1.6;
}
.guest-tip .btn {
  margin-top: 10rpx;
}
.filter-row {
  display: flex;
  gap: 16rpx;
  padding: 26rpx 30rpx 6rpx;
}
.filter-opt {
  padding: 10rpx 34rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #8a7f6a;
  background: #fffdf7;
}
.filter-opt.active {
  background: #5b6b52;
  color: #fdfaf2;
  font-weight: 600;
}

/* 目录书页 */
.toc-book {
  margin: 20rpx 30rpx;
  background: linear-gradient(180deg, #fffdf7 0%, #faf5e8 100%);
  border-radius: 14rpx;
  border: 1rpx solid #e5dcc4;
  box-shadow: 0 6rpx 24rpx rgba(26, 26, 46, 0.08), inset 0 0 60rpx rgba(201, 169, 110, 0.06);
  padding: 36rpx 26rpx;
  position: relative;
}
.toc-book::before {
  content: '';
  position: absolute;
  top: 14rpx;
  left: 14rpx;
  right: 14rpx;
  bottom: 14rpx;
  border: 1rpx dashed rgba(201, 169, 110, 0.45);
  border-radius: 8rpx;
  pointer-events: none;
}
.toc-title {
  text-align: center;
  font-size: 36rpx;
  font-weight: 700;
  letter-spacing: 16rpx;
  color: #8a6d3b;
  font-family: 'KaiTi', 'STKaiti', serif;
  margin-bottom: 28rpx;
}
.toc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}
.toc-cell {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  border: 1rpx solid #e5dcc4;
  border-radius: 10rpx;
  padding: 16rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.toc-cell.studied {
  background: #f2f4ea;
  border-color: rgba(91, 107, 82, 0.5);
}
.toc-cell.locked {
  opacity: 0.55;
}
.toc-no {
  font-size: 22rpx;
  color: #b3a88f;
}
.toc-name {
  font-size: 27rpx;
  font-weight: 600;
  color: #3a3226;
  font-family: 'KaiTi', 'STKaiti', serif;
  margin-top: 4rpx;
}
.toc-done {
  position: absolute;
  top: 6rpx;
  right: 10rpx;
  color: #5b6b52;
  font-size: 22rpx;
  font-weight: 700;
}
.toc-lock {
  position: absolute;
  top: 6rpx;
  right: 10rpx;
  font-size: 18rpx;
}

/* ============ 读书页 ============ */
.reader {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: #e8e0cd;
  display: flex;
  flex-direction: column;
}
.reader-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 24rpx 12rpx;
}
.rt-btn {
  padding: 10rpx 26rpx;
  border-radius: 30rpx;
  background: rgba(26, 26, 46, 0.08);
  color: #5a5245;
  font-size: 24rpx;
}
.rt-btn.done {
  color: #5b6b52;
  font-weight: 600;
}
.rt-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #3a3226;
  font-family: 'KaiTi', 'STKaiti', serif;
  max-width: 420rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.book-swiper {
  flex: 1;
  height: 0;
}
.book-page {
  height: 100%;
  box-sizing: border-box;
  padding: 12rpx 26rpx 0;
}
.page-inner {
  min-height: calc(100% - 60rpx);
  background: linear-gradient(180deg, #fffdf7 0%, #fbf6ea 100%);
  border: 1rpx solid #d9cfb4;
  border-radius: 10rpx;
  box-shadow: 0 8rpx 30rpx rgba(26, 26, 46, 0.12), inset 0 0 80rpx rgba(201, 169, 110, 0.07);
  padding: 44rpx 36rpx 30rpx;
  position: relative;
}
.page-inner::before {
  content: '';
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  right: 12rpx;
  bottom: 12rpx;
  border: 1rpx dashed rgba(201, 169, 110, 0.4);
  border-radius: 6rpx;
  pointer-events: none;
}
.page-footer {
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pf-num {
  font-size: 22rpx;
  color: #b3a88f;
  letter-spacing: 2rpx;
}

/* 封面页 */
.tp-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0 80rpx;
}
.tp-ornament {
  font-size: 64rpx;
  color: #c9a96e;
  margin-bottom: 40rpx;
}
.tp-no {
  font-size: 28rpx;
  color: #8a7f6a;
  letter-spacing: 8rpx;
}
.tp-title {
  font-size: 56rpx;
  font-weight: 700;
  color: #3a3226;
  font-family: 'KaiTi', 'STKaiti', serif;
  margin: 20rpx 0 24rpx;
  letter-spacing: 6rpx;
  text-align: center;
}
.tp-source {
  font-size: 24rpx;
  color: #b3a88f;
}
.tp-divider {
  width: 160rpx;
  border-top: 2rpx solid rgba(201, 169, 110, 0.6);
  margin: 44rpx 0;
}
.tp-hint {
  font-size: 22rpx;
  color: #b3a88f;
}
.tp-studied {
  margin-top: 30rpx;
  color: #5b6b52;
  font-size: 26rpx;
  font-weight: 600;
}

/* 段落页 */
.pg-label {
  text-align: center;
  margin-bottom: 28rpx;
}
.pg-label-text {
  font-size: 26rpx;
  color: #8a6d3b;
  letter-spacing: 8rpx;
  font-family: 'KaiTi', 'STKaiti', serif;
  border-bottom: 1rpx solid rgba(201, 169, 110, 0.5);
  padding-bottom: 8rpx;
}
.original-body {
  display: flex;
  flex-wrap: wrap;
}
.sentence {
  font-size: 34rpx;
  line-height: 2.1;
  color: #3a3226;
  font-family: 'KaiTi', 'STKaiti', serif;
  letter-spacing: 2rpx;
}
.sentence.marked {
  background: linear-gradient(180deg, transparent 40%, rgba(201, 169, 110, 0.5) 40%);
  border-radius: 4rpx;
}
.para {
  font-size: 30rpx;
  line-height: 2;
  color: #4a4238;
  white-space: pre-wrap;
}
.para.phonetic {
  font-size: 26rpx;
  color: #8a7f6a;
}
.pg-actions {
  margin-top: 36rpx;
  display: flex;
  justify-content: flex-end;
}
.mini-btn {
  font-size: 22rpx;
  color: #8a6d3b;
  border: 1rpx solid rgba(201, 169, 110, 0.6);
  border-radius: 26rpx;
  padding: 8rpx 24rpx;
  background: rgba(255, 255, 255, 0.6);
}

/* 注解 */
.ann {
  margin-bottom: 26rpx;
}
.ann-sentence {
  display: block;
  font-size: calc(var(--fs-main, 36rpx) - 4rpx);
  color: #3a3226;
  font-weight: 600;
  font-family: 'KaiTi', 'STKaiti', serif;
  margin-bottom: 14rpx;
  line-height: 1.8;
}
.ann-item {
  display: block;
  font-size: calc(var(--fs-main, 36rpx) - 8rpx);
  color: #7a7264;
  line-height: 1.9;
  padding-left: 16rpx;
  margin-bottom: 10rpx;
}
.ann-item-type {
  color: #8a6d3b;
  font-weight: 600;
}
.ann-item-type.wang {
  color: #5b6b52;
}

/* 概念逻辑图 */
.concept-img {
  width: 100%;
  border-radius: 10rpx;
  border: 1rpx solid #e5dcc4;
  background: #fff;
  margin-bottom: 16rpx;
}
.img-hint {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: #b3a88f;
}

/* 笔记页 */
.notes-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  color: #b3a88f;
  font-size: 26rpx;
  padding: 60rpx 0;
}
.notes-empty-sub {
  font-size: 22rpx;
}
.note-item {
  background: rgba(255, 255, 255, 0.75);
  border: 1rpx solid #e5dcc4;
  border-left: 6rpx solid #c9a96e;
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 18rpx;
}
.note-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.note-sec {
  font-size: 22rpx;
  color: #8a6d3b;
}
.note-del {
  font-size: 24rpx;
  color: #c0392b;
  padding: 0 10rpx;
}
.note-quote {
  display: block;
  font-size: 25rpx;
  color: #8a6d3b;
  font-family: 'KaiTi', 'STKaiti', serif;
  margin-bottom: 6rpx;
}
.note-content {
  display: block;
  font-size: 26rpx;
  color: #4a4238;
  line-height: 1.8;
  white-space: pre-wrap;
}
.add-note-btn {
  text-align: center;
  color: #8a6d3b;
  font-size: 26rpx;
  border: 1rpx dashed rgba(201, 169, 110, 0.7);
  border-radius: 30rpx;
  padding: 16rpx 0;
  margin-top: 20rpx;
}

/* 卷终页 */
.end-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0 60rpx;
}
.end-text {
  font-size: 40rpx;
  color: #3a3226;
  font-family: 'KaiTi', 'STKaiti', serif;
  letter-spacing: 6rpx;
  margin: 30rpx 0 60rpx;
}
.end-btn {
  width: 70%;
}
.end-nav {
  display: flex;
  gap: 30rpx;
  margin-top: 50rpx;
}
.end-nav-btn {
  padding: 16rpx 50rpx;
  border-radius: 34rpx;
  background: rgba(26, 26, 46, 0.08);
  color: #5a5245;
  font-size: 26rpx;
}
.end-nav-btn.disabled {
  opacity: 0.4;
}

/* 底部翻页 */
.reader-bottom {
  display: flex;
  align-items: center;
  padding: 16rpx 26rpx 30rpx;
}
.pg-btn {
  padding: 14rpx 34rpx;
  border-radius: 34rpx;
  background: rgba(26, 26, 46, 0.08);
  color: #5a5245;
  font-size: 26rpx;
}
.pg-btn.disabled {
  opacity: 0.35;
}
.pg-indicator {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #8a7f6a;
  letter-spacing: 2rpx;
}

/* 笔记弹层 */
.note-mask {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 46, 0.5);
  z-index: 900;
  display: flex;
  align-items: flex-end;
}
.note-panel {
  width: 100%;
  background: #fffdf7;
  border-radius: 26rpx 26rpx 0 0;
  padding: 34rpx 34rpx calc(34rpx + env(safe-area-inset-bottom));
}
.note-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.note-panel-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #3a3226;
}
.note-panel-close {
  font-size: 28rpx;
  color: #8a7f6a;
  padding: 6rpx 12rpx;
}
.note-panel-quote {
  display: block;
  font-size: 25rpx;
  color: #8a6d3b;
  font-family: 'KaiTi', 'STKaiti', serif;
  background: rgba(201, 169, 110, 0.12);
  border-radius: 8rpx;
  padding: 14rpx 18rpx;
  margin-bottom: 18rpx;
}
.note-input {
  width: 100%;
  height: 220rpx;
  background: #f7f2e4;
  border-radius: 14rpx;
  padding: 20rpx;
  font-size: 27rpx;
  color: #3a3226;
  margin-bottom: 22rpx;
  box-sizing: border-box;
}
</style>
