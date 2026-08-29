/** 疗愈引擎 — 道家情绪调节数据（V2.0 新增模块） */

export interface EmotionDef {
  key: string;
  label: string;
  keywords: string[];
  weight: number; // 1-3 强度系数
  pattern: string; // 对应道家调节模式
}

export interface HealingPattern {
  key: string;
  label: string;
  origin: string; // 出处
  target: string; // 对治的情绪根源
  practice: {
    step: string;
    guidance: string;
  }[];
  quote: string; // 核心箴言
}

/** 情绪识别词库（轻量启发式） */
export const EMOTION_LEXICON: EmotionDef[] = [
  {
    key: 'anxiety',
    label: '焦虑',
    keywords: ['焦虑', '紧张', '害怕', '担心', '慌', '烦', '压力', '睡不着', '心慌', '不安', '恐惧', '放不下'],
    weight: 3,
    pattern: 'wuzhi',
  },
  {
    key: 'anger',
    label: '愤怒',
    keywords: ['生气', '愤怒', '气死', '受不了', '凭什么', '愤怒', '怨恨', '委屈'],
    weight: 2,
    pattern: 'jieyan',
  },
  {
    key: 'sadness',
    label: '悲伤',
    keywords: ['难过', '伤心', '想哭', '失落', '沮丧', '绝望', '没劲', '灰心', '空虚'],
    weight: 3,
    pattern: 'jingsuan',
  },
  {
    key: 'loneliness',
    label: '孤独',
    keywords: ['孤独', '没人懂', '一个人', '寂寞', '被孤立', '无处可说', '想找人说话'],
    weight: 2,
    pattern: 'ziranzhiao',
  },
  {
    key: 'calm',
    label: '平静',
    keywords: ['平静', '还好', '稳定', '放松', '从容', '想通了'],
    weight: 0,
    pattern: 'none',
  },
  {
    key: 'joy',
    label: '喜悦',
    keywords: ['开心', '高兴', '太好了', '喜悦', '满足', '感恩'],
    weight: 0,
    pattern: 'none',
  },
];

/** 高危信号词库 → 触发专业转介 */
export const HIGH_RISK_KEYWORDS = [
  '自杀', '不想活', '自残', '活着没意思', '想死', '伤害自己', '结束生命', '活不下去', '了断',
];

/** 全国心理援助热线（合规兜底） */
export const REFERRAL_TEXT = `我听到你现在非常痛苦，谢谢你愿意把这些告诉我。我无法替代专业的心理支持，但有一些真正能帮到你的人——请立刻拨打【全国统一心理援助热线 12356】（24 小时免费），或联系你信任的人陪伴你。你此刻的感受很重要，值得被认真对待。`;

/** 焦虑急救分步引导（3-5 分钟） */
export const SOS_STEPS = [
  {
    step: '第一步 · 停下来',
    guidance: '先别急着解决问题。跟着我做一个慢呼吸：吸气 4 秒，屏住 4 秒，呼气 6 秒。重复三次。把注意力放到呼吸上，让身体先软下来。',
  },
  {
    step: '第二步 · 命名情绪',
    guidance: '"知人者智，自知者明。"现在试着给这种感觉一个名字：是焦虑、害怕、还是无助？给它命名，它就从"洪水"变成"可指认的浪花"。',
  },
  {
    step: '第三步 · 换个视角',
    guidance: '"反者道之动，弱者道之用。"此刻觉得天大的事，放到一周、一年、十年的尺度上看，它会站在哪个位置？降温后再做决定，通常是对的。',
  },
  {
    step: '第四步 · 最小的下一步',
    guidance: '"图难于其易，为大于其细。"不要求自己解决全部，只做最小的下一步：喝一杯水、把问题写下来、给一个人发消息。做完就够。',
  },
];

/** 四类道家情绪调节练习（原创方法论） */
export const HEALING_PATTERNS: HealingPattern[] = [
  {
    key: 'wuzhi',
    label: '知足不辱 · 欲望管理',
    origin: '《道德经》第四十四章',
    target: '对治"求不得"：目标过高、比较带来的焦虑',
    practice: [
      { step: '清单', guidance: '写下此刻最想要的 3 件事，问自己：哪一件是因为"别人有"才想要？' },
      { step: '降格', guidance: '把最想要的那件，降一格重新设定：从"必须"降为"希望"，焦虑立刻减半。' },
      { step: '记账', guidance: '觉知"拥有的已然够用"的三件小事，写进今日功课。' },
    ],
    quote: '知足者富。——《道德经》第三十三章',
  },
  {
    key: 'jieyan',
    label: '清凉降火 · 情绪降温',
    origin: '《道德经》第四十五章',
    target: '对治"怕失控"：愤怒、冲动、紧绷',
    practice: [
      { step: '抽离', guidance: '把自己想象成旁观者，看此刻愤怒的自己，像看一场戏：戏里在演什么？' },
      { step: '拖延', guidance: '任何冲动性回复/决定，强制拖延 6 小时再执行。"静为躁君"。' },
      { step: '回看', guidance: '情绪平复后回看：当时最放不下的，现在还剩多少分量？' },
    ],
    quote: '静胜躁，寒胜热。清静为天下正。——《道德经》第四十五章',
  },
  {
    key: 'jingsuan',
    label: '致虚守静 · 反刍内耗',
    origin: '《道德经》第十六章',
    target: '对治"反刍内耗"：反复咀嚼过去的悔恨与羞耻',
    practice: [
      { step: '观息', guidance: '闭眼 3 分钟，只数呼吸；念头来了就轻轻放走，不追不评。' },
      { step: '归档', guidance: '把反复出现的念头写成一个段落，然后告诉自己：这件事已归档，今天不再重放。' },
      { step: '换轨', guidance: '给自己一件需要动手的事（画画、走路、做饭），用行动打断思维回环。' },
    ],
    quote: '致虚极，守静笃。——《道德经》第十六章',
  },
  {
    key: 'ziranzhiao',
    label: '自爱如水 · 孤独滋养',
    origin: '《道德经》第二十五章',
    target: '对治"患得患失"：孤独、被忽视、价值感低落',
    practice: [
      { step: '自我陪伴', guidance: '今晚为自己安排一件小事并认真完成，像对待一位重要朋友。' },
      { step: '连接', guidance: '主动给一个可靠的人发一条消息，说一句真实的感受，不求回应。' },
      { step: '定位', guidance: '写下：此刻的孤独里，我还保有哪三样别人拿不走的东西？' },
    ],
    quote: '知人者智，自知者明；胜人者有力，自胜者强。——《道德经》第三十三章',
  },
];

/** 上善若水周报模板 */
export const WEEKLY_REVIEW_TEMPLATE = {
  title: '上善若水 · 每周复盘',
  sections: [
    { key: '情绪潮汐', desc: '本周情绪波动最大的 3 个时刻，分别触发了哪一类"道之痛"（求不得/怕失控/反刍/患得患失）' },
    { key: '浪花与河床', desc: '哪一次情绪，因为换了一个时间尺度（一周/一年/十年）而变小了？' },
    { key: '顺水而行', desc: '本周哪件事做到了"不硬来"反而更好？记录为下周的参考。' },
    { key: '下周水势', desc: '按"知足、静观、自然"三个向度，各定一个小行动。' },
  ],
};