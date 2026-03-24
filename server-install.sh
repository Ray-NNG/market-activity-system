#!/bin/bash

# 市场活动管理系统 - 在服务器上直接运行的自动部署脚本
# 用法：bash server-install.sh

set -e

echo "🚀 市场活动管理系统 - 服务器自动部署"
echo "======================================"
echo ""

# 配置
PROJECT_DIR="/var/www/market-activity"
GITHUB_REPO="https://github.com/Ray-NNG/market-activity-system.git"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 第 1 步：检查权限
log_info "第 1 步：检查权限"
if [ "$EUID" -eq 0 ]; then
    log_success "以 root 权限运行"
else
    log_warning "非 root 用户，某些操作可能需要 sudo"
    SUDO="sudo"
fi

# 第 2 步：创建项目目录
log_info "第 2 步：创建项目目录"
${SUDO} mkdir -p "$PROJECT_DIR"
${SUDO} chmod 755 "$PROJECT_DIR"
log_success "目录已创建: $PROJECT_DIR"

# 第 3 步：下载系统文件
log_info "第 3 步：下载系统文件"

cd "$PROJECT_DIR"

# 尝试从 GitHub 克隆
if command -v git &> /dev/null; then
    log_info "使用 Git 克隆仓库..."
    if git clone "$GITHUB_REPO" . 2>/dev/null || true; then
        log_success "Git 克隆成功"
    else
        log_warning "Git 克隆失败，使用备用方式..."
        download_files_curl
    fi
else
    log_info "Git 未安装，使用 curl 下载..."
    download_files_curl
fi

# 下载单个文件的函数
download_files_curl() {
    BASE_URL="https://raw.githubusercontent.com/Ray-NNG/market-activity-system/main"
    
    for file in index.html admin.html login.html tencentcloud-adapter.js deploy-package.html; do
        log_info "下载 $file..."
        if curl -f -o "$file" "$BASE_URL/$file" 2>/dev/null; then
            log_success "✓ $file 下载成功"
        else
            log_warning "✗ $file 下载失败（可能不存在或网络问题）"
        fi
    done
}

# 第 4 步：设置权限
log_info "第 4 步：设置权限"
${SUDO} chmod -R 755 "$PROJECT_DIR"
${SUDO} chmod -R 644 "$PROJECT_DIR"/*.html "$PROJECT_DIR"/*.js 2>/dev/null || true
log_success "权限已设置"

# 第 5 步：配置 Nginx
log_info "第 5 步：配置 Nginx"

if command -v nginx &> /dev/null; then
    log_success "检测到 Nginx"
    
    # 检查是否已配置
    if grep -q "market-activity" /etc/nginx/sites-available/default 2>/dev/null; then
        log_info "Nginx 已配置 /market-activity"
    else
        log_info "添加 Nginx 配置..."
        
        # 备份原始配置
        ${SUDO} cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%s)
        
        # 添加新配置
        ${SUDO} tee -a /etc/nginx/sites-available/default > /dev/null <<'EOF'

# 市场活动管理系统
location /market-activity {
    alias /var/www/market-activity;
    index index.html;
    try_files $uri $uri/ /index.html;
    
    # 缓存配置
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
EOF
        
        log_success "Nginx 配置已添加"
        
        # 测试配置
        log_info "测试 Nginx 配置..."
        if ${SUDO} nginx -t 2>/dev/null; then
            log_success "Nginx 配置测试通过"
            
            # 重启 Nginx
            log_info "重启 Nginx..."
            if ${SUDO} systemctl restart nginx 2>/dev/null; then
                log_success "Nginx 已重启"
            else
                log_warning "Nginx 重启可能失败，请手动执行: sudo systemctl restart nginx"
            fi
        else
            log_error "Nginx 配置有错误"
            log_warning "配置已备份到: /etc/nginx/sites-available/default.backup"
            exit 1
        fi
    fi
else
    log_warning "未检测到 Nginx，跳过 Nginx 配置"
    log_info "请手动配置 web 服务器"
fi

# 第 6 步：验证部署
log_info "第 6 步：验证文件"

for file in index.html admin.html login.html; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        size=$(du -h "$PROJECT_DIR/$file" | cut -f1)
        log_success "✓ $file 已就位 ($size)"
    else
        log_warning "✗ $file 未找到"
    fi
done

# 完成
echo ""
echo "======================================"
log_success "🎉 部署完成！"
echo ""
log_info "系统访问地址:"
echo "  前台报名: http://$(hostname -I | awk '{print $1}'):5666/market-activity/index.html"
echo "  后台管理: http://$(hostname -I | awk '{print $1}'):5666/market-activity/admin.html"
echo "  登录页面: http://$(hostname -I | awk '{print $1}'):5666/market-activity/login.html"
echo ""
log_info "管理员账户:"
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
log_info "项目目录: $PROJECT_DIR"
echo ""

exit 0
