#!/bin/bash
# 远程服务器部署脚本
# 用于部署到 192.168.1.112:5666

# 配置
REMOTE_URL="http://192.168.1.112:5666"
REMOTE_USER="huangshengwei"
REMOTE_PASS="WKi3,Ly{1g"

# 本地项目路径
LOCAL_PROJECT="/Users/ray/WorkBuddy/20260320100957"

# 需要部署的文件
FILES=(
    "index.html"
    "admin.html"
    "login.html"
    "diagnostic.html"
    "tencentcloud-adapter.js"
    "server-express.js"
    "local-server.py"
)

echo "========================================"
echo "🚀 远程部署脚本"
echo "========================================"
echo "目标服务器: $REMOTE_URL"
echo "========================================"
echo ""

# 测试连接
echo "🔌 测试服务器连接..."
if curl -s -I "$REMOTE_URL" > /dev/null 2>&1; then
    echo "✅ 服务器在线"
else
    echo "❌ 无法连接到服务器"
    exit 1
fi

echo ""
echo "📤 准备上传文件..."
echo ""

# 逐个上传文件
SUCCESS_COUNT=0
FAILED_COUNT=0

for file in "${FILES[@]}"; do
    FILE_PATH="$LOCAL_PROJECT/$file"
    
    if [ ! -f "$FILE_PATH" ]; then
        echo "⚠️  文件不存在: $file"
        continue
    fi
    
    FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null)
    echo "📋 上传 $file ($(printf "%.1f" $(echo "scale=1; $FILE_SIZE / 1024" | bc)) KB)..."
    
    # 方法1: 尝试 PUT 上传
    HTTP_CODE=$(curl -s -w "%{http_code}" -X PUT \
        --data-binary "@$FILE_PATH" \
        "$REMOTE_URL/$file" \
        -o /dev/null)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "204" ]; then
        echo "   ✅ 上传成功 (HTTP $HTTP_CODE)"
        ((SUCCESS_COUNT++))
        continue
    fi
    
    # 方法2: 尝试 POST 上传
    HTTP_CODE=$(curl -s -w "%{http_code}" -F "file=@$FILE_PATH" \
        "$REMOTE_URL/upload" \
        -o /dev/null 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "   ✅ 上传成功 (POST, HTTP $HTTP_CODE)"
        ((SUCCESS_COUNT++))
        continue
    fi
    
    # 方法3: 尝试带身份验证的 PUT
    HTTP_CODE=$(curl -s -w "%{http_code}" -X PUT \
        -u "$REMOTE_USER:$REMOTE_PASS" \
        --data-binary "@$FILE_PATH" \
        "$REMOTE_URL/$file" \
        -o /dev/null 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "204" ]; then
        echo "   ✅ 上传成功 (认证 PUT, HTTP $HTTP_CODE)"
        ((SUCCESS_COUNT++))
        continue
    fi
    
    echo "   ❌ 上传失败 (最后状态码: $HTTP_CODE)"
    ((FAILED_COUNT++))
done

echo ""
echo "========================================"
echo "✅ 上传完成"
echo "========================================"
echo "成功: $SUCCESS_COUNT"
echo "失败: $FAILED_COUNT"
echo ""

if [ $FAILED_COUNT -eq 0 ]; then
    echo "🎉 所有文件上传成功！"
    echo ""
    echo "访问地址:"
    echo "  🌐 前台: $REMOTE_URL/index.html"
    echo "  📊 后台: $REMOTE_URL/admin.html"
    echo "  🔑 登录: $REMOTE_URL/login.html"
    echo ""
    echo "默认管理员密码: admin123"
else
    echo "⚠️  部分文件上传失败"
    echo ""
    echo "建议使用 SFTP/SCP 手动上传:"
    echo "  sftp -P 5666 $REMOTE_USER@192.168.1.112"
    echo ""
    echo "或查看 REMOTE_DEPLOYMENT.md 了解其他部署方式"
fi

echo ""
echo "========================================"
