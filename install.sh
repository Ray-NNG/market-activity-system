#!/bin/bash

# 市场活动管理系统 - 一键部署脚本
# 在远程服务器上执行此脚本

set -e

echo "🚀 市场活动管理系统 - 一键部署"
echo "=================================="
echo ""

# 配置
PROJECT_DIR="/var/www/market-activity"
REPO_URL="https://github.com/Ray-NNG/market-activity-system.git"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 第 1 步：检查权限
log_info "第 1 步：检查权限..."
if [ "$EUID" -eq 0 ]; then
    log_success "以 root 权限运行"
else
    log_info "非 root 用户，某些操作可能需要 sudo"
fi

# 第 2 步：创建项目目录
log_info "第 2 步：创建项目目录..."
if [ -d "$PROJECT_DIR" ]; then
    log_info "目录已存在: $PROJECT_DIR"
else
    mkdir -p "$PROJECT_DIR"
    log_success "创建目录: $PROJECT_DIR"
fi

# 第 3 步：下载系统文件
log_info "第 3 步：下载系统文件..."

cd "$PROJECT_DIR"

if [ -d ".git" ]; then
    log_info "更新已存在的仓库..."
    git pull
else
    log_info "克隆新仓库..."
    git clone "$REPO_URL" . || {
        log_error "无法克隆仓库，尝试备用方式..."
        
        # 备用方式：手动下载关键文件
        curl -o index.html https://raw.githubusercontent.com/Ray-NNG/market-activity-system/main/index.html
        curl -o admin.html https://raw.githubusercontent.com/Ray-NNG/market-activity-system/main/admin.html
        curl -o login.html https://raw.githubusercontent.com/Ray-NNG/market-activity-system/main/login.html
        curl -o tencentcloud-adapter.js https://raw.githubusercontent.com/Ray-NNG/market-activity-system/main/tencentcloud-adapter.js
    }
fi

log_success "文件已准备"

# 第 4 步：设置权限
log_info "第 4 步：设置权限..."
chmod -R 755 "$PROJECT_DIR"
chmod -R 644 "$PROJECT_DIR"/*.html "$PROJECT_DIR"/*.js 2>/dev/null || true
log_success "权限已设置"

# 第 5 步：配置 Nginx (如果需要)
log_info "第 5 步：检查 Nginx 配置..."

if command -v nginx &> /dev/null; then
    log_info "检测到 Nginx..."
    
    # 检查是否需要添加配置
    if ! grep -q "market-activity" /etc/nginx/sites-available/default 2>/dev/null; then
        log_info "添加 Nginx 配置..."
        
        # 创建备份
        sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
        
        # 添加新配置
        sudo tee -a /etc/nginx/sites-available/default > /dev/null <<EOF

# 市场活动管理系统
location /market-activity {
    alias $PROJECT_DIR;
    index index.html;
    
    # 支持 HTML5 路由
    try_files \$uri \$uri/ /index.html;
    
    # 缓存配置
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
EOF
        
        log_success "Nginx 配置已添加"
        
        # 测试配置
        if sudo nginx -t 2>/dev/null; then
            log_success "Nginx 配置测试通过"
            sudo systemctl restart nginx
            log_success "Nginx 已重启"
        else
            log_error "Nginx 配置有错误，请手动修复"
        fi
    else
        log_info "Nginx 已配置 market-activity"
    fi
else
    log_info "未检测到 Nginx，跳过配置"
fi

# 第 6 步：验证部署
log_info "第 6 步：验证部署..."

if [ -f "$PROJECT_DIR/index.html" ]; then
    log_success "index.html 已就位"
else
    log_error "index.html 未找到"
fi

if [ -f "$PROJECT_DIR/admin.html" ]; then
    log_success "admin.html 已就位"
else
    log_error "admin.html 未找到"
fi

if [ -f "$PROJECT_DIR/login.html" ]; then
    log_success "login.html 已就位"
else
    log_error "login.html 未找到"
fi

# 完成
echo ""
echo "=================================="
log_success "🎉 部署完成！"
echo ""
log_info "访问地址:"
echo "  前台报名: http://192.168.1.112:5666/market-activity/index.html"
echo "  后台管理: http://192.168.1.112:5666/market-activity/admin.html"
echo "  登录页面: http://192.168.1.112:5666/market-activity/login.html"
echo ""
log_info "默认管理员:"
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
log_info "项目目录: $PROJECT_DIR"
echo ""
