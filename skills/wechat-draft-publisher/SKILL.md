# wechat-draft-publisher - 公众号草稿箱发布技能

## 概述

调用微信公众号API，将HTML文章发布到草稿箱。需用户预先配置AppID和AppSecret。

## 触发词

发布公众号, 草稿箱, 公众号发布, 保存草稿, 微信发布

## 功能说明

### 核心能力

1. **读取HTML**：读取 wechat-html-formatter 生成的HTML文件
2. **提取标题**：从内容中提取文章标题
3. **获取Token**：通过AppID和AppSecret获取access_token
4. **调用API**：调用微信 add_draft 接口发布草稿
5. **返回结果**：返回草稿ID或预览链接

### 输入要求

- HTML 文件路径
- 微信配置信息（AppID, AppSecret）

### 输出格式

```json
{
  "success": true,
  "draft_id": "123456789",
  "preview_url": "https://mp.weixin.qq.com/cgi-bin/draft?action=preview&msg_id=123456789",
  "edit_url": "https://mp.weixin.qq.com/cgi-bin/draft?action=edit&msg_id=123456789",
  "title": "文章标题",
  "message": "文章已成功发布到草稿箱"
}
```

## 微信API调用

### 获取Access Token

```
GET https://api.weixin.qq.com/cgi-bin/token
?grant_type=client_credential
&appid=APPID
&secret=APPSECRET
```

### 发布草稿

```
POST https://api.weixin.qq.com/cgi-bin/draft/add
?access_token=ACCESS_TOKEN

{
    "title": "文章标题",
    "author": "作者名",
    "content": "HTML内容",
    "digest": "摘要",
    "content_source_url": "原文链接",
    "thumb_media_id": "封面图media_id"
}
```

## 配置说明

### 必需配置

```json
{
    "wechat": {
        "app_id": "your_app_id",
        "app_secret": "your_app_secret"
    }
}
```

### 可选配置

```json
{
    "wechat": {
        "app_id": "your_app_id",
        "app_secret": "your_app_secret",
        "default_author": "作者名",
        "default_cover": "封面图media_id"
    }
}
```

## Python脚本说明

### 文件位置

```
wechat-draft-publisher/scripts/publish_draft.py
```

### 主要功能

1. **load_config()**：加载配置文件
2. **get_access_token()**：获取微信access_token
3. **extract_title()**：从HTML中提取标题
4. **add_draft()**：调用API发布草稿
5. **main()**：主函数，协调整个流程

### 使用方法

```bash
python publish_draft.py --html output/formatted_article.html --config config.json
```

### 命令行参数

- `--html`：HTML文件路径（必需）
- `--config`：配置文件路径（必需）
- `--author`：作者名（可选，覆盖配置）
- `--digest`：文章摘要（可选）

## 错误处理

### 常见错误

1. **access_token过期**：自动刷新token
2. **API调用频率限制**：指数退避重试
3. **参数错误**：友好的错误提示
4. **网络问题**：重试机制

### 错误码参考

| 错误码 | 说明 |
|--------|------|
| 40001 | access_token无效 |
| 40013 | appid无效 |
| 41002 | 缺少content参数 |
| 41004 | 缺少secret参数 |
| 44002 | 内容为空 |

## 完整工作流

### 步骤 1：配置准备

1. 在微信公众平台获取AppID和AppSecret
2. 将服务器IP加入白名单
3. 创建配置文件

### 步骤 2：读取内容

1. 读取HTML文件
2. 提取标题、作者、摘要等信息
3. 处理图片（可选：上传封面图获取media_id）

### 步骤 3：发布草稿

1. 获取access_token
2. 调用add_draft API
3. 解析返回结果

### 步骤 4：返回结果

1. 返回草稿ID
2. 提供预览链接
3. 提供编辑链接

## 使用示例

**配置文件 (config.json)**：
```json
{
    "wechat": {
        "app_id": "wx1234567890abcdef",
        "app_secret": "abcdef1234567890abcdef1234567890",
        "default_author": "YourName"
    }
}
```

**执行命令**：
```bash
python scripts/publish_draft.py \
    --html output/formatted_article.html \
    --config config.json
```

**输出结果**：
```
✓ 成功获取access_token
✓ 成功提取文章标题：程序员的新同事：AI辅助编程工具实战指南
✓ 成功发布到草稿箱
✓ 草稿ID：123456789
✓ 预览链接：https://mp.weixin.qq.com/cgi-bin/draft?action=preview&msg_id=123456789
```

## 安全注意事项

1. **保护密钥**：不要将AppSecret提交到代码仓库
2. **环境变量**：建议使用环境变量存储敏感信息
3. **Token缓存**：缓存access_token避免频繁请求
4. **HTTPS**：始终使用HTTPS确保通信安全
