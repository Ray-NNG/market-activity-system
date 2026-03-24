#!/bin/bash

# 🚀 用 SCP 上传文件（最可靠的方式）
# 绕过 SFTP 的各种限制

set -e

echo "================================"
echo "📤 SCP 文件上传工具"
echo "================================"
echo ""

# 配置
SERVER_IP="192.168.1.112"
SERVER_USER="huangshengwei"
SERVER_PORT="22"
PASSWORD="cvte2020"
LOCAL_DIR="/Users/ray/WorkBuddy/20260320100957"
REMOTE_DIR="/var/www"

echo "📍 上传配置："
echo "   服务器: $SERVER_IP ($SERVER_USER)"
echo "   本地目录: $LOCAL_DIR"
echo "   远程目录: $REMOTE_DIR"
echo ""

# 检查 sshpass
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass 未安装，正在安装..."
    brew install sshpass -q
    echo "✅ sshpass 安装完成"
fi

echo ""

# 上传文件列表
FILES_TO_UPLOAD=(
    "index.html"
    "admin.html"
    "login.html"
)

# 上传文件
echo "📤 开始上传文件..."
echo ""

UPLOAD_SUCCESS=0
UPLOAD_FAIL=0

for file in "${FILES_TO_UPLOAD[@]}"; do
    echo "⏳ 上传: $file"
    
    # 用 scp 上传
    if sshpass -p "$PASSWORD" scp -P $SERVER_PORT "$LOCAL_DIR/$file" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/" 2>/dev/null; then
        echo "✅ $file 上传成功"
        ((UPLOAD_SUCCESS++))
    else
        echo "❌ $file 上传失败"
        ((UPLOAD_FAIL++))
    fi
    echo ""
done

echo "================================"
echo "📊 上传结果"
echo "================================"
echo "✅ 成功: $UPLOAD_SUCCESS 个文件"
echo "❌ 失败: $UPLOAD_FAIL 个文件"
echo ""

if [ $UPLOAD_SUCCESS -gt 0 ]; then
    echo "🌐 验证："
    echo ""
    echo "   curl http://192.168.1.112:5666/index.html | head -20"
    echo ""
    echo "📍 完整访问地址："
    echo "   前台: http://192.168.1.112:5666/index.html"
    echo "   后台: http://192.168.1.112:5666/admin.html"
    echo "   登录: http://192.168.1.112:5666/login.html"
    echo ""
fi

if [ $UPLOAD_FAIL -gt 0 ]; then
    echo "💡 排查提示："
    echo "   1. 确认 SSH 密码正确"
    echo "   2. 确认远程目录 /var/www 存在"
    echo "   3. 尝试手动测试："
    echo "      sshpass -p 'cvte2020' ssh huangshengwei@192.168.1.112 'ls -la /var/www'"
    echo ""
fi
