#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信公众号草稿箱发布脚本
功能：读取HTML文件，调用微信API发布到草稿箱
"""

import json
import os
import sys
import argparse
import requests
import re
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

# 微信API基础URL
WECHAT_API_BASE = "https://api.weixin.qq.com/cgi-bin"


class WeChatPublisher:
    """微信公众号草稿箱发布类"""
    
    def __init__(self, config_path: str):
        """初始化发布器"""
        self.config = self._load_config(config_path)
        self.app_id = self.config.get("wechat", {}).get("app_id")
        self.app_secret = self.config.get("wechat", {}).get("app_secret")
        self.default_author = self.config.get("wechat", {}).get("default_author", "")
        self.default_cover = self.config.get("wechat", {}).get("default_cover", "")
        self._access_token = None
        self._token_expires_at = None
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """加载配置文件"""
        if not os.path.exists(config_path):
            print(f"错误：配置文件不存在: {config_path}")
            sys.exit(1)
        
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def get_access_token(self) -> str:
        """获取access_token（带缓存）"""
        # 检查缓存的token是否有效
        if self._access_token and self._token_expires_at:
            if datetime.now() < self._token_expires_at:
                print(f"✓ 使用缓存的access_token")
                return self._access_token
        
        print(f"✓ 正在获取access_token...")
        
        url = f"{WECHAT_API_BASE}/token"
        params = {
            "grant_type": "client_credential",
            "appid": self.app_id,
            "secret": self.app_secret
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if "access_token" in data:
                self._access_token = data["access_token"]
                expires_in = data.get("expires_in", 7200)
                # 提前5分钟过期
                self._token_expires_at = datetime.now() + timedelta(seconds=expires_in - 300)
                print(f"✓ 成功获取access_token，有效期{expires_in}秒")
                return self._access_token
            else:
                error_msg = data.get("errmsg", "未知错误")
                print(f"✗ 获取access_token失败: {error_msg}")
                sys.exit(1)
                
        except requests.exceptions.RequestException as e:
            print(f"✗ 网络请求失败: {e}")
            sys.exit(1)
    
    def extract_title(self, html_content: str) -> str:
        """从HTML中提取标题"""
        # 优先从<title>标签提取
        title_match = re.search(r'<title>(.*?)</title>', html_content, re.IGNORECASE | re.DOTALL)
        if title_match:
            return title_match.group(1).strip()
        
        # 从h1标签提取
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_content, re.IGNORECASE | re.DOTALL)
        if h1_match:
            return re.sub(r'<[^>]+>', '', h1_match.group(1)).strip()
        
        # 从第一个# Markdown标题提取
        md_match = re.search(r'^#\s+(.+)$', html_content, re.MULTILINE)
        if md_match:
            return md_match.group(1).strip()
        
        return "未命名文章"
    
    def extract_digest(self, html_content: str, max_length: int = 120) -> str:
        """提取文章摘要"""
        # 提取第一段文字作为摘要
        paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', html_content, re.IGNORECASE | re.DOTALL)
        
        for p in paragraphs:
            # 跳过空段落和引用块
            text = re.sub(r'<[^>]+>', '', p).strip()
            if text and len(text) > 20:
                if len(text) > max_length:
                    text = text[:max_length] + "..."
                return text
        
        return ""
    
    def upload_thumb(self, image_path: str) -> Optional[str]:
        """上传封面图获取media_id（可选功能）"""
        print(f"  封面图上传功能待实现，当前使用默认封面")
        return self.default_cover if self.default_cover else None
    
    def add_draft(self, html_content: str, author: str = None, digest: str = None) -> Dict[str, Any]:
        """发布文章到草稿箱"""
        access_token = self.get_access_token()
        
        # 提取标题
        title = self.extract_title(html_content)
        print(f"✓ 提取到文章标题: {title}")
        
        # 提取摘要
        if not digest:
            digest = self.extract_digest(html_content)
            print(f"✓ 提取到文章摘要: {digest[:50]}..." if len(digest) > 50 else f"✓ 提取到文章摘要: {digest}")
        
        # 设置作者
        if not author:
            author = self.default_author
        
        # 准备请求数据
        data = {
            "title": title,
            "author": author,
            "content": html_content,
            "digest": digest,
            "content_source_url": ""
        }
        
        # 添加封面图media_id（如果有）
        if self.default_cover:
            data["thumb_media_id"] = self.default_cover
        
        # 调用API
        url = f"{WECHAT_API_BASE}/draft/add"
        params = {"access_token": access_token}
        
        try:
            print(f"✓ 正在发布到草稿箱...")
            response = requests.post(url, params=params, json=data, timeout=30)
            result = response.json()
            
            if "media_id" in result:
                media_id = result["media_id"]
                print(f"✓ 成功发布到草稿箱!")
                print(f"  草稿ID: {media_id}")
                return {
                    "success": True,
                    "draft_id": media_id,
                    "preview_url": f"https://mp.weixin.qq.com/cgi-bin/draft?action=preview&msg_id={media_id}",
                    "edit_url": f"https://mp.weixin.qq.com/cgi-bin/draft?action=edit&msg_id={media_id}",
                    "title": title,
                    "message": "文章已成功发布到草稿箱"
                }
            else:
                error_msg = result.get("errmsg", "未知错误")
                print(f"✗ 发布失败: {error_msg}")
                return {
                    "success": False,
                    "message": f"发布失败: {error_msg}"
                }
                
        except requests.exceptions.RequestException as e:
            print(f"✗ 网络请求失败: {e}")
            return {
                "success": False,
                "message": f"网络请求失败: {e}"
            }


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="微信公众号草稿箱发布工具")
    parser.add_argument("--html", required=True, help="HTML文件路径")
    parser.add_argument("--config", required=True, help="配置文件路径")
    parser.add_argument("--author", help="作者名（可选）")
    parser.add_argument("--digest", help="文章摘要（可选）")
    
    args = parser.parse_args()
    
    # 检查HTML文件
    if not os.path.exists(args.html):
        print(f"错误：HTML文件不存在: {args.html}")
        sys.exit(1)
    
    # 读取HTML内容
    print(f"正在读取文件: {args.html}")
    with open(args.html, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    print(f"文件大小: {len(html_content)} 字节")
    print("-" * 40)
    
    # 创建发布器并执行发布
    publisher = WeChatPublisher(args.config)
    result = publisher.add_draft(
        html_content, 
        author=args.author, 
        digest=args.digest
    )
    
    print("-" * 40)
    if result["success"]:
        print("\n🎉 发布成功!")
        print(f"📝 标题: {result['title']}")
        print(f"🆔 草稿ID: {result['draft_id']}")
        print(f"👀 预览链接: {result['preview_url']}")
        print(f"✏️  编辑链接: {result['edit_url']}")
    else:
        print(f"\n❌ 发布失败: {result['message']}")
        sys.exit(1)


if __name__ == "__main__":
    main()
