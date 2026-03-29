# wechat-illustrator - 公众号配图生成技能

## 概述

分析文章内容，为公众号文章生成或匹配配图。将 `[配图: 描述]` 占位符转换为实际图片URL。

## 触发词

配图, 生成图片, 公众号图片, 文章配图, AI配图

## 功能说明

### 核心能力

1. **占位符识别**：解析 Markdown 文章中的所有 `[配图: 描述]` 标记
2. **Prompt生成**：为每个占位符生成详细的图片生成提示词
3. **图片生成**：调用生图API生成图片（支持 DALL-E 3、Midjourney、国内模型等）
4. **图库匹配**（备选）：从 Unsplash、Pexels 等免费图库搜索匹配图片

### 输入要求

- Markdown 格式的文章内容
- 包含 `[配图: 描述]` 格式的占位符

### 输出格式

```json
{
  "images": [
    {
      "index": 1,
      "placeholder": "[配图: 科技感的办公室，程序员使用AI工具工作]",
      "prompt": "Modern tech office, programmer working with AI tools, clean minimalist style, warm lighting, 16:9 aspect ratio, no text",
      "url": "https://generated-image-url.com/xxx.jpg",
      "source": "dalle3"
    },
    {
      "index": 2,
      "placeholder": "[配图: 工具对比表格图]",
      "prompt": "Comparison chart, software tools icons, clean data visualization, blue and white color scheme, 16:9",
      "url": "https://generated-image-url.com/yyy.jpg",
      "source": "dalle3"
    }
  ],
  "total": 2
}
```

## Prompt 生成要求

### 风格定义

根据文章基调确定图片风格：
- **科技感**：蓝色为主、几何元素、光效
- **手绘插画**：柔和线条、扁平化、暖色调
- **现代简约**：大量留白、简洁构图
- **商务正式**：专业场景、西装正装

### 技术要求

- 比例：16:9 或 1:1（适合公众号）
- 避免：文字、人脸、敏感内容
- 主体：突出、清晰、构图平衡
- 背景：干净、不过于复杂

### Prompt 模板

```
[风格描述], [主体内容], [场景细节], [光线色彩], [技术参数]
```

示例：
```
Modern minimalist style, young professional working on laptop in bright co-working space, natural window light, blue and white color palette, 16:9 aspect ratio, high quality, no text, no watermark
```

## 图片生成策略

### 优先级

1. **首选**：调用生图API生成
   - DALL-E 3（OpenAI）
   - Midjourney
   - 通义万相
   - 文心一格

2. **备选**：免费图库搜索
   - Unsplash
   - Pexels
   - Pixabay

### 生成参数

- 尺寸：公众号封面 900x383（2.35:1），文章配图 1080x608（16:9）或 1080x1080（1:1）
- 格式：JPEG/PNG
- 质量：高

## 保存输出

生成的图片保存到：
```
output/
├── images/
│   ├── image_001.jpg
│   └── image_002.jpg
└── image_manifest.json   # 图片索引文件
```

## 使用示例

**输入文章片段**：
```markdown
## 为什么程序员需要AI助手？

当你还在为某个Bug抓耳挠腮时，AI已经能在几秒内给出解决方案...

[配图: 程序员面对屏幕，露出惊喜表情]
```

**处理结果**：
```json
{
  "index": 1,
  "placeholder": "[配图: 程序员面对屏幕，露出惊喜表情]",
  "prompt": "Programmer sitting in front of computer screen with amazed and delighted expression, looking at AI-generated code suggestion, modern tech office, warm lighting, blue ambient light, 16:9, high quality, no text",
  "url": "https://example.com/images/programmer_ai.jpg",
  "source": "dalle3"
}
```

## 错误处理

1. **生图失败**：自动切换到图库搜索
2. **API限流**：排队重试，3次后使用备选方案
3. **图片不匹配**：生成多版供选择
