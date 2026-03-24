# 🖥️ 部署到本地服务器完整指南

你现在运行的是 **Python 内置服务器**（临时开发用）。

如果要部署到**正式的本地服务器**，有以下几个方案：

---

## 📋 方案对比

| 方案 | 部署难度 | 性能 | 成本 | 最适合 |
|------|--------|------|------|-------|
| **方案1：Python 开发服务器** | ⭐ 极简 | 不错 | 免费 | 开发/测试 |
| **方案2：Node.js + Express** | ⭐⭐ 简单 | 优秀 | 免费 | 生产环境 |
| **方案3：Nginx** | ⭐⭐⭐ 中等 | 极优 | 免费 | 高并发 |
| **方案4：Docker** | ⭐⭐⭐ 中等 | 优秀 | 免费 | 容器化部署 |

---

## 🎯 方案1：Python 开发服务器（现在用的）

**已经在用！** 这就是最简单的方案。

### 特点
✅ 无需安装额外软件  
✅ 完全免费  
✅ 一行命令启动  
✅ 支持 CORS  
✅ 适合开发和测试  

### 启动命令
```bash
cd /Users/ray/WorkBuddy/20260320100957
python3 local-server.py
```

### 访问地址
- http://localhost:8000/index.html
- http://localhost:8000/admin.html

### 适用场景
- 📱 本地开发
- 🧪 功能测试
- 👥 小范围内网使用（1-10 人）

### 优点 vs 缺点

**优点**：
- 一键启动，无需配置
- 自动 CORS 支持
- 数据自动保存
- 完整日志输出

**缺点**：
- 仅支持本地/局域网访问
- 不能从外网访问
- 需要保持终端窗口打开

---

## 🚀 方案2：Node.js + Express（推荐生产）

如果要更强大的本地服务器，推荐用 Node.js。

### 安装步骤

#### 步骤1：安装 Node.js（如果没有）
```bash
# 检查是否已安装
node --version
npm --version

# 如果未安装，访问 https://nodejs.org/ 下载
```

#### 步骤2：创建 Express 服务器
```bash
cd /Users/ray/WorkBuddy/20260320100957
npm init -y
npm install express cors
```

#### 步骤3：创建服务器文件
```bash
cat > express-server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, '.data-express');

// 创建数据目录
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 获取数据
app.get('/api/data', (req, res) => {
  const dataFile = path.join(DATA_DIR, 'data.json');
  if (fs.existsSync(dataFile)) {
    const data = fs.readFileSync(dataFile, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.json({});
  }
});

// 保存数据
app.post('/api/save', (req, res) => {
  const dataFile = path.join(DATA_DIR, 'data.json');
  fs.writeFileSync(dataFile, JSON.stringify(req.body, null, 2));
  res.json({ status: 'saved', file: dataFile });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n✅ Express 服务器已启动`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`📁 前台系统: http://localhost:${PORT}/index.html`);
  console.log(`⚙️  后台管理: http://localhost:${PORT}/admin.html`);
  console.log(`📊 API 调试: http://localhost:${PORT}/health\n`);
});
EOF
```

#### 步骤4：启动服务器
```bash
node express-server.js
```

### 访问地址
- http://localhost:3000/index.html
- http://localhost:3000/admin.html

### 特点
✅ 更高的性能  
✅ 生产级别稳定  
✅ 完整的 API 支持  
✅ 更好的错误处理  
✅ 可扩展性更强  

---

## 🐳 方案3：Docker（容器化部署）

如果要完全隔离的部署环境，可以用 Docker。

### 创建 Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["node", "express-server.js"]
```

### 构建和运行
```bash
# 构建镜像
docker build -t market-activity-app .

# 运行容器
docker run -p 3000:3000 market-activity-app
```

### 特点
✅ 完全隔离  
✅ 易于部署  
✅ 支持多用户  
✅ 可在任何有 Docker 的系统上运行  

---

## 🌐 方案4：Nginx（高性能）

适合高并发场景。

### 配置文件（nginx.conf）
```nginx
server {
    listen 80;
    server_name localhost;
    root /Users/ray/WorkBuddy/20260320100957;

    location / {
        try_files $uri $uri/ /index.html;
        add_header 'Access-Control-Allow-Origin' '*';
    }

    location /admin.html {
        try_files $uri $uri/ /admin.html;
        add_header 'Access-Control-Allow-Origin' '*';
    }
}
```

### 启动
```bash
nginx -c /path/to/nginx.conf
```

### 访问
- http://localhost/index.html
- http://localhost/admin.html

---

## 🔄 如何从腾讯云切换到本地服务器

如果已部署到腾讯云，要切换到本地服务器：

### 步骤1：修改前端配置

在 `index.html` 中，查找类似这样的代码：

```javascript
// 原来指向腾讯云
const API_URL = 'https://market-activity-system.cos.bj.myqcloud.com';

// 改为本地
const API_URL = 'http://localhost:8000';
```

### 步骤2：更新数据存储接口

```javascript
// 原来
const response = await fetch('https://market-activity-system.cos.bj.myqcloud.com/activities.json', {...});

// 改为
const response = await fetch('http://localhost:8000/activities.json', {...});
```

### 步骤3：重启服务器
```bash
python3 local-server.py
```

---

## 📊 性能对比

| 指标 | Python | Node.js | Nginx | Docker |
|------|--------|---------|-------|--------|
| 启动时间 | <1s | <2s | <1s | <5s |
| 内存占用 | 20MB | 50MB | 10MB | 80MB |
| 并发能力 | 100 | 1000+ | 10000+ | 1000+ |
| CPU 占用 | 低 | 中 | 极低 | 中 |

---

## 🎯 推荐方案

### 如果你要...

**快速开发和测试**
→ 用 **Python 开发服务器**（已在用）

**正式生产环境**
→ 用 **Node.js + Express** 或 **Nginx**

**完整容器化部署**
→ 用 **Docker**

**高并发场景**
→ 用 **Nginx**

---

## 💾 数据持久化

### Python 方案
```
数据保存位置: .data/ 目录
自动保存: ✅ 是
手动导出: ✅ 支持
```

### Node.js 方案
```
数据保存位置: .data-express/ 目录
自动保存: ✅ 是
API 导出: ✅ /api/save
```

### 数据备份
```bash
# 备份数据
cp -r .data/ .data-backup-$(date +%Y%m%d-%H%M%S)

# 恢复数据
cp -r .data-backup-xxx/* .data/
```

---

## 🔒 安全性建议

### 本地服务器安全
1. **仅在 localhost 或内网使用**
   ```bash
   # 只监听本地
   python3 local-server.py --host localhost
   ```

2. **添加认证**
   ```python
   # 在 local-server.py 中添加认证
   if not is_authenticated(request):
       return 403
   ```

3. **配置防火墙**
   ```bash
   # 只允许特定 IP 访问
   sudo pfctl -f /etc/pf.conf
   ```

---

## 📱 从其他设备访问

### 如果在同一局域网

#### 找到你的本机 IP
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

#### 从其他设备访问
```
http://YOUR_IP:8000/index.html
```

### 示例
```bash
# 你的 Mac IP: 192.168.1.100
# 在其他电脑或手机上访问:
http://192.168.1.100:8000/index.html
```

---

## 🚀 快速总结

### 现在（Python）
```bash
python3 local-server.py
# 访问: http://localhost:8000
```

### 未来（生产）
```bash
npm install express cors
node express-server.js
# 访问: http://localhost:3000
```

### 终极（Docker）
```bash
docker build -t app .
docker run -p 3000:3000 app
# 访问: http://localhost:3000
```

---

## 🤔 常见问题

**Q: 能在公网上访问吗？**  
A: 需要配置 nginx 反向代理 + 域名 + SSL

**Q: 多人使用怎么办？**  
A: 用 Node.js/Nginx，支持更多并发连接

**Q: 数据如何备份？**  
A: `.data/` 目录定期备份即可

**Q: 可以同时运行多个实例吗？**  
A: 可以，改用不同端口（8001, 8002 等）

---

## ✅ 立即开始

### 方案1（现在）
```bash
python3 local-server.py
```

### 方案2（稍后升级）
```bash
npm install express cors
# 创建 express-server.js（见上方代码）
node express-server.js
```

---

**需要帮助？告诉我你想用哪个方案，我给你详细配置！** 🚀
