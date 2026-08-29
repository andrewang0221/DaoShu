# 道德经结构化知识库

## 文件
- `taoteching-wsy-2026.json` — 81 章结构化知识库（由 `tools/parse-taoteching.mjs` 从《汪胜岩道德经注解2026.md》生成）

## 重新生成
```bash
node tools/parse-taoteching.mjs
```

## 导入数据库
```bash
DATABASE_URL=postgres://user:pass@localhost:5432/taoteching node tools/import-knowledge.mjs
```

## JSON 结构
```jsonc
{
  "meta": {
    "source": "汪胜岩道德经注解2026.md",
    "baseText": "帛书甲乙本（个别章通行本）",
    "author": "汪胜岩（注解）",
    "compiled": "2026",
    "chapters": 81,
    "generatedAt": "...",
    "warnings": []
  },
  "chapters": [
    {
      "no": 1,                    // 章节号 1-81
      "rawNo": "一",              // 中文序号
      "title": "道可道",          // 自动标题（简体版前3汉字）
      "source": "帛书甲乙本",      // 或 "通行本"（第41章等）
      "chapterNote": "",          // 章首说明（含【整理者按】底本说明）
      "original": "帛书原文\n...", // 含异文标注（甲本作X/乙本作X）
      "simplified": "通行简体字版",
      "phonetics": "恒(héng)→常；...",
      "conceptNotes": "核心概念铺垫（第1章）与章内概念说明",
      "annotations": [            // 逐句注解
        {
          "no": 1,
          "sentence": "道，可道也，非恒道也",
          "items": [
            { "type": "note",      "text": "..." },  // 一般注解
            { "type": "wang",      "text": "【汪按】..." },      // 汪胜岩按语
            { "type": "organizer", "text": "【整理者按】..." },   // 整理者按语
            { "type": "quote",     "text": "..." }   // 引用说明
          ]
        }
      ],
      "summary": "小结（章宗旨）",
      "appendix": null,           // 附加章节（第1章"附论"）
      "images": ["图01_核心概念逻辑总览.png"]
    }
  ]
}
```

## 说明
- 注解文字著作权归汪胜岩所有；《道德经》原文属公有领域。引用时标注出处。
- `images` 字段引用的 PNG 图片未随文本提供，渲染层需单独处理缺失。
