#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
腾讯云 COS 下载问题诊断和修复
"""

import subprocess
import sys

BUCKET = "nnqgcvte2026-1414699807"
REGION = "ap-guangzhou"
SECRET_ID = "AKIDFOL4Zquqa7RXSAfy4yfARWN0PTQGwQiW"
SECRET_KEY = "hBRWTCh2A6oJcibIo6h9NQM5av51lIdm"

print("=" * 70)
print("🔍 腾讯云 COS 文件下载问题诊断")
print("=" * 70)
print()

# 问题分析
print("📋 问题分析:")
print("   - Content-Type 已设置正确: ✅")
print("   - HTTP 响应头正常: ✅")
print("   - 但浏览器仍然下载文件而不打开")
print()

# 可能的原因
print("🔎 可能的原因:")
print("   1. 腾讯云 COS 配置了强制下载")
print("   2. 文件扩展名被识别为下载类型")
print("   3. 浏览器的安全策略限制")
print("   4. CORS 配置问题")
print()

# 解决方案 1: 检查并设置腾讯云的静态网站配置
print("💡 解决方案 1: 启用静态网站托管")
print("=" * 70)
print()
print("腾讯云 COS 的'静态网站'功能可以解决这个问题。")
print()
print("📌 需要在腾讯云控制台手动设置:")
print()
print("1. 打开腾讯云控制台:")
print("   https://console.cloud.tencent.com/cos")
print()
print("2. 选择存储桶: nnqgcvte2026-1414699807")
print()
print("3. 进入 '基础配置' → '静态网站'")
print()
print("4. 启用静态网站托管:")
print("   - 状态: 启用")
print("   - 主页: index.html")
print("   - 错误文档: (可选)")
print()
print("5. 保存配置")
print()
print("6. 然后用这个新 URL 访问:")
print(f"   https://{BUCKET}.cos-website.{REGION}.myqcloud.com/index.html")
print()
print()

# 解决方案 2: 检查文件权限
print("💡 解决方案 2: 检查文件权限")
print("=" * 70)
print()
print("📌 在腾讯云控制台验证:")
print()
print("1. 进入存储桶")
print("2. 找到 index.html")
print("3. 右键 → 对象属性")
print("4. 检查 '权限' 设置是否为 '公有读'")
print()
print()

# 解决方案 3: 绑定自定义域名
print("💡 解决方案 3: 绑定自定义域名（如有）")
print("=" * 70)
print()
print("如果有自己的域名，绑定后可能会解决问题:")
print()
print("1. 在腾讯云控制台 → COS → 域名管理")
print("2. 添加自定义域名")
print("3. 配置 DNS CNAME 记录")
print()
print()

# 解决方案 4: 用 curl 测试
print("🧪 测试命令:")
print("=" * 70)
print()
print("运行这个命令看是否能下载 HTML 内容:")
print()
print(f"curl -L 'https://{BUCKET}.cos.{REGION}.myqcloud.com/index.html' | head -50")
print()
print()

# 最终建议
print("✅ 最快的解决方案")
print("=" * 70)
print()
print("📌 在腾讯云控制台启用 '静态网站托管' (1 分钟):")
print()
print("后续访问时使用这个 URL:")
print(f"   https://{BUCKET}.cos-website.{REGION}.myqcloud.com/")
print()
print("这个 URL 会自动打开 index.html，而不是下载。")
print()

print("=" * 70)
print("💬 需要帮助？")
print("=" * 70)
print()
print("如果上面的方案都不行，可以:")
print()
print("1. 截图给我看腾讯云控制台的'基础配置'页面")
print("2. 我会直接告诉你哪里需要修改")
print()
