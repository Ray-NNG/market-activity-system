#!/bin/bash

# 🚀 市场活动管理系统 - Mac 快速部署脚本
# 一行命令完成所有操作

set -e

echo "================================"
echo "🚀 市场活动管理系统部署工具"
echo "================================"
echo ""

# 配置信息
SERVER_IP="192.168.1.112"
SERVER_USER="huangshengwei"
SERVER_PORT="22"
PASSWORD="cvte2020"

echo "📍 服务器信息："
echo "   地址: $SERVER_IP:$SERVER_PORT"
echo "   用户: $SERVER_USER"
echo ""

# 检查依赖
echo "✅ 检查依赖..."

if ! command -v ssh &> /dev/null; then
    echo "❌ SSH 未安装"
    exit 1
fi

if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass 未安装，正在安装..."
    brew install sshpass
fi

echo "✅ 依赖检查完毕"
echo ""

# 执行远程部署脚本
echo "🔄 连接到服务器并执行部署..."
echo ""

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'DEPLOY_SCRIPT'
echo "📦 开始部署市场活动管理系统..."
echo ""

# 定义目录
WEB_ROOT="/var/www/market-activity"
REPO_URL="https://github.com/Ray-NNG/market-activity-system.git"

# 1. 创建目录
echo "📁 创建目录..."
sudo mkdir -p "$WEB_ROOT"

# 2. 克隆或更新仓库
if [ -d "$WEB_ROOT/.git" ]; then
    echo "📥 更新现有代码..."
    cd "$WEB_ROOT"
    sudo git pull origin main
else
    echo "📥 克隆代码仓库..."
    cd /var/www
    sudo git clone "$REPO_URL" market-activity
fi

# 3. 设置权限
echo "🔐 设置权限..."
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"

# 4. 配置 Nginx（如果还没配置）
echo "⚙️  配置 Nginx..."
NGINX_CONF="/etc/nginx/sites-available/market-activity"

if [ ! -f "$NGINX_CONF" ]; then
    sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 5666;
    server_name _;

    location /market-activity/ {
        alias $WEB_ROOT/;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location / {
        root /var/www;
        index index.html index.htm;
    }
}
EOF
    sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
fi

# 5. 检查 Nginx 配置
echo "🔍 检查 Nginx 配置..."
sudo nginx -t

# 6. 重启 Nginx
echo "🔄 重启 Nginx..."
sudo systemctl restart nginx

# 7. 验证部署
echo ""
echo "✅ 部署完成！"
echo ""
echo "🎯 访问地址："
echo "   前台: http://192.168.1.112:5666/market-activity/index.html"
echo "   后台: http://192.168.1.112:5666/market-activity/admin.html"
echo "   账户: admin / admin123"
echo ""

DEPLOY_SCRIPT

echo ""
echo "================================"
echo "✅ 部署流程完成！"
echo "================================"
echo ""
echo "🌐 请访问以下地址验证部署："
echo ""
echo "   前台报名: http://$SERVER_IP:5666/market-activity/index.html"
echo "   后台管理: http://$SERVER_IP:5666/market-activity/admin.html"
echo "   登录账户: admin / admin123"
echo ""
echo "⏱️  部署耗时: 约 2-3 分钟"
echo "📝 部署日志: 上面的所有输出"
echo ""
