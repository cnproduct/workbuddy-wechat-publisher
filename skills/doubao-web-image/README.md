# Doubao Web Image Generation CLI

基于 Playwright 的豆包 (Doubao) Web 端网页自动化生图工具。
A Playwright-based web automation tool for generating images using Doubao Web.

🔗 **GitHub Repository:** [pjf6568/doubao-web-image](https://github.com/pjf6568/doubao-web-image)

## ⚠️ 免责声明 / Disclaimer

**本项目仅供编程学习、Playwright 自动化测试研究和技术交流使用。**
**This project is for programming learning, Playwright automation testing research, and technical exchange only.**
- 本项目并非豆包官方产品，与字节跳动公司无任何关联。 / This project is not an official Doubao product and is not affiliated with ByteDance.
- 使用本项目产生的任何后果由使用者本人承担。 / The user bears all consequences arising from the use of this project.
- **请勿将本项目用于任何非法、侵权、恶意刷量或商业牟利的场景。** / **Do not use this project for any illegal, infringing, malicious traffic generation, or commercial profit-making purposes.**
- 若因使用本工具导致账号封禁、功能受限或其他损失，作者不承担任何责任。 / The author bears no responsibility for account bans, functional restrictions, or other losses caused by using this tool.
- 请自觉遵守相关平台的用户服务协议及生成内容规范。 / Please consciously abide by the relevant platform's user service agreement and generated content specifications.

---

## 🌟 特性 / Features

- 🤖 **免 API Key (No API Key Required)**：通过 Playwright 模拟浏览器操作，直接复用网页版登录状态。 / Simulates browser operations via Playwright, directly reusing the web version's login status.
- 🖼️ **高清大图下载 (High-Res Image Download)**：自动拦截原生下载链接，获取 >4MB 的无损高分辨率原图，而非缩略图。 / Automatically intercepts native download links to obtain lossless high-resolution original images (>4MB) instead of thumbnails.
- 📏 **比例控制 (Aspect Ratio Control)**：支持通过自然语言参数自动拼接控制图片长宽比（如 `16:9`, `1:1`）。 / Supports controlling the image aspect ratio (e.g., `16:9`, `1:1`) by automatically appending parameters via natural language.
- 🛡️ **验证码自动降级 (Auto-fallback for CAPTCHA)**：默认无头 (Headless) 模式运行，遇到风控拦截时自动弹窗切换到 UI 模式供人工验证。 / Runs in Headless mode by default, automatically popping up the UI mode for manual verification when encountering risk control interception.

![Demo / 演示](./1.png)

## 📦 安装与配置 / Installation & Setup

确保你已经安装了 Node.js (建议 v18+) 和 npm。
Ensure you have Node.js (v18+ recommended) and npm installed.

### 方式一：直接全局安装（推荐） / Method 1: Global Installation (Recommended)

你可以直接通过 npm 从 GitHub 全局安装此工具，安装后可以在任意目录直接使用 `doubao-image` 命令：
You can install this tool globally directly from GitHub via npm. After installation, you can use the `doubao-image` command in any directory:

```bash
npm install -g git+https://github.com/pjf6568/doubao-web-image.git
```
*(注意：首次运行可能需要执行 `npx playwright install chromium` 来安装浏览器内核)*
*(Note: You may need to run `npx playwright install chromium` on the first run to install the browser binary)*

### 方式二：克隆到本地运行 / Method 2: Clone and Run Locally

```bash
# 1. 克隆项目 / Clone the project
git clone https://github.com/pjf6568/doubao-web-image.git
cd doubao-web-image

# 2. 安装项目依赖 / Install dependencies
npm install

# 3. 安装 Playwright 浏览器内核 / Install Playwright browser binary
npx playwright install chromium
```

## 🚀 使用方法 / Usage

如果你使用了**全局安装**，可以将下面所有的 `npx ts-node scripts/main.ts` 替换为简单的 `doubao-image` 命令。
If you used **global installation**, you can replace all `npx ts-node scripts/main.ts` below with the simple `doubao-image` command.

### 1. 首次使用（需手动登录） / 1. First Use (Manual Login Required)
由于项目需要获取你的登录 Cookie，第一次运行**必须带上 `--ui` 参数**以打开可视化浏览器：
Because the project needs to get your login Cookie, the first run **must include the `--ui` parameter** to open the visible browser:

```bash
npx ts-node scripts/main.ts "画一只可爱的猫咪 (Draw a cute cat)" --ui
```
*在弹出的浏览器中完成手机号/验证码登录后，脚本会自动检测到输入框并继续生成图片。登录态会保存在本地的 `~/.doubao-web-session` 目录中，后续无需重复登录。*
*After completing the phone number/CAPTCHA login in the popped-up browser, the script will automatically detect the input box and continue generating the image. The login state will be saved in the local `~/.doubao-web-session` directory, and no repeated login is needed subsequently.*

### 2. 日常生图（后台无头模式） / 2. Daily Image Generation (Headless Mode)
登录成功后，可以直接在后台静默生成并下载图片：
After successful login, you can generate and download images silently in the background:

```bash
npx ts-node scripts/main.ts "一只带有未来科技感的机器狗 (A robotic dog with a futuristic tech vibe)"
```

### 3. 高级参数 / 3. Advanced Parameters

- `--quality=<value>`：图片质量 (Image quality)，可选 `preview`（预览图/preview）或 `original`（原始大图/original大图，默认/default）。
- `--ratio=<value>`：图片比例选择 (Aspect ratio selection)。支持的比例及推荐场景如下 (Supported ratios and recommended scenarios are as follows):
  - `1:1`：正方形头像 / Square avatar
  - `2:3`：社交媒体自拍 / Social media selfie
  - `3:4`：经典比例拍照 / Classic photo ratio
  - `4:3`：文章配图插画 / Article illustration
  - `9:16`：手机壁纸人像 / Mobile wallpaper portrait
  - `16:9`：桌面壁纸风景 / Desktop wallpaper landscape
- `--output=<path>` 或 `--image=<path>`：指定图片下载保存的路径。 / Specify the path to save the downloaded image.
- `--ui`：强制显示浏览器界面（用于重新登录或手动过验证码）。 / Force display the browser interface (used for re-login or manual CAPTCHA verification).

## 🤖 作为 AI Skill 使用 (For AI Assistants)

本项目内置了 `SKILL.md`，非常适合作为大模型（如 Trae 等 AI 助手）的扩展技能。
This project has a built-in `SKILL.md`, making it perfect as an extension skill for large models (like AI assistants such as Trae).

1. **导入技能 (Import Skill)**：AI 助手只需读取项目根目录下的 `SKILL.md` 文件。 / The AI assistant only needs to read the `SKILL.md` file in the project root directory.
2. **自然语言交互 (Natural Language Interaction)**：用户可以直接对 A