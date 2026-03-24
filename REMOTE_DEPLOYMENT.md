# 服务器部署指南 (192.168.1.112:5666)

## 🎯 部署状态

✅ **服务器已连接**
- 地址: http://192.168.1.112:5666
- 状态: 在线 (HTTP 200)
- 已检测到运行中的 web 服务

⚠️ **部分文件状态**
- ✅ index.html - 可访问
- ❌ admin.html - 未找到
- ❌ login.html - 未找到

---

## 🚀 部署方式选择

### 方案 A：手动上传文件（推荐）

由于远程服务器的 HTTP 接口不支持直接 PUT/POST，请手动将以下文件复制到服务器的 web 根目录：

**需要上传的文件**：
```
/Users/ray/WorkBuddy/20260320100957/
├── index.html           ← 前台系统
├── admin.html          ← 后台管理
├── login.html          ← 登录页面
├── diagnostic.html     ← 诊断工具
└── tencentcloud-adapter.js  ← 适配器
```

**手动上传步骤**：

1. **使用 SCP 上传**（如果支持 SSH）
```bash
# 连接 SSH
ssh -p 5666 huangshengwei@192.168.1.112

# 上传文件
scp -P 5666 -r /Users/ray/WorkBuddy/20260320100957/*.html \
    huangshengwei@192.168.1.112:/path/to/webroot/

scp -P 5666 /Users/ray/WorkBuddy/20260320100957/tencentcloud-adapter.js \
    huangshengwei@192.168.1.112:/path/to/webroot/
```

2. **使用 FTP/SFTP 上传**
   - 使用 FTP 客户端 (如 FileZilla)
   - 连接到 192.168.1.112 端口 5666
   - 用户名: huangshengwei
   - 密码: WKi3,Ly{1g
   - 上传所有文件到 web 根目录

3. **使用 Windows 共享或其他方式**
   - 如果服务器在本地网络，可能支持 Samba 共享
   - 直接复制文件到共享目录

### 方案 B：一键部署脚本

如果你有访问服务器的终端权限，运行：

```bash
# SSH 连接到服务器
ssh -p 5666 huangshengwei@192.168.1.112

# 在服务器上运行以下命令
cd /path/to/webroot

# 直接拉取文件
wget -q https://raw.githubusercontent.com/Ray-NNG/market-activity-system/main/index.html
wget -q https://raw.githubusercontent.com/Ray-NNG/market-activity-system/main/admin.html
wget -q https://raw.githubusercontent.com/Ray-NNG/market-activity-system/main/login.html
wget -q https://raw.githubusercontent.com/Ray-NNG/market-activity-system/main/tencentcloud-adapter.js

# 或使用 curl
curl -O https://raw.githubusercontent.com/Ray-NNG/market-activity-system/main/index.html
```

### 方案 C：编辑现有 index.html

如果 index.html 已存在于服务器，你可以：

1. 下载当前的 index.html
```bash
curl http://192.168.1.112:5666/index.html > current-index.html
```

2. 对比和合并内容
3. 上传更新版本

---

## 📋 部署文件清单

| 文件 | 用途 | 大小 | 优先级 |
|------|------|------|--------|
| **index.html** | 前台系统报名 | 148K | 🔴 必须 |
| **admin.html** | 后台管理系统 | 30K | 🔴 必须 |
| **login.html** | 登录页面 | 5K | 🔴 必须 |
| **diagnostic.html** | 诊断工具 | 5K | 🟡 可选 |
| **tencentcloud-adapter.js** | 腾讯云适配器 | 9K | 🟡 可选* |

*如果使用腾讯云 COS 存储

---

## 🔧 服务器配置建议

### 1. 确保数据存储目录

如果使用本地存储，需要创建数据目录：

```bash
# 在 web 根目录下
mkdir -p .data
chmod 755 .data
```

### 2. 配置 CORS（如使用跨域）

如果前后端分离，需要配置 CORS，在 nginx 或 Apache 配置中添加：

```nginx
add_header Access-Control-Allow-Origin "*";
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
add_header Access-Control-Allow-Headers "Content-Type";
```

### 3. 配置 HTTPS（推荐用于生产）

```bash
# 使用 Let's Encrypt 获取免费证书
certbot certonly --standalone -d yourdomain.com
```

---

## ✅ 部署检查清单

部署完成后，逐项检查：

- [ ] 访问 http://192.168.1.112:5666/index.html 可以看到前台
- [ ] 访问 http://192.168.1.112:5666/admin.html 可以看到后台
- [ ] 访问 http://192.168.1.112:5666/login.html 可以看到登录页
- [ ] 能在前台提交报名信息
- [ ] 能登录后台查看数据（密码: admin123）
- [ ] 能导出数据（JSON/CSV）
- [ ] 能设置系统参数

---

## 🆘 故障排查

### 问题 1: 文件上传失败 (405 错误)

**原因**: 服务器不支持 HTTP PUT 方法

**解决方案**:
1. 使用 SFTP/SCP 上传
2. 使用 FTP 客户端上传
3. 直接登录服务器上传

### 问题 2: 后台无法访问 (404 错误)

**原因**: admin.html 文件未上传到 web 根目录

**解决方案**:
1. 确认文件是否存在
2. 检查 web 服务器配置
3. 查看服务器日志

### 问题 3: 数据无法保存

**原因**: 没有创建数据存储目录或权限不足

**解决方案**:
```bash
# 在服务器上运行
mkdir -p /path/to/webroot/.data
chmod 777 /path/to/webroot/.data  # 或根据需要调整权限
```

### 问题 4: CORS 错误

**原因**: 浏览器跨域限制

**解决方案**:
1. 在服务器配置中添加 CORS 头
2. 使用同源方式访问
3. 使用代理转发

---

## 📞 技术支持

需要帮助？提供以下信息：

1. 服务器 web 根目录路径
2. 服务器操作系统类型
3. 使用的 web 服务器 (Nginx/Apache/IIS)
4. 完整的错误信息或日志

---

## 📊 性能优化

### 启用 Gzip 压缩

在 Nginx 中：
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### 启用缓存

```nginx
expires 30d;
add_header Cache-Control "public, max-age=2592000";
```

### 启用 HTTP/2

```nginx
listen 443 ssl http2;
```

---

**部署日期**: 2026-03-23  
**服务器**: 192.168.1.112:5666  
**用户**: huangshengwei
