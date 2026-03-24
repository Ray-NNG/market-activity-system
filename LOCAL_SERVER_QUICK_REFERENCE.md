# 🖥️ 本地服务器快速参考卡

## 📌 你有 2 个选择

### 选项 A：Python（已在用，极简）
```bash
python3 local-server.py
# 访问: http://localhost:8000
```

### 选项 B：Node.js（更强大，推荐）
```bash
bash setup-express.sh
node server-express.js
# 访问: http://localhost:3000
```

---

## 🎯 快速对比

| 功能 | Python | Node.js |
|------|--------|---------|
| 启动速度 | ⚡ 极快 | 快 |
| 性能 | 中等 | 优秀 |
| 并发能力 | 100 | 1000+ |
| 复杂度 | 极低 | 低 |
| 适合场景 | 开发测试 | 生产环境 |

---

## 🚀 从 Python 升级到 Node.js

### 步骤 1：检查 Node.js
```bash
node --version  # 应该显示 v14+ 或更高
npm --version
```

如果没有，访问 https://nodejs.org 下载安装

### 步骤 2：自动安装
```bash
bash /Users/ray/WorkBuddy/20260320100957/setup-express.sh
```

### 步骤 3：启动
```bash
node /Users/ray/WorkBuddy/20260320100957/server-express.js
```

### 步骤 4：访问
打开浏览器访问：
- 前台: http://localhost:3000/index.html
- 管理: http://localhost:3000/admin.html

---

## 📊 文件位置

```
/Users/ray/WorkBuddy/20260320100957/
├── local-server.py              ← Python 服务器
├── server-express.js            ← Node.js 服务器 ⭐ 推荐
├── setup-express.sh             ← 一键安装脚本
├── LOCAL_SERVER_DEPLOYMENT.md   ← 完整部署指南
├── index.html                   ← 前台系统
├── admin.html                   ← 后台管理
└── .data/ 或 .data-server/      ← 数据保存位置
```

---

## 🎨 常用命令

### 启动 Python 服务器
```bash
cd /Users/ray/WorkBuddy/20260320100957
python3 local-server.py
```

### 启动 Node.js 服务器
```bash
cd /Users/ray/WorkBuddy/20260320100957
npm install  # 首次运行
node server-express.js
```

### 停止服务器
```
按 Ctrl+C
```

### 从其他电脑访问
```bash
# 找到你的 Mac IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 其他电脑访问
http://YOUR_IP:8000/index.html (Python)
# 或
http://YOUR_IP:3000/index.html (Node.js)
```

---

## 💾 数据备份

### Python 方案
```bash
# 数据位置
ls -la /Users/ray/WorkBuddy/20260320100957/.data/

# 备份
cp -r .data/ .data-backup-$(date +%Y%m%d)
```

### Node.js 方案
```bash
# 数据位置
ls -la /Users/ray/WorkBuddy/20260320100957/.data-server/

# 备份
cp -r .data-server/ .data-server-backup-$(date +%Y%m%d)
```

---

## 🔒 安全建议

### 本地网络访问（安全）
```bash
# 允许局域网访问
python3 local-server.py  # 自动允许本网段 IP
```

### 仅本地访问（更安全）
```bash
# 编辑 server-express.js，改为:
server.listen(PORT, '127.0.0.1', ...)
```

---

## 🆘 故障排查

### "Address already in use" - 端口被占用
```bash
# 找到占用的进程
lsof -i :8000
lsof -i :3000

# 杀死进程
kill -9 PID
```

### "Cannot find module 'express'"
```bash
# 重新安装依赖
npm install
```

### 访问超时
```bash
# 检查服务器是否运行
ps aux | grep "local-server.py"
ps aux | grep "server-express.js"

# 检查端口
netstat -an | grep 8000
netstat -an | grep 3000
```

---

## 📞 下一步

### 现在
✅ 用 Python 服务器测试系统  
✅ 验证所有功能正常

### 稍后（可选）
✅ 升级到 Node.js 以获得更好性能  
✅ 部署到腾讯云 COS（生产环境）

---

## 📚 更多信息

完整部署指南：
```
/Users/ray/WorkBuddy/20260320100957/LOCAL_SERVER_DEPLOYMENT.md
```

使用这个文件了解：
- 🐳 Docker 容器化部署
- 🌐 Nginx 反向代理
- 🔐 SSL/HTTPS 配置
- 🌍 公网访问设置

---

**任何问题？告诉我！** 😊
