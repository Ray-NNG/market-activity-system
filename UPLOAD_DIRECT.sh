#!/bin/bash

# 🚀 直接用 curl 和 HTTP 上传文件
# 绕过 SFTP 的 shell 输出问题

set -e

echo "================================"
echo "📤 HTTP 直接上传工具"
echo "================================"
echo ""

# 配置
SERVER_IP="192.168.1.112"
SERVER_PORT="5666"
PASSWORD="cvte2020"
LOCAL_DIR="/Users/ray/WorkBuddy/20260320100957"

echo "📍 上传配置："
echo "   服务器: $SERVER_IP:$SERVER_PORT"
echo "   本地目录: $LOCAL_DIR"
echo ""

# 上传文件列表
FILES_TO_UPLOAD=(
    "index.html"
    "admin.html"
    "login.html"
)

# 上传文件
echo "📤 开始上传文件到 /var/www/..."
echo ""

UPLOAD_SUCCESS=0
UPLOAD_FAIL=0

for file in "${FILES_TO_UPLOAD[@]}"; do
    echo "⏳ 上传: $file"
    
    # 尝试直接 PUT 上传
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
        --data-binary "@$LOCAL_DIR/$file" \
        "http://$SERVER_IP:$SERVER_PORT/$file" 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -1)
    
    echo "   HTTP 状态: $HTTP_CODE"
    
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" || "$HTTP_CODE" == "204" ]]; then
        echo "✅ $file 上传成功"
        ((UPLOAD_SUCCESS++))
    else
        echo "⚠️  HTTP PUT 返回 $HTTP_CODE，尝试其他方式..."
        
        # 尝试 POST 上传
        RESPONSE2=$(curl -s -w "\n%{http_code}" -F "file=@$LOCAL_DIR/$file" \
            "http://$SERVER_IP:$SERVER_PORT/upload" 2>&1)
        
        HTTP_CODE2=$(echo "$RESPONSE2" | tail -1)
        
        echo "   HTTP POST 状态: $HTTP_CODE2"
        
        if [[ "$HTTP_CODE2" == "200" || "$HTTP_CODE2" == "201" ]]; then
            echo "✅ $file POST 上传成功"
            ((UPLOAD_SUCCESS++))
        else
            echo "❌ $file 上传失败 (PUT: $HTTP_CODE, POST: $HTTP_CODE2)"
            ((UPLOAD_FAIL++))
        fi
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
    echo "🌐 访问地址："
    echo "   http://192.168.1.112:5666/index.html"
    echo "   http://192.168.1.112:5666/admin.html"
    echo "   http://192.168.1.112:5666/login.html"
    echo ""
fi

if [ $UPLOAD_FAIL -gt 0 ]; then
    echo "💡 提示："
    echo "   如果 HTTP 上传失败，说明服务器配置为不允许 PUT/POST"
    echo "   可以尝试用 SCP 方式上传"
    echo ""
fi
