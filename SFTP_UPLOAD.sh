#!/bin/bash

# 🚀 直接用 SFTP 上传文件到服务器
# 无需修改 shell，绕过 SSH 限制

set -e

echo "================================"
echo "📤 SFTP 文件上传工具"
echo "================================"
echo ""

# 配置
SERVER_IP="192.168.1.112"
SERVER_USER="huangshengwei"
SERVER_PORT="22"
PASSWORD="cvte2020"
LOCAL_DIR="/Users/ray/WorkBuddy/20260320100957"

echo "📍 上传配置："
echo "   服务器: $SERVER_IP:$SERVER_PORT"
echo "   用户: $SERVER_USER"
echo "   本地目录: $LOCAL_DIR"
echo ""

# 检查 sshpass
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass 未安装，正在安装..."
    brew install sshpass -q
    echo "✅ sshpass 安装完成"
fi

# 上传文件列表
FILES_TO_UPLOAD=(
    "index.html"
    "admin.html"
    "login.html"
)

# 上传文件
echo "📤 开始上传文件..."
echo ""

for file in "${FILES_TO_UPLOAD[@]}"; do
    echo "上传: $file"
    
    sshpass -p "$PASSWORD" sftp -P $SERVER_PORT "$SERVER_USER@$SERVER_IP" << EOF
cd /var/www
put "$LOCAL_DIR/$file"
bye
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ $file 上传成功"
    else
        echo "❌ $file 上传失败"
    fi
    echo ""
done

echo "================================"
echo "✅ 上传完成！"
echo "================================"
echo ""
echo "🌐 访问地址："
echo "   http://192.168.1.112:5666/index.html"
echo "   http://192.168.1.112:5666/admin.html"
echo "   http://192.168.1.112:5666/login.html"
echo ""
