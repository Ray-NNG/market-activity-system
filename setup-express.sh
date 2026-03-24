#!/bin/bash

# 市场活动管理系统 - Node.js 一键部署脚本

echo ""
echo "=================================================="
echo "  🚀 Node.js 一键部署脚本"
echo "=================================================="
echo ""

# 检查 Node.js
echo "📍 步骤 1/3: 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo ""
    echo "请先安装 Node.js:"
    echo "  macOS: brew install node"
    echo "  或访问: https://nodejs.org/"
    exit 1
fi

node_version=$(node --version)
npm_version=$(npm --version)
echo "✅ Node.js 已安装: $node_version"
echo "✅ npm 已安装: $npm_version"
echo ""

# 安装依赖
echo "📍 步骤 2/3: 安装依赖..."
npm install express cors --save

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"
echo ""

# 启动服务器
echo "📍 步骤 3/3: 启动服务器..."
echo ""
echo "=================================================="
echo "✅ 一键部署完成！"
echo "=================================================="
echo ""
echo "🎯 启动服务器，请运行:"
echo "  node server-express.js"
echo ""
echo "然后访问:"
echo "  🏠 前台: http://localhost:3000/index.html"
echo "  ⚙️  管理: http://localhost:3000/admin.html"
echo ""
