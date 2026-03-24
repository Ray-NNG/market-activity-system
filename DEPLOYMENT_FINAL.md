# 市场活动管理系统 - 最终部署方案

## 🔴 当前问题

服务器 (192.168.1.112:5666) 的 Nginx 配置**禁止了所有文件上传**：
- ❌ HTTP PUT 返回 405 (Not Allowed)
- ❌ HTTP POST 返回 400 (Bad Request)
- ❌ WebDAV MKCOL 返回 405
- ❌ SSH/SCP 连接失败

这表示服务器采用了严格的安全配置，**不允许通过网络上传文件**。

---

## ✅ 解决方案 (推荐顺序)

### 方案 1️⃣ **[最简单] 让服务器管理员配置 web 目录**

服务器管理员需要执行：

```bash
# SSH 登录到服务器
ssh -p 5666 huangshengwei@192.168.1.112

# 创建项目目录
sudo mkdir -p /var/www/market-activity
cd /var/www/market-activity

# 下载系统文件（从 GitHub 或其他源）
# 或者通过 SCP 上传（管理员执行）
scp -P 5666 admin.html huangshengwei@192.168.1.112:/var/www/market-activity/

# 配置 Nginx
sudo vi /etc/nginx/sites-available/default

# 添加配置：
location /market-activity {
    alias /var/www/market-activity;
    index index.html;
}

# 重启 Nginx
sudo systemctl restart nginx
```

然后访问：`http://192.168.1.112:5666/market-activity/index.html`

---

### 方案 2️⃣ **[推荐] 在本地运行，然后部署**

#### 第 1 步：在本地验证系统

```bash
cd /Users/ray/WorkBuddy/20260320100957
python3 -m http.server 8000
```

访问 http://localhost:8000/index.html 验证系统正常

#### 第 2 步：打包所有文件

我已经准备好了完整的文件包：

```
/Users/ray/WorkBuddy/20260320100957/
├── index.html           (144 KB) - 前台报名页面
├── admin.html           (29 KB)  - 后台管理页面
├── login.html           (4.6 KB) - 登录页面
├── deploy-package.html  (8.9 KB) - 自动部署程序
└── tencentcloud-adapter.js (8.6 KB) - 腾讯云适配器
```

#### 第 3 步：通过管理员上传

**给服务器管理员的说明**：

```bash
# 在服务器上执行
mkdir -p /var/www/market-activity

# 将上述文件复制到该目录
# 方式可以是：
# 1. 从 GitHub 克隆
# 2. 通过 SCP 上传
# 3. 使用 SFTP 工具 (FileZilla)

# 设置权限
chmod -R 755 /var/www/market-activity

# 配置 Nginx（见方案 1）
```

---

### 方案 3️⃣ **[备选] 使用容器部署**

#### Docker 方式

创建 Dockerfile：

```dockerfile
FROM nginx:latest
COPY ./index.html /usr/share/nginx/html/
COPY ./admin.html /usr/share/nginx/html/
COPY ./login.html /usr/share/nginx/html/
COPY ./tencentcloud-adapter.js /usr/share/nginx/html/
EXPOSE 5666
CMD ["nginx", "-g", "daemon off;"]
```

构建和运行：

```bash
docker build -t market-activity .
docker run -d -p 5666:80 market-activity
```

---

### 方案 4️⃣ **[应急] 更换部署端口**

如果 5666 无法修改，可以在另一个端口部署：

```bash
# 在服务器上
python3 -m http.server 8001 --directory /var/www/market-activity &
```

然后访问：`http://192.168.1.112:8001/index.html`

---

## 📊 推荐部署流程

```
第 1 步：本地验证 ✓ (已完成)
   ↓
第 2 步：获取管理员权限 (需要)
   ↓
第 3 步：选择方案执行 (1、2 或 3)
   ↓
第 4 步：验证系统访问 (需要)
   ↓
完成！
```

---

## 🔑 关键文件说明

### index.html (144 KB)
- **用途**: 前台报名页面
- **功能**: 用户填写报名表单，选择时间段
- **保存**: 数据自动保存到后端存储

### admin.html (29 KB)
- **用途**: 后台管理页面
- **功能**: 查看所有报名、筛选、导出、设置
- **登录**: 默认用户 `admin` 密码 `admin123`

### login.html (4.6 KB)
- **用途**: 登录页面
- **功能**: 管理员身份认证

### deploy-package.html (8.9 KB)
- **用途**: 自动部署程序
- **功能**: 一键检查和部署系统

### tencentcloud-adapter.js (8.6 KB)
- **用途**: 腾讯云 COS 存储适配器
- **功能**: 如果使用腾讯云存储，需要这个文件

---

## 📋 部署清单

- [ ] 确认服务器管理员身份
- [ ] 选择合适的部署方案 (建议方案 2)
- [ ] 创建项目目录 `/var/www/market-activity`
- [ ] 上传或复制所有 HTML 文件
- [ ] 配置 Nginx (如需要)
- [ ] 重启 web 服务
- [ ] 访问 http://192.168.1.112:5666/market-activity/index.html
- [ ] 用 `admin/admin123` 登录后台测试
- [ ] 提交测试报名确认数据保存

---

## 🆘 故障排查

### 问题：无法访问
**解决**：
1. 确认服务器 IP 和端口正确
2. 检查防火墙设置
3. 查看 Nginx 错误日志：`sudo tail -f /var/log/nginx/error.log`

### 问题：文件 404 (Not Found)
**解决**：
1. 确认文件已上传到正确目录
2. 检查文件权限：`chmod -R 755 /var/www/market-activity`
3. 确认 Nginx 配置中的 `alias` 或 `root` 路径正确

### 问题：登录失败
**解决**：
1. 确认用户名是 `admin` (不是 `administrator`)
2. 确认密码是 `admin123` (区分大小写)
3. 检查浏览器控制台是否有错误信息

### 问题：数据保存失败
**解决**：
1. 检查后端存储配置 (jsonbin.io 或腾讯云)
2. 查看浏览器控制台 Network 标签
3. 检查 CORS 配置

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 错误信息或屏幕截图
2. 服务器日志 (如可能)
3. 部署方案编号

---

## 📦 所有准备文件清单

生成的文件位置：`/Users/ray/WorkBuddy/20260320100957/`

| 文件 | 大小 | 说明 |
|------|------|------|
| index.html | 144 KB | 前台报名 |
| admin.html | 29 KB | 后台管理 |
| login.html | 4.6 KB | 登录 |
| deploy-package.html | 8.9 KB | 自动部署 |
| tencentcloud-adapter.js | 8.6 KB | 腾讯云适配器 |
| final-deploy.py | 12 KB | Python 部署脚本 |
| DEPLOYMENT_FINAL.md | 本文件 | 部署说明 |

---

**最后更新**: 2026-03-23  
**部署工程师**: AI 助手  
**项目**: 市场活动全流程管理系统
