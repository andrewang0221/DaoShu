/** 增长引擎 — 16 型道系人格测试 + 箴言卡数据（V2.0 新增模块） */

export interface DaoxiQuestion {
  id: string;
  dimension: string;
  text: string;
  options: { label: string; score: number }[];
}

export interface DaoxiPersona {
  code: string; // 如 dao-yang
  dimension: string;
  mode: 'yang' | 'yin'; // 显 / 隐
  title: string;
  judge: string; // 判词
  desc: string;
  shareText: string; // 分享文案
  shareColor: string; // 卡片主色
  tagLine: string;
}

/** 8 维度题库（每题 0-2 分；总分 >=10 为"显"，<10 为"隐"） */
export const DAOXI_QUESTIONS: DaoxiQuestion[] = [
  {
    id: 'd_dao', dimension: 'dao',
    text: '面对一个大问题，你首先会？',
    options: [
      { label: '先把事情的本质和规律想清楚', score: 2 },
      { label: '边动手边修正，边做边悟', score: 1 },
      { label: '直接套用现成的打法', score: 0 },
    ],
  },
  {
    id: 'd_de', dimension: 'de',
    text: '帮助别人之后，你通常？',
    options: [
      { label: '转身就忘，不放在心上', score: 2 },
      { label: '记得做过，但不会主动提起', score: 1 },
      { label: '希望对方知道并记得', score: 0 },
    ],
  },
  {
    id: 'd_wuwei', dimension: 'wuwei',
    text: '你带团队或带项目时更像是？',
    options: [
      { label: '定好规则，放手让大家自己长', score: 2 },
      { label: '关键节点把关，平时少管', score: 1 },
      { label: '事必躬亲，全程盯着', score: 0 },
    ],
  },
  {
    id: 'd_rou', dimension: 'rou',
    text: '遇到硬碰硬的场合，你的本能是？',
    options: [
      { label: '先软下来，寻找更宽的路径', score: 2 },
      { label: '适度后退，给自己留余地', score: 1 },
      { label: '顶上去，不能输气势', score: 0 },
    ],
  },
  {
    id: 'd_jing', dimension: 'jing',
    text: '你的能量补给方式更接近？',
    options: [
      { label: '独处、静坐、放空', score: 2 },
      { label: '读书、散步、低刺激活动', score: 1 },
      { label: '热闹、美食、高强度娱乐', score: 0 },
    ],
  },
  {
    id: 'd_pu', dimension: 'pu',
    text: '你的生活状态更偏向？',
    options: [
      { label: '简朴少物，东西够用就好', score: 2 },
      { label: '适度拥有，不刻意也不放纵', score: 1 },
      { label: '追求体验升级，好物让人开心', score: 0 },
    ],
  },
  {
    id: 'd_zhizu', dimension: 'zhizu',
    text: '看到同龄人跑得比你快，你会？',
    options: [
      { label: '没什么波动，各人有各人的时区', score: 2 },
      { label: '有点触动，但很快回到自己的节奏', score: 1 },
      { label: '不自觉比较，心生焦躁', score: 0 },
    ],
  },
  {
    id: 'd_ziran', dimension: 'ziran',
    text: '计划被打乱时，你的反应是？',
    options: [
      { label: '顺势调整，变化本来就在意料中', score: 2 },
      { label: '重新排一下，接受小偏差', score: 1 },
      { label: '很别扭，必须按原计划走', score: 0 },
    ],
  },
];

export const DAOXI_DIMENSION_LABELS: Record<string, string> = {
  dao: '道', de: '德', wuwei: '无为', rou: '柔', jing: '静', pu: '朴', zhizu: '知足', ziran: '自然',
};

/** 16 型人格：8 主型（得分最高维度）× 显隐（总分 >=10 显 / <10 隐） */
export const DAOXI_PERSONAS: DaoxiPersona[] = [
  {
    code: 'dao-yang', dimension: 'dao', mode: 'yang', title: '执道明心型',
    judge: '先见规律，后行其道',
    desc: '你习惯先触摸事物的根本规律再行动，重逻辑、重本质，不轻易被表象带走。',
    shareText: '我测出是「执道明心型」——先见规律，后行其道。你的道系人格是什么？',
    shareColor: '#3B4E63', tagLine: '道 · 明理之枢',
  },
  {
    code: 'dao-yin', dimension: 'dao', mode: 'yin', title: '问道笃行型',
    judge: '边行边问，以行悟道',
    desc: '你不急于定义规律，更相信在行动中逐步呈现答案，践行即修行。',
    shareText: '我测出是「问道笃行型」——边行边问，以行悟道。来测测你的道系人格？',
    shareColor: '#4A5D73', tagLine: '道 · 笃行之路',
  },
  {
    code: 'de-yang', dimension: 'de', mode: 'yang', title: '厚德载物型',
    judge: '成事而不居功',
    desc: '你乐于助人却从不邀功，像大地一样承载，是你天然的亲和力来源。',
    shareText: '我测出是「厚德载物型」——成事而不居功。你的道系人格是什么？',
    shareColor: '#8A6D3B', tagLine: '德 · 承载之基',
  },
  {
    code: 'de-yin', dimension: 'de', mode: 'yin', title: '润物无声型',
    judge: '帮忙于无形之中',
    desc: '你的好出手常常不为人知，春风化雨，事情就成了。',
    shareText: '我测出是「润物无声型」——帮忙于无形之中。来测测你的道系人格？',
    shareColor: '#7A8A5A', tagLine: '德 · 无言之行',
  },
  {
    code: 'wuwei-yang', dimension: 'wuwei', mode: 'yang', title: '无为而治型',
    judge: '善治者，不见其治',
    desc: '你深谙"少管反而成事"，把空间给人，让系统自己生长。天生的管理者气质。',
    shareText: '我测出是「无为而治型」——善治者，不见其治。你的道系人格是什么？',
    shareColor: '#3B6E5E', tagLine: '无为 · 成事之要',
  },
  {
    code: 'wuwei-yin', dimension: 'wuwei', mode: 'yin', title: '藏锋守拙型',
    judge: '锋芒内敛，静待其成',
    desc: '你有实力却习惯收敛，不争先、不显摆，把劲儿留到关键处。',
    shareText: '我测出是「藏锋守拙型」——锋芒内敛，静待其成。来测测你的道系人格？',
    shareColor: '#4A5D73', tagLine: '无为 · 藏器之能',
  },
  {
    code: 'rou-yang', dimension: 'rou', mode: 'yang', title: '上善若水型',
    judge: '至柔之利，能穿金石',
    desc: '你用柔软化解刚硬，在冲突里找到第三条路，是团队的润滑剂与稳定器。',
    shareText: '我测出是「上善若水型」——至柔之利，能穿金石。你的道系人格是什么？',
    shareColor: '#2F6FA3', tagLine: '柔 · 不争之胜',
  },
  {
    code: 'rou-yin', dimension: 'rou', mode: 'yin', title: '绵柔致远型',
    judge: '不烈不争，细水长流',
    desc: '你的力量不在于爆发而在于持续，温和却从不缺席，走得最远。',
    shareText: '我测出是「绵柔致远型」——不烈不争，细水长流。来测测你的道系人格？',
    shareColor: '#3A7CA5', tagLine: '柔 · 长久之道',
  },
  {
    code: 'jing-yang', dimension: 'jing', mode: 'yang', title: '守静笃定型',
    judge: '静能生慧，定能应万变',
    desc: '你享受独处与安静，在静止中恢复能量，也在静止中看清全局。',
    shareText: '我测出是「守静笃定型」——静能生慧，定能应万变。你的道系人格是什么？',
    shareColor: '#5A4A6E', tagLine: '静 · 观照之根',
  },
  {
    code: 'jing-yin', dimension: 'jing', mode: 'yin', title: '致虚归静型',
    judge: '内心有一片不被打扰的山谷',
    desc: '你未必刻意冥想，但总能在热闹中给自己留出一个安静的房间。',
    shareText: '我测出是「致虚归静型」——内心有一片不被打扰的山谷。来测测你的道系人格？',
    shareColor: '#6E5A7A', tagLine: '静 · 内守之庐',
  },
  {
    code: 'pu-yang', dimension: 'pu', mode: 'yang', title: '见素抱朴型',
    judge: '少而精，简而美',
    desc: '你主动选择简单：少物、少事、少欲望，把生活过成清晰的线条。',
    shareText: '我测出是「见素抱朴型」——少而精，简而美。你的道系人格是什么？',
    shareColor: '#7A6E4A', tagLine: '朴 · 简素之义',
  },
  {
    code: 'pu-yin', dimension: 'pu', mode: 'yin', title: '返璞归真型',
    judge: '越简单，越接近自己',
    desc: '你在复杂里待久了会自动"卸载"，回到本真，那是你的充电方式。',
    shareText: '我测出是「返璞归真型」——越简单，越接近自己。来测测你的道系人格？',
    shareColor: '#6E7A5A', tagLine: '朴 · 归真之途',
  },
  {
    code: 'zhizu-yang', dimension: 'zhizu', mode: 'yang', title: '知足常乐型',
    judge: '知道什么够，便不匮乏',
    desc: '你有天生的"够用感"，别人追逐，你坐看云起，幸福感反而常驻。',
    shareText: '我测出是「知足常乐型」——知道什么够，便不匮乏。你的道系人格是什么？',
    shareColor: '#8A7A3B', tagLine: '知足 · 富足之源',
  },
  {
    code: 'zhizu-yin', dimension: 'zhizu', mode: 'yin', title: '知止内观型',
    judge: '懂得何时停，比懂得何时冲更难得',
    desc: '你未必天生淡泊，但总能在欲望升起时看见它，并选择停一停。',
    shareText: '我测出是「知止内观型」——懂得何时停，比懂得何时冲更难得。来测测你的道系人格？',
    shareColor: '#7A8A4A', tagLine: '知足 · 知止之智',
  },
  {
    code: 'ziran-yang', dimension: 'ziran', mode: 'yang', title: '道法自然型',
    judge: '顺势而为，不与天争',
    desc: '你拥抱变化，相信万事有自己的节奏，选择比蛮力更早被你看见。',
    shareText: '我测出是「道法自然型」——顺势而为，不与天争。你的道系人格是什么？',
    shareColor: '#4A8A5A', tagLine: '自然 · 顺势之慧',
  },
  {
    code: 'ziran-yin', dimension: 'ziran', mode: 'yin', title: '随缘顺势型',
    judge: '不执着于结果，过程即所得',
    desc: '你未必主动追逐，但总能在变化中找到自己的位置，随遇而安而不随波逐流。',
    shareText: '我测出是「随缘顺势型」——不执着于结果，过程即所得。来测测你的道系人格？',
    shareColor: '#5A8A6E', tagLine: '自然 · 不执之心',
  },
];

/** 邀请文案模板 */
export const INVITE_TEXTS = [
  '我在《道德经》智慧系统里认养了一位专属数字人导师，它记得我的困惑，陪我复盘成长。你也可以 3 分钟认养一位，我们一起共读 81 章。',
  '测了道系人格，我是「{persona}」。如果 2500 年前的老子见到今天的我们，他会说：别慌，一切都在道上。来认养你的数字人导师吧。',
];