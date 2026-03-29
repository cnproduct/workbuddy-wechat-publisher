import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as https from 'https';

export class DoubaoClient {
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private userDataDir: string;

    constructor() {
        // Store user data in a local folder so login state persists
        this.userDataDir = path.join(os.homedir(), '.doubao-web-session');
        if (!fs.existsSync(this.userDataDir)) {
            fs.mkdirSync(this.userDataDir, { recursive: true });
        }
    }

    /**
     * Initializes the Playwright browser context
     * @param headless - Whether to run the browser in headless mode. 
     *                   Recommend false for the first time to login manually.
     */
    async init(headless: boolean = false) {
        console.log(`[DoubaoClient] Initializing Playwright (headless: ${headless})...`);
        console.log(`[DoubaoClient] User data directory: ${this.userDataDir}`);
        
        this.context = await chromium.launchPersistentContext(this.userDataDir, {
            headless,
            viewport: { width: 1280, height: 800 },
            // Override User-Agent to remove "HeadlessChrome" which is easily detected by ByteDance WAF
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            // Add stealth arguments
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars'
            ]
        });

        const pages = this.context.pages();
        this.page = pages.length > 0 ? pages[0] : (await this.context.newPage());

        console.log('[DoubaoClient] Navigating to Doubao chat...');
        if (!this.page) throw new Error("Failed to create page");
        await this.page.goto('https://www.doubao.com/chat/', { waitUntil: 'domcontentloaded' });
        
        // Wait a few seconds to let the page load and check for login status
        await this.page.waitForTimeout(3000);
        
        // Simple check to see if we're on the login page or a login modal is present
        const url = this.page.url();
        const title = await this.page.title();
        console.log(`[DoubaoClient-Debug] 当前页面 URL: ${url}`);
        console.log(`[DoubaoClient-Debug] 当前页面 Title: ${title}`);
        
        const userAgent = await this.page.evaluate(() => navigator.userAgent);
        console.log(`[DoubaoClient-Debug] 当前 User-Agent: ${userAgent}`);

        const loginTextVisible = await this.page.locator('text="登录/注册"').isVisible().catch(() => false);
        const hasLoginModal = url.includes('login') || loginTextVisible;

        if (hasLoginModal) {
            console.log('\n=============================================');
            console.log('❗️ 需要登录豆包 ❗️');
            
            if (headless) {
                console.error('⚠️ 当前处于无头模式(Headless)，无法进行手动登录。');
                console.error('👉 请运行带 --ui 参数的命令进行首次登录，例如: npx ts-node scripts/main.ts "测试" --ui');
                console.log('=============================================\n');
                throw new Error("Login required but running in headless mode.");
            }
            
            console.log('请在打开的浏览器窗口中完成登录 (支持手机号/验证码等)。');
            console.log('登录成功后，程序将自动检测并继续运行。');
            console.log('=============================================\n');
            
            await this.page.screenshot({ path: 'debug-login-state.png' });
            console.log('[DoubaoClient-Debug] 已保存当前页面截图到 debug-login-state.png (如果处于 headless 模式请查看此图确认状态)');
            
            // Wait indefinitely until the chat input textarea appears
            console.log('[DoubaoClient] 等待用户登录...');
            await this.page.waitForSelector('textarea', { timeout: 0 }); 
            console.log('[DoubaoClient] 检测到输入框，登录成功！继续执行。');
        } else {
            console.log('[DoubaoClient] 已检测到登录状态。');
        }
    }

    /**
     * Generates an image using Doubao Web UI Automation
     * @param options - Prompt and quality settings
     * @returns The generated image URL or null if failed
     */
    async generateImage(options: { prompt: string, quality?: 'preview' | 'original', ratio?: string, timeout?: number }): Promise<string | null> {
        if (!this.page) throw new Error('Client not initialized. Call init() first.');

        const { prompt, quality = 'original', ratio, timeout = 60000 } = options;
        const finalPrompt = ratio ? `${prompt}，图片比例 ${ratio}` : prompt;
        
        console.log(`[DoubaoClient] 正在发送生图请求: ${finalPrompt} (要求质量: ${quality})`);

        try {
            // Find the chat input
            const inputLocator = this.page.locator('textarea').first();
            await inputLocator.waitFor({ state: 'visible', timeout: 10000 });
            
            // Clear existing text and fill the prompt
            await inputLocator.fill('');
            await inputLocator.fill(`帮我生成图片：${finalPrompt}`);
            await this.page.waitForTimeout(500); // short pause

            // 记录当前页面上已有的生成图片数量
            const beforeCount = await this.page.locator('img[src*="flow-imagex-sign"]').count();
            console.log(`[DoubaoClient-Debug] 发送指令前，检测到已有图片数量: ${beforeCount}`);

            // Press enter to send
            await inputLocator.press('Enter');
            console.log('[DoubaoClient] 已发送指令，等待图片生成完成 (预计 10-30 秒)...');

            // 轮询监控 DOM，等待新的图片出现
            let targetUrl: string | null = null;
            let targetImgElement: any = null;
            const startTime = Date.now();
            let pollCount = 0;
            
            while (Date.now() - startTime < timeout) {
                await this.page.waitForTimeout(2000); // 每 2 秒检查一次
                pollCount++;
                
                const currentCount = await this.page.locator('img[src*="flow-imagex-sign"]').count();
                console.log(`[DoubaoClient-Debug] 第 ${pollCount} 次轮询检查, 当前图片数量: ${currentCount}`);
                
                if (currentCount > beforeCount) {
                    const imgLocators = await this.page.locator('img[src*="flow-imagex-sign"]').all();
                    targetImgElement = imgLocators[imgLocators.length - 1];
                    
                    // 等待一会儿让图片加载完成，避免抓到缩略图的旧链接
                    await this.page.waitForTimeout(3000);
                    targetUrl = await targetImgElement.getAttribute('src');
                    break;
                }
            }

            if (targetUrl) {
                if (quality === 'original' && targetImgElement) {
                    console.log(`[DoubaoClient] 检测到缩略图已生成，正在尝试获取原始大图...`);
                    // 模拟点击缩略图以打开原图大图模态框
                    await targetImgElement.click();
                    await this.page.waitForTimeout(3000); // 等待大图模态框加载

                    // 尝试查找下载按钮并拦截下载事件
                    try {
                        // We will also wait for any new response that might be the high res image
                        const downloadPromise = this.page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
                        
                        // 寻找包含“下载”文字的按钮或常见下载图标
                        const buttons = await this.page.locator('div[role="dialog"] svg, div[class*="image-viewer"] svg, svg').all();
                        let clicked = false;
                        for (const svg of buttons) {
                            const html = await svg.evaluate(node => node.outerHTML);
                            // 根据特征判断是否是下载按钮
                            // 豆包的下载图标 SVG path 包含 M19.207 12.707...
                            if (html.includes('download') || html.includes('下载') || html.includes('M19.207 12.707') || html.includes('M2 19C2')) {
                                // try to click it
                                try {
                                    const parentBtn = await svg.evaluateHandle(node => {
                                        let el = node.parentElement;
                                        while(el && el.tagName !== 'BUTTON' && el.getAttribute('role') !== 'button' && el.tagName !== 'DIV') {
                                            el = el.parentElement;
                                        }
                                        return el || node;
                                    });
                                    await parentBtn.asElement()?.click();
                                    clicked = true;
                                    console.log(`[DoubaoClient] 尝试点击下载图标...`);
                                    break;
                                } catch (e) {
                                    // ignore
                                }
                            }
                        }
                    
                    // 另外一种方法：查找具有下载文字的元素
                    if (!clicked) {
                        const textEls = await this.page.locator('text="下载"').all();
                        for (const el of textEls) {
                            if (await el.isVisible()) {
                                await el.click();
                                clicked = true;
                                console.log(`[DoubaoClient] 尝试点击带有"下载"文字的元素...`);
                                break;
                            }
                        }
                    }

                    if (clicked) {
                        console.log(`[DoubaoClient] 等待下载事件触发或大图加载...`);
                        const download = await downloadPromise;
                        if (download) {
                            const downloadUrl = download.url();
                            console.log(`[DoubaoClient] 成功拦截到原生下载链接: ${downloadUrl}`);
                            return downloadUrl;
                        } else {
                            console.log(`[DoubaoClient] 未能拦截到下载事件，继续提取页面大图...`);
                            // Wait a bit more for the DOM to update with high-res image
                            await this.page.waitForTimeout(2000);
                        }
                    } else {
                        console.log(`[DoubaoClient] 未找到明确的下载按钮，尝试提取无损 URL...`);
                    }
                } catch (e) {
                    console.log(`[DoubaoClient] 拦截下载失败: ${e}`);
                }
                    
                    // 查找模态框中新的、可能没有 downsize 后缀的大图
                    const modalImages = await this.page.locator('img[src*="flow-imagex-sign"]').all();
                    let bestUrl = null;
                    for (const img of modalImages) {
                        const src = await img.getAttribute('src');
                        if (src) {
                            // 优先寻找包含 image_pre_watermark 的高分辨率图
                            if (src.includes('image_pre_watermark')) {
                                console.log(`[DoubaoClient] 成功获取原始大图 URL (image_pre_watermark)`);
                                return src;
                            }
                            // 排出一些干扰项（例如活动 banner 等）
                            if (!src.includes('downsize') && !src.includes('web-operation') && !src.includes('avatar')) {
                                bestUrl = src;
                            }
                        }
                    }
                    if (bestUrl) {
                        console.log(`[DoubaoClient] 成功获取无损大图 URL`);
                        return bestUrl;
                    }
                } else {
                    console.log(`[DoubaoClient] 成功从页面获取预览图片 URL`);
                }
                
                return targetUrl;
            } else {
                console.warn('[DoubaoClient] ⚠️ 等待图片超时，未能获取到图片 URL。');
                await this.page.screenshot({ path: 'debug-timeout.png', fullPage: true });
                const html = await this.page.content();
                fs.writeFileSync('debug-page.html', html);
                console.log('[DoubaoClient-Debug] 已保存超时现场截图到 debug-timeout.png 和源码到 debug-page.html');
                return null;
            }
        } catch (error) {
            console.error('[DoubaoClient] 生图过程发生错误:', error);
            if (this.page) {
                await this.page.screenshot({ path: 'debug-error.png', fullPage: true }).catch(() => {});
                console.log('[DoubaoClient-Debug] 已保存报错现场截图到 debug-error.png');
            }
            return null;
        }
    }

    /**
     * Closes the browser context
     */
    async close() {
        if (this.context) {
            await this.context.close();
            console.log('[DoubaoClient] 浏览器已关闭。');
        }
    }

    /**
     * Downloads an image from a URL to a local file
     * @param url - The image URL
     * @param destPath - The local file path to save the image
     * @returns A promise that resolves to the saved file path or null if failed
     */
    static async downloadImage(url: string, destPath: string): Promise<string | null> {
        return new Promise((resolve) => {
            console.log(`[DoubaoClient] 正在下载图片至: ${destPath}`);
            
            // Ensure directory exists
            const dir = path.dirname(destPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const file = fs.createWriteStream(destPath);
            
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    console.error(`[DoubaoClient] 下载失败，HTTP 状态码: ${response.statusCode}`);
                    file.close();
                    fs.unlink(destPath, () => {}); // Delete empty file
                    resolve(null);
                    return;
                }

                response.pipe(file);
                
                file.on('finish', () => {
                    file.close();
                    resolve(destPath);
                });
            }).on('error', (err) => {
                console.error(`[DoubaoClient] 下载发生错误: ${err.message}`);
                file.close();
                fs.unlink(destPath, () => {}); // Delete empty file
                resolve(null);
            });
        });
    }
}
