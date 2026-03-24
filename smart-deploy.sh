#!/bin/bash
# 智能部署脚本 - 自动检测正确的上传位置

set -e

TARGET_HOST="192.168.1.112"
TARGET_PORT="5666"
TARGET_USER="huangshengwei"
TARGET_PASS="WKi3,Ly{1g"

PROJECT_NAME="market-activity-system"
LOCAL_FILES=(
    "index.html"
    "admin.html"
    "login.html"
    "diagnostic.html"
    "tencentcloud-adapter.js"
)

echo "========================================"
echo "🚀 智能部署脚本"
echo "========================================"
echo ""

# 步骤1: 检测是否可以 SSH 连接
echo "🔌 检测 SSH 连接..."
if sshpass -p "$TARGET_PASS" ssh -o StrictHostKeyChecking=no -p "$TARGET_PORT" "$TARGET_USER@$TARGET_HOST" "echo '✅ SSH 连接成功'" 2>/dev/null; then
    echo "✅ SSH 连接成功"
    SSH_AVAILABLE=1
else
    echo "⚠️  SSH 不可用，将使用 HTTP 上传"
    SSH_AVAILABLE=0
fi

echo ""

# 步骤2: 如果有 SSH，探测正确的目录
if [ $SSH_AVAILABLE -eq 1 ]; then
    echo "🔍 探测服务器目录..."
    
    # 尝试找到 web 根目录
    DETECTED_DIRS=$(sshpass -p "$TARGET_PASS" ssh -o StrictHostKeyChecking=no -p "$TARGET_PORT" "$TARGET_USER@$TARGET_HOST" \
        "for dir in /var/www /var/www/html /home/$TARGET_USER/public_html /opt /srv/www /usr/share/nginx/html; do 
            if [ -d \$dir ] && [ -w \$dir ]; then 
                echo \$dir; 
            fi
        done" 2>/dev/null)
    
    if [ -z "$DETECTED_DIRS" ]; then
        echo "❌ 无法找到可写的 web 目录"
        echo "   请手动指定目录："
        read -p "输入目录路径 (如 /var/www/html): " TARGET_DIR
    else
        # 显示可用的目录
        echo "📁 检测到以下可用目录:"
        echo "$DETECTED_DIRS" | nl
        
        # 使用第一个目录
        TARGET_DIR=$(echo "$DETECTED_DIRS" | head -1)
        echo ""
        echo "✅ 将部署到: $TARGET_DIR"
    fi
    
    # 创建项目子目录（可选）
    echo ""
    read -p "是否在 $TARGET_DIR 中创建子目录 /$PROJECT_NAME? (y/n, 默认 n): " CREATE_SUBDIR
    if [ "$CREATE_SUBDIR" = "y" ]; then
        TARGET_DIR="$TARGET_DIR/$PROJECT_NAME"
        sshpass -p "$TARGET_PASS" ssh -o StrictHostKeyChecking=no -p "$TARGET_PORT" "$TARGET_USER@$TARGET_HOST" \
            "mkdir -p $TARGET_DIR" 2>/dev/null || true
        echo "✅ 子目录已创建"
    fi
fi

echo ""
echo "📤 开始上传文件..."
echo ""

SUCCESS_COUNT=0
FAILED_COUNT=0

for file in "${LOCAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  文件不存在: $file"
        continue
    fi
    
    echo "📋 上传 $file..."
    
    if [ $SSH_AVAILABLE -eq 1 ]; then
        # 使用 SCP 上传
        if sshpass -p "$TARGET_PASS" scp -o StrictHostKeyChecking=no -P "$TARGET_PORT" \
            "$file" "$TARGET_USER@$TARGET_HOST:$TARGET_DIR/" 2>/dev/null; then
            echo "   ✅ 上传成功 (SCP)"
            ((SUCCESS_COUNT++))
        else
            echo "   ❌ 上传失败"
            ((FAILED_COUNT++))
        fi
    else
        # 使用 HTTP PUT 上传
        HTTP_CODE=$(curl -s -w "%{http_code}" -X PUT \
            -u "$TARGET_USER:$TARGET_PASS" \
            --data-binary "@$file" \
            "http://$TARGET_HOST:$TARGET_PORT/$file" \
            -o /dev/null 2>/dev/null)
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "204" ]; then
            echo "   ✅ 上传成功 (PUT, HTTP $HTTP_CODE)"
            ((SUCCESS_COUNT++))
        else
            echo "   ⚠️  PUT 返回 $HTTP_CODE，尝试 POST..."
            
            HTTP_CODE=$(curl -s -w "%{http_code}" -F "file=@$file" \
                "http://$TARGET_HOST:$TARGET_PORT/upload" \
                -o /dev/null 2>/dev/null)
            
            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
                echo "   ✅ 上传成功 (POST, HTTP $HTTP_CODE)"
                ((SUCCESS_COUNT++))
            else
                echo "   ❌ 上传失败 (POST 返回 $HTTP_CODE)"
                ((FAILED_COUNT++))
            fi
        fi
    fi
done

echo ""
echo "========================================"
echo "✅ 部署完成"
echo "========================================"
echo "成功: $SUCCESS_COUNT / ${#LOCAL_FILES[@]}"
echo "失败: $FAILED_COUNT / ${#LOCAL_FILES[@]}"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "🌐 访问地址:"
    if [ $SSH_AVAILABLE -eq 1 ] && [ ! -z "$CREATE_SUBDIR" ] && [ "$CREATE_SUBDIR" = "y" ]; then
        echo "   http://$TARGET_HOST:$TARGET_PORT/$PROJECT_NAME/index.html"
    else
        echo "   http://$TARGET_HOST:$TARGET_PORT/index.html"
    fi
    echo ""
    echo "🔑 默认登录信息:"
    echo "   用户名: admin"
    echo "   密码: admin123"
fi

echo "========================================"
