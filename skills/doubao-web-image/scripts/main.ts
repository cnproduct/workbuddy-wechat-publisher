#!/usr/bin/env ts-node

import { DoubaoClient } from './doubao-webapi/client';
import * as path from 'path';

async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    // Help menu
    if (args.includes('--help') || args.includes('-h') || args.length === 0) {
        console.log(`
Doubao Web API Image Generation

Usage:
  npx ts-node scripts/main.ts "Your prompt here" [options]

Options:
  --ui                    Show browser window (required for first login)
  --quality=<value>       Image quality: 'preview' or 'original' (default: original)
  --ratio=<value>         Image ratio/resolution (e.g., '16:9', '1:1', '1024x1024')
  --output=<path>         Path to save the generated image (e.g., ./my_cat.png). 
                          If not specified, defaults to 'generated.png' in current directory.
  --image=<path>          Alias for --output
  --help, -h              Show this help menu
        `);
        process.exit(0);
    }

    // 默认开启 headless 模式，除非用户显式指定了 --ui
    const uiFlag = args.includes('--ui');
    const headlessFlag = !uiFlag;
    
    // Check for quality flag (--quality=preview or --quality=original)
    let quality: 'preview' | 'original' = 'original';
    const qualityArg = args.find(arg => arg.startsWith('--quality='));
    if (qualityArg) {
        const val = qualityArg.split('=')[1];
        if (val === 'preview' || val === 'original') {
            quality = val;
        }
    }

    // Check for ratio/resolution flag
    let ratio: string | undefined = undefined;
    const ratioArg = args.find(arg => arg.startsWith('--ratio='));
    if (ratioArg) {
        ratio = ratioArg.split('=')[1];
    }

    // Parse output path
    let outputPath = path.resolve(process.cwd(), 'generated.png');
    const outputArg = args.find(arg => arg.startsWith('--output=') || arg.startsWith('--image='));
    if (outputArg) {
        const val = outputArg.split('=')[1];
        if (val && val.trim().length > 0) {
            outputPath = path.resolve(process.cwd(), val.trim());
        }
    } else {
        // Also check if they used space format e.g. "--output ./file.png"
        const outIndex = args.findIndex(arg => arg === '--output' || arg === '--image');
        if (outIndex !== -1 && outIndex + 1 < args.length && !args[outIndex + 1].startsWith('-')) {
            outputPath = path.resolve(process.cwd(), args[outIndex + 1].trim());
        }
    }

    // Filter out options to get the prompt
    const promptParts = args.filter(arg => !arg.startsWith('-') && args[args.indexOf(arg) - 1] !== '--output' && args[args.indexOf(arg) - 1] !== '--image');
    const prompt = promptParts.join(' ').trim() || '一只可爱的金毛犬';

    let client = new DoubaoClient();
    let imageUrl: string | null = null;
    let needsUiRetry = false;

    try {
        console.log('--- 启动豆包生图客户端 ---');
        // First run
        await client.init(headlessFlag);
        
        console.log(`\n任务: 生成图片 "${prompt}" (质量: ${quality}${ratio ? `, 比例: ${ratio}` : ''})`);
        imageUrl = await client.generateImage({ prompt, quality, ratio });

        if (!imageUrl) {
            if (headlessFlag) {
                console.log('\n⚠️ 未能获取到图片，可能触发了人机验证或网络超时。');
                needsUiRetry = true;
            } else {
                console.log('\n❌ 失败: 无法获取图片链接。');
            }
        }
    } catch (error) {
        console.error('\n❌ 发生致命错误:', error);
        if (headlessFlag) {
            needsUiRetry = true;
        }
    } finally {
        await client.close();
    }

    if (needsUiRetry) {
        console.log('\n=============================================');
        console.log('🔄 正在自动以 UI 模式重启，以便进行手动验证...');
        console.log('💡 如果出现验证码，请在弹出的浏览器中手动完成验证。');
        console.log('=============================================\n');
        
        client = new DoubaoClient();
        try {
            await client.init(false); // Force UI mode
            console.log(`\n任务 (重试): 生成图片 "${prompt}" (质量: ${quality}${ratio ? `, 比例: ${ratio}` : ''})`);
            // 给用户更多时间（比如 120 秒）来手动处理验证码
            imageUrl = await client.generateImage({ prompt, quality, ratio, timeout: 120000 });
            
            if (!imageUrl) {
                console.log('\n❌ 重试失败: 仍无法获取图片链接。');
            }
        } catch (e) {
            console.error('\n❌ UI 模式重试发生错误:', e);
        } finally {
            await client.close();
        }
    }

    if (imageUrl) {
        console.log('\n✅ 成功!');
        console.log('图片链接:', imageUrl);
        
        // Download the image
        const savedPath = await DoubaoClient.downloadImage(imageUrl, outputPath);
        if (savedPath) {
            console.log(`💾 图片已保存至: ${savedPath}`);
        } else {
            console.error('❌ 图片下载失败');
        }
    }
}

main();
