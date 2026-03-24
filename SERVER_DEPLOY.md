# 市场活动管理系统 - 服务器部署指南

## 购买服务器

### 1. 腾讯云轻量应用服务器（推荐）
- 访问：https://cloud.tencent.com/product/lighthouse
- 选择配置：
  - 地域：广州/上海/北京（选离你最近的）
  - 镜像：Node.js 14/16/18
  - 配型：2核2G（每月约 50 元）
  - 流量：不限流（选 1TB 或更高）

### 2. 阿里云轻量应用服务器
- 访问：https://www.aliyun.com/product/swas
- 配型类似，价格差不多

---

## 服务器配置

### 1. 连接服务器
购买后，通过 SSH 连接：
```bash
ssh root@你的服务器IP
```

### 2. 安装 Node.js（如果镜像没有自带）
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. 创建项目目录
```bash
mkdir -p ~/market-activity
cd ~/market-activity
```

### 4. 上传代码
在**本地电脑**（你的 Mac）执行：

**方法 A：用 scp 上传**
```bash
# 在本地终端执行
scp server.js package.json root@你的服务器IP:~/market-activity/
```

**方法 B：用 Git（推荐）**
```bash
# 在服务器上
git clone https://github.com/你的仓库.git ~/market-activity
```

### 5. 安装依赖并启动
```bash
cd ~/market-activity
npm install
npm start
```

服务器会在 `http://服务器IP:3000` 运行

---

## 持续运行（PM2）

### 安装 PM2
```bash
npm install -g pm2
```

### 启动服务
```bash
pm2 start server.js --name market-api
pm2 save
pm2 startup
```

### 常用命令
```bash
pm2 logs market-api          # 查看日志
pm2 restart market-api       # 重启
pm2 stop market-api          # 停止
```

---

## 配置域名（可选）

### 1. 购买域名
在腾讯云/阿里云注册域名

### 2. 解析到服务器 IP
添加 A 记录：`@` → `服务器IP`

### 3. 配置 Nginx 反向代理
```bash
sudo apt-get install nginx
```

编辑 Nginx 配置：
```bash
sudo nano /etc/nginx/sites-available/default
```

替换为：
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

重启 Nginx：
```bash
sudo systemctl restart nginx
```

---

## 前端配置

修改 `index.html`，将 API 请求改为服务器地址：

### 找到数据操作部分，替换为：

```javascript
// ===== API 基础配置 =====
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : ''; // 部署后留空，使用相对路径

// 获取所有活动
async function getActivities() {
  const res = await fetch(`${API_BASE}/api/activities`);
  if (!res.ok) throw new Error('获取数据失败');
  return await res.json();
}

// 保存活动（新增/更新）
async function saveActivity(data) {
  const url = data.id 
    ? `${API_BASE}/api/activities/${data.id}` 
    : `${API_BASE}/api/activities`;
  const method = data.id ? 'PUT' : 'POST';
  
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) throw new Error('保存失败');
  return await res.json();
}

// 删除活动
async function deleteActivity(id) {
  const res = await fetch(`${API_BASE}/api/activities/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('删除失败');
  return await res.json();
}
```

### 将前端文件上传到服务器
```bash
# 在本地执行
scp index.html root@你的服务器IP:~/market-activity/public/
```

---

## SSL 证书（HTTPS，推荐）

### 使用 Let's Encrypt（免费）
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

证书会自动续期。

---

## 测试验证

1. 访问 `http://你的服务器IP` 或 `http://你的域名`
2. 登录（密码：admin123）
3. 创建活动，刷新页面，确认数据保存成功

---

## 常见问题

**Q: 服务器 IP 访问不了？**
A: 检查服务器防火墙，开放 80/443/3000 端口

**Q: 数据丢失了？**
A: 定期备份 `data/activities.json` 文件

**Q: 性能优化？**
A: 后期可改用 MySQL/PostgreSQL 数据库

---

## 下一步

1. 购买服务器
2. 按以上步骤配置
3. 告诉我服务器 IP 和域名（如果有），我帮你修改前端配置

需要我解释哪一步？
