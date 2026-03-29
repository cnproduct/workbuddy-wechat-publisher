# workbuddy-wechat-publisher

公众号全自动发布技能包 - 从写作到发布，一键完成。

## 功能概述

当用户给出文章主题或指令时，自动执行"写作 -> 配图 -> 排版 -> 发布"的全流程，最终产出图文并茂、排版美观的公众号文章。

## 技能包结构

```
workbuddy-wechat-publisher/
├── SKILL.md                              # 主技能（工作流编排）
├── README.md                             # 使用说明
├── config/
│   └── wechat_config.example.json        # 配置文件模板
└── skills/
    ├── wechat-content-writer/            # 内容生成
    │   └── SKILL.md
    ├── wechat-illustrator/               # 配图生成
    │   └── SKILL.md
    ├── wechat-html-formatter/            # HTML排版
    │   └── SKILL.md
    └── wechat-draft-publisher/           # 草稿发布
        ├── SKILL.md
        └── scripts/
            └── publish_draft.py
```

## 四个子技能

### 1. wechat-content-writer（内容生成）

**功能**：根据用户指令，撰写符合公众号爆款风格的文章

**触发词**：写公众号文章, 公众号内容, 公众号文案

**输出**：带 `[配图: 描述]` 占位符的 Markdown 文章

### 2. wechat-illustrator（配图生成）

**功能**：分析文章内容，在指定位置生成或匹配配图

**触发词**：配图, 生成图片, 公众号图片

**输出**：图片URL列表

### 3. wechat-html-formatter（HTML排版）

**功能**：将 Markdown 转换为精美的微信公众号 HTML

**触发词**：公众号排版, HTML排版, 微信排版

**输出**：可直接粘贴到微信编辑器的 HTML 文件

### 4. wechat-draft-publisher（草稿发布）

**功能**：调用微信公众号API，发布文章到草稿箱

**触发词**：发布公众号, 草稿箱, 公众号发布

**输出**：草稿ID和预览链接

## 使用前提

1. **微信公众平台配置**
   - 在微信公众平台获取 `AppID` 和 `AppSecret`
   - 将服务器IP加入微信白名单
   - 需开通草稿箱权限（需微信认证）

2. **安装依赖**（Python脚本）
   ```bash
   pip install requests
   ```

## 快速开始

### 步骤 1：配置微信参数

复制配置文件并填入你的微信信息：

```bash
cp config/wechat_config.example.json config/wechat_config.json
```

编辑 `wechat_config.json`：

```json
{
    "wechat": {
        "app_id": "你的AppID",
        "app_secret": "你的AppSecret",
        "default_author": "你的名字"
    }
}
```

### 步骤 2：使用技能

**方式一：完整工作流（推荐）**

```
用户：写一篇关于AI编程助手的文章

→ wechat-content-writer 生成文章
→ wechat-illustrator 生成配图
→ wechat-html-formatter 排版
→ wechat-draft-publisher 发布到草稿箱
```

**方式二：单独使用子技能**

```
用户：帮我写一篇公众号文章关于xxx
→ 仅调用 wechat-content-writer

用户：帮我给这篇文章配图
→ 仅调用 wechat-illustrator

用户：帮我排版这个文章
→ 仅调用 wechat-html-formatter

用户：帮我发布到公众号草稿箱
→ 仅调用 wechat-draft-publisher
```

### 步骤 3：查看结果

发布成功后，返回以下信息：
- 草稿ID
- 预览链接
- 编辑链接

## 工作流串联

### 主控工作流（AGENT模式）

```
1. 触发：用户输入指令
   ↓
2. 调用 wechat-content-writer
   输入：用户指令（主题、风格、长度）
   输出：Markdown文章（含配图占位符）
   ↓
3. 调用 wechat-illustrator
   输入：Markdown文章
   输出：图片URL列表
   ↓
4. 调用 wechat-html-formatter
   输入：Markdown + 图片URL
   输出：HTML文件
   ↓
5. 调用 wechat-draft-publisher
   输入：HTML文件 + 配置文件
   输出：草稿ID + 预览链接
   ↓
6. 反馈：向用户返回成功消息
```

### 代码调用示例

```python
# 伪代码：串联调用四个技能
def publish_wechat_article(topic, user_config):
    # Step 1: 生成内容
    content = call_skill("wechat-content-writer", {"topic": topic})
    
    # Step 2: 生成配图
    images = call_skill("wechat-illustrator", {"content": content})
    
    # Step 3: 排版
    html = call_skill("wechat-html-formatter", {
        "content": content,
        "images": images
    })
    
    # Step 4: 发布
    result = call_skill("wechat-draft-publisher", {
        "html": html,
        "config": user_config
    })
    
    return result
```

## 样式主题

HTML排版支持多种主题配色：

### 科技蓝（默认）
```css
--primary-color: #007AFF;
```

### 活力橙
```css
--primary-color: #FF9500;
```

### 清新绿
```css
--primary-color: #34C759;
```

## 常见问题

### Q1: 配图如何生成？

当前支持两种方式：
1. **API生成**：调用 DALL-E、Midjourney 等生图API
2. **图库匹配**：从 Unsplash、Pexels 等免费图库搜索

### Q2: 发布到草稿箱需要什么权限？

- 需要微信认证（订阅号或服务号）
- 需要在公众平台配置IP白名单
- 需要有草稿箱创建权限

### Q3: 如何自定义样式？

修改 `wechat-html-formatter/SKILL.md` 中的 CSS 部分即可。

### Q4: 图片比例？

- 封面图：900x383（2.35:1）
- 文章配图：1080x608（16:9）或 1080x1080（1:1）

## 更新日志

### v1.0.0
- 初始版本
- 四个子技能完成
- 完整工作流支持
