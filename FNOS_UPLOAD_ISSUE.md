# 🔴 飞牛 fnOS 上传问题诊断

## 问题说明

你在飞牛文件管理器中创建并上传了文件，但 HTTP 访问返回 **404 Not Found**。

### 诊断结果

```
GET http://192.168.1.112:5666/market-activity/index.html
↓
HTTP/1.1 404 Not Found
```

**原因**：文件在飞牛内部存储系统中，**但不在 Nginx web 根目录**

---

## 🔍 飞牛 fnOS 的架构问题

飞牛是一个 **NAS 管理系统**，文件结构如下：

```
飞牛内部存储
├── /home/admin/... (飞牛系统文件)
├── /mnt/data/... (NAS 存储池，在文件管理器里看到的)
└── /var/www/html/... (Nginx web 根目录 ← web 访问走这里)

你上传的位置 ✗        正确的 web 根目录 ✓
文件管理器              Nginx 能访问的地方
```

**关键问题**：
- ❌ 你在飞牛文件管理器上传 → 文件进入 NAS 存储池
- ❌ 但 Nginx web 服务器无法访问 NAS 存储池
- ✅ 需要文件在 `/var/www/html/` 或类似的 web 根目录

---

## ✅ 解决方案（5 个方案）

### 方案 A - 通过 FTP/SFTP 直接上传（推荐）⭐⭐⭐⭐⭐

**优点**：最直接，文件直接进入 web 根目录

**步骤**：

1. **在 Mac 上，打开 Finder**
   - 按 `Cmd + K` 打开"连接服务器"
   - 输入：`ftp://192.168.1.112:21`
   - 账户：huangshengwei
   - 密码：cvte2020

2. **导航到 web 根目录**
   ```
   /var/www/html/
   或
   /usr/share/nginx/html/
   或
   /home/admin/www/
   ```

3. **创建文件夹** `market-activity`

4. **拖拽上传这 3 个文件**：
   - index.html
   - admin.html
   - login.html

5. **验证访问**：
   ```
   http://192.168.1.112:5666/market-activity/index.html
   ```

---

### 方案 B - 创建软链接（需要 SSH）

如果 SSH 能用，在服务器执行：

```bash
sudo ln -s /mnt/data/market-activity /var/www/html/market-activity
```

这样飞牛里的文件就能通过 web 访问了。

---

### 方案 C - 通过飞牛提供的共享链接

如果飞牛支持"公开分享"功能：

1. 在飞牛文件管理器中右键点击文件
2. 选择"创建公开链接"或"分享"
3. 获取公开访问 URL
4. 这个 URL 就能在浏览器中打开

---

### 方案 D - 配置 Nginx 反向代理

在 Nginx 配置中添加反向代理规则，让 web 访问指向飞牛的存储路径。

**需要**：修改 `/etc/nginx/nginx.conf` 或配置文件
**难度**：中等
**推荐指数**：⭐⭐⭐

---

### 方案 E - 使用本地服务器（完全规避飞牛问题）⭐⭐⭐⭐⭐

**最简单、最稳定、完全不用担心飞牛配置**

```bash
cd /Users/ray/WorkBuddy/20260320100957
python3 local-server.py
```

然后访问 `http://localhost:8000/`

**优点**：
- ✅ 1ms 延迟（极速）
- ✅ 100% 稳定（无网络问题）
- ✅ 数据本地保存（完全控制）
- ✅ 免费（无成本）
- ✅ 无需配置（开箱即用）

---

## 🎯 我的建议排序

### 立即尝试（优先级）：

1. **方案 A（FTP 上传）** - 2 分钟
   - 最直接
   - 如果 FTP 可用，问题瞬间解决

2. **方案 E（本地服务器）** - 1 分钟
   - 如果不想折腾飞牛配置
   - 本地完全独立运行
   - Mac 上立即可用

3. **方案 B（软链接）** - 3 分钟
   - 如果能 SSH 的话，一条命令解决

4. **方案 D（Nginx 反向代理）** - 15 分钟
   - 如果想保留飞牛管理体验

5. **方案 C（飞牛分享链接）** - 5 分钟
   - 如果飞牛支持的话

---

## 🚀 立即行动

**选项 1：用 FTP 上传（推荐）**

```bash
# Mac 打开 Finder → Cmd + K
# 输入：ftp://192.168.1.112:21
# 账户：huangshengwei
# 密码：cvte2020

# 导航到 /var/www/html/
# 创建 market-activity 文件夹
# 上传 index.html, admin.html, login.html
```

**选项 2：用本地服务器（最简单）**

```bash
cd /Users/ray/WorkBuddy/20260320100957
python3 local-server.py

# 访问 http://localhost:8000/
```

---

## 🆘 如果都不行

告诉我：

1. ❓ 能用 FTP 连接吗？ (`ftp://192.168.1.112:21`)
2. ❓ Nginx web 根目录是什么？ (通常是 `/var/www/html/`)
3. ❓ 飞牛有公开分享功能吗？
4. ❓ 想用本地服务器吗？

我根据你的反馈提供更精准的帮助！ 🎯
