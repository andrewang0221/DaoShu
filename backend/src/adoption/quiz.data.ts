/** 认养价值观初测题库（8 维度，每维度 1 题，MVP 版） */
export interface QuizOption {
  label: string;
  score: number; // 0-2
}
export interface QuizQuestion {
  id: string;
  dimension: string;
  text: string;
  options: QuizOption[];
}
export interface QuizDimension {
  key: string;
  label: string;
}

export const QUIZ_DIMENSIONS: QuizDimension[] = [
  { key: 'dao', label: '道' },
  { key: 'de', label: '德' },
  { key: 'wuwei', label: '无为' },
  { key: 'rou', label: '柔' },
  { key: 'jing', label: '静' },
  { key: 'pu', label: '朴' },
  { key: 'zhizu', label: '知足' },
  { key: 'ziran', label: '自然' },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q_dao',
    dimension: 'dao',
    text: '面对复杂问题时，你更倾向于？',
    options: [
      { label: '先探寻事物本质与规律，再行动', score: 2 },
      { label: '边做边调整，在实践中摸索', score: 1 },
      { label: '参考主流做法，随大流', score: 0 },
    ],
  },
  {
    id: 'q_de',
    dimension: 'de',
    text: '你如何看待"帮助他人"？',
    options: [
      { label: '成事而不居功，如水润物', score: 2 },
      { label: '乐意帮忙，但希望被记得', score: 1 },
      { label: '先谈条件，再考虑付出', score: 0 },
    ],
  },
  {
    id: 'q_wuwei',
    dimension: 'wuwei',
    text: '管理团队/项目时，你的风格是？',
    options: [
      { label: '定好规则后尽量少干预，让成员自主', score: 2 },
      { label: '关键节点亲自把关', score: 1 },
      { label: '事事过问，亲力亲为', score: 0 },
    ],
  },
  {
    id: 'q_rou',
    dimension: 'rou',
    text: '遇到激烈冲突时，你通常？',
    options: [
      { label: '先退一步，以柔化刚', score: 2 },
      { label: '据理力争，但保留余地', score: 1 },
      { label: '针锋相对，寸步不让', score: 0 },
    ],
  },
  {
    id: 'q_jing',
    dimension: 'jing',
    text: '你的独处时间通常用来？',
    options: [
      { label: '静坐冥想，清空思绪', score: 2 },
      { label: '读书学习，充实自己', score: 1 },
      { label: '刷手机、娱乐消遣', score: 0 },
    ],
  },
  {
    id: 'q_pu',
    dimension: 'pu',
    text: '你的生活方式偏向？',
    options: [
      { label: '简单朴素，少物欲', score: 2 },
      { label: '适度消费，量入为出', score: 1 },
      { label: '追求品质与体验升级', score: 0 },
    ],
  },
  {
    id: 'q_zhizu',
    dimension: 'zhizu',
    text: '面对"别人比你强"时，你的心态是？',
    options: [
      { label: '知足常乐，专注自己的节奏', score: 2 },
      { label: '略有压力，但不影响生活', score: 1 },
      { label: '焦虑内耗，急于追赶', score: 0 },
    ],
  },
  {
    id: 'q_ziran',
    dimension: 'ziran',
    text: '制定计划后，你倾向于？',
    options: [
      { label: '顺应变化，不强求结果', score: 2 },
      { label: '基本执行，偶有弹性', score: 1 },
      { label: '严格按计划推进，不容偏差', score: 0 },
    ],
  },
];
