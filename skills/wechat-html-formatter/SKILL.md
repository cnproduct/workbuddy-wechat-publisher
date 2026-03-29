# wechat-html-formatter - 公众号HTML排版技能

## 概述

将 Markdown 文章和图片 URL 转换成精美的微信公众号 HTML。支持一键排版，生成可直接粘贴到微信编辑器的HTML。

## 触发词

公众号排版, HTML排版, 微信排版, 格式化文章, 排版美化

## 功能说明

### 核心能力

1. **Markdown转HTML**：完整支持 Markdown 语法
2. **图片注入**：将图片URL注入HTML `<img>` 标签
3. **样式应用**：应用精美的CSS样式
4. **微信兼容**：确保微信编辑器内预览正常

### 输入要求

- Markdown 格式的文章内容
- JSON 格式的图片URL列表（来自 wechat-illustrator）

### 输出格式

- HTML 文件（可直接保存或复制到微信编辑器）
- 文件保存路径：`output/formatted_article.html`

## CSS 样式规范

### 字体设置

```css
body {
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
    font-size: 16px;
    line-height: 1.8;
    color: #333333;
}
```

### 标题样式

```css
h1 {
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    margin: 20px 0;
    color: #1a1a1a;
}

h2 {
    font-size: 20px;
    font-weight: bold;
    margin: 24px 0 16px;
    padding-left: 12px;
    border-left: 4px solid #007AFF;
    color: #2c2c2c;
}
```

### 段落样式

```css
p {
    margin: 16px 0;
    text-align: justify;
    text-indent: 0;
}
```

### 强调文字

```css
strong, b {
    color: #007AFF;
    font-weight: bold;
}
```

### 引用块

```css
blockquote {
    background: #f5f5f5;
    border-left: 4px solid #007AFF;
    margin: 16px 0;
    padding: 12px 16px;
    font-style: italic;
    color: #666666;
}
```

### 图片样式

```css
img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 20px auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

### 代码块

```css
pre, code {
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-family: "SF Mono", Consolas, monospace;
    font-size: 14px;
}

pre {
    padding: 16px;
    overflow-x: auto;
}
```

### 列表样式

```css
ul, ol {
    margin: 16px 0;
    padding-left: 24px;
}

li {
    margin: 8px 0;
}
```

## 主题配色方案

### 科技蓝（默认）

```css
--primary-color: #007AFF;
--bg-color: #ffffff;
--text-color: #333333;
--muted-color: #666666;
```

### 活力橙

```css
--primary-color: #FF9500;
--bg-color: #ffffff;
--text-color: #333333;
--muted-color: #666666;
```

### 清新绿

```css
--primary-color: #34C759;
--bg-color: #ffffff;
--text-color: #333333;
--muted-color: #666666;
```

### 暗黑模式

```css
--primary-color: #0A84FF;
--bg-color: #1c1c1e;
--text-color: #ffffff;
--muted-color: #8e8e93;
```

## 处理流程

### 步骤 1：解析 Markdown

识别并转换以下元素：
- `#` 标题 → `<h1>`/`<h2>`
- `**加粗**` → `<strong>`
- `*斜体*` → `<em>`
- `> 引用` → `<blockquote>`
- `- 列表` → `<ul>/<li>`
- `` `代码` `` → `<code>`
- `[配图: 描述]` → `<img>`

### 步骤 2：注入图片

读取图片清单，将占位符替换为实际 `<img>` 标签：

```html
<!-- 原始 -->
[配图: 程序员面对屏幕]

<!-- 转换后 -->
<img src="https://example.com/image.jpg" alt="程序员面对屏幕" />
```

### 步骤 3：应用样式

将 CSS 样式内联到 `<head>` 标签中：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        /* CSS 样式 */
    </style>
</head>
<body>
    <!-- 文章内容 -->
</body>
</html>
```

### 步骤 4：兼容性处理

- 移除可能导致微信显示异常的 CSS 属性
- 确保图片链接可访问
- 清理多余的空行和空格

## 使用示例

**输入**：
```markdown
# 标题

> 引用

## 小标题

内容 [配图: 图片描述]
```

**输出 HTML**：
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: ...; line-height: 1.8; ... }
        h1 { font-size: 24px; ... }
        img { max-width: 100%; border-radius: 8px; ... }
    </style>
</head>
<body>
    <h1>标题</h1>
    <blockquote>引用</blockquote>
    <h2>小标题</h2>
    <p>内容</p>
    <img src="https://example.com/image.jpg" alt="图片描述" />
</body>
</html>
```

## 输出文件

- HTML 文件：`output/formatted_article.html`
- 文件编码：UTF-8
- 内容类型：text/html
