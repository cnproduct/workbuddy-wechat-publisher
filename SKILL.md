# workbuddy-wechat-publisher - 公众号全自动发布技能包

## 概述

这是一个全流程公众号文章自动发布技能包，实现从"写作 -> 配图 -> 排版 -> 发布"的完整自动化工作流。

## 触发词

`公众号发布`, `写公众号`, `发布到公众号`, `公众号文章`, `自动写公众号`, `公众号排版发布`

## 技能包结构

```
workbuddy-wechat-publisher/
├── SKILL.md                              # 主技能（工作流编排）
├── skills/
│   ├── wechat-content-writer/            # 内容生成
│   │   └── SKILL.md
│   ├── wechat-illustrator/               # 配图生成
│   │   └── SKILL.md
│   ├── wechat-html-formatter/            # HTML排版
│   │   └── SKILL.md
│   └── wechat-draft-publisher/           # 草稿发布
│       ├── SKILL.md
│       └── scripts/
│           └── publish_draft.py
└── config/
    └── wechat_config.example.json         # 配置模板
```

## 工作流说明

### 步骤 1：内容生成 (wechat-content-writer)

根据用户指令，撰写符合公众号爆款风格的文章。

**输入**：用户指令（如主题、关键词、写作风格要求）

**输出**：带 `[配图: 描述文字]` 占位符的 Markdown 文章

### 步骤 2：配图生成 (wechat-illustrator)

分析文章内容，在指定位置生成或匹配配图。

**输入**：Markdown 文章

**输出**：图片URL列表，与占位符顺序对应

### 步骤 3：HTML排版 (wechat-html-formatter)

将 Markdown 文章和图片 URL 转换成精美的微信公众号 HTML。

**输入**：Markdown + 图片URL列表

**输出**：可直接粘贴到微信编辑器的 HTML 文件

### 步骤 4：发布草稿 (wechat-draft-publisher)

调用微信公众号API，将文章发布到草稿箱。

**输入**：HTML 文件

**输出**：发布成功的草稿ID/链接

## 使用前提

1. 用户需在微信公众平台配置 `AppID` 和 `AppSecret`
2. 需将服务器IP加入微信白名单
3. 需开通草稿箱权限（需微信认证）

## 依赖技能

- `wechat-content-writer`：文章内容生成
- `wechat-illustrator`：配图生成/匹配
- `wechat-html-formatter`：HTML排版
- `wechat-draft-publisher`：草稿箱发布
