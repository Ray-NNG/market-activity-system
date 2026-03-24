# 🚀 到 192.168.1.112:5666 的部署指南

**部署日期**: 2026-03-23  
**目标服务器**: http://192.168.1.112:5666  
**用户**: huangshengwei  
**密码**: WKi3,Ly{1g

---

## 📊 部署状态概览

### ✅ 已完成
- ✅ 服务器连接测试 - **通过** (HTTP 200)
- ✅ 前台系统已存在 - index.html 可访问
- ✅ 生成了多个部署脚本和指南

### ⏳ 待完成
- ⏳ 上传 admin.html 到服务器
- ⏳ 上传 login.html 到服务器
- ⏳ 上传其他必要文件

---

## 🎯 5 分钟快速部署

### 方案 1: 使用 curl 一键部署 (推荐)

```bash
# 一条命令一次性上传所有文件
cd /Users/ray/WorkBuddy/20260320100957

# 上传前台
curl -X PUT --data-binary "@index.html" http://192.168.1.112:5666/index.html

# 上传后台
curl -X PUT --data-binary "@admin.html" http://192.168.1.112:5666/admin.html

# 上传登录
curl -X PUT --data-binary "@login.html" http://192.168.1.112:5666/login.html

# 上传诊断工具
curl -X PUT --data-binary "@diagnostic.html" http://192.168.1.112:5666/diagnostic.html

# 上传适配器
curl -X PUT --data-binary "@tencentcloud-adapter.js" http://192.168.1.112:5666/tencentcloud-adapter.js
```

### 方案 2: 使用 Bash 脚本部署

```bash
cd /Users/ray/WorkBuddy/20260320100957
bash deploy.sh
```

### 方案 3: 使用 Python 脚本部署

```bash
python3 deploy-http.py
```

### 方案 4: SSH 远程部署 (如果支持)

```bash
# 使用 SCP 上传文件
scp -P 5666 -r *.html tencentcloud-adapter.js \
    huangshengwei@192.168.1.112:/path/to/webroot/
```

### 方案 5: 手动 SFTP 上传

1. 打开 SFTP 客户端 (如 FileZilla)
2. 连接信息:
   - 主机: 192.168.1.112
   - 端口: 5666
   - 用户: huangshengwei
   - 密码: WKi3,Ly{1g
3. 将以下文件上传到服务器:
   ```
   index.html
   admin.html
   login.html
   diagnostic.html
   tencentcloud-adapter.js
   ```

---

## 📋 需要部署的文件列表

| 文件名 | 大小 | 用途 | 优先级 |
|--------|------|------|--------|
| index.html | 148 KB | 前台报名系统 | 🔴 **必须** |
| admin.html | 30 KB | 后台管理系统 | 🔴 **必须** |
| login.html | 5 KB | 登录页面 | 🔴 **必须** |
| diagnostic.html | 5 KB | 诊断工具 | 🟡 可选 |
| tencentcloud-adapter.js | 9 KB | 腾讯云适配器 | 🟢 可选* |

*如果使用腾讯云 COS 存储则必要

---

## ✅ 部署验证

部署完成后，访问以下地址验证：

```
前台报名: http://192.168.1.112:5666/index.html
后台管理: http://192.168.1.112:5666/admin.html
登录页面: http://192.168.1.112:5666/login.html
诊断工具: http://192.168.1.112:5666/diagnostic.html
```

**默认管理员密码**: `admin123`

---

## 🔍 诊断信息

### 服务器检测结果

```
🌐 服务器地址: 192.168.1.112:5666
✅ 连接状态: 在线
✅ HTTP 响应码: 200
✅ Web 服务: 运行中

✅ index.html: 可访问
❌ admin.html: 未检测到
❌ login.html: 未检测到
⚠️  tencentcloud-adapter.js: 未检测到
```

### 建议的后续步骤

1. ✅ **立即执行**: 上传缺失的 HTML 文件
   ```bash
   # 最简单的方式 - 复制粘贴这两行命令
   curl -X PUT --data-binary "@/Users/ray/WorkBuddy/20260320100957/admin.html" http://192.168.1.112:5666/admin.html
   curl -X PUT --data-binary "@/Users/ray/WorkBuddy/20260320100957/login.html" http://192.168.1.112:5666/login.html
   ```

2. ⏳ **验证**: 访问 admin.html 确认上传成功

3. ✅ **配置**: 在后台设置系统参数（如时间段、报名选项等）

4. 🚀 **发布**: 分享前台链接给用户报名

---

## 🛠️ 生成的部署工具

我为你生成了多个部署脚本：

| 文件 | 说明 | 用法 |
|------|------|------|
| **deploy.sh** | Bash 自动部署脚本 | `bash deploy.sh` |
| **deploy-http.py** | Python HTTP 部署脚本 | `python3 deploy-http.py` |
| **deploy-remote.py** | Python SSH 部署脚本 | `python3 deploy-remote.py` |
| **REMOTE_DEPLOYMENT.md** | 详细部署指南 | 阅读文档 |

---

## 📝 常见问题

### Q1: 如何修改管理员密码?
A: 在后台登录后，点击"设置" → "更改密码"

### Q2: 如何备份数据?
A: 在后台点击"导出数据"，选择 JSON 或 CSV 格式

### Q3: 如何设置报名时间段?
A: 在后台点击"设置" → "时间管理"，添加或编辑时间段

### Q4: 如何查看报名统计?
A: 在后台首页可以看到实时的报名数据和统计图表

### Q5: 如何与腾讯云 COS 集成?
A: 查看 `TENCENTCLOUD_INTEGRATION.md` 文件

---

## 🔐 安全建议

### 立即执行
- [ ] 修改默认管理员密码
- [ ] 启用 HTTPS (如使用公网)
- [ ] 配置 IP 白名单 (如只在内网使用)

### 定期维护
- [ ] 每周备份数据
- [ ] 定期检查访问日志
- [ ] 及时更新系统文件

### 生产环境
- [ ] 使用 SSL 证书
- [ ] 启用日志审计
- [ ] 定期安全评估

---

## 📞 获得帮助

如果遇到问题，提供以下信息：

1. 上传时的 HTTP 状态码
2. 浏览器控制台的错误信息
3. 服务器日志内容
4. 网络环境描述 (内网/公网)

---

## 📊 系统特性

✅ **前台功能**
- 用户信息填写（姓名、联系方式、单位等）
- 时间段选择和预订
- 实时数据提交和验证
- 响应式设计（支持移动端）

✅ **后台功能**
- 数据查看和筛选
- 高级搜索
- 数据导出 (JSON/CSV/Excel)
- 系统设置和参数配置
- 用户管理和权限控制

✅ **技术特点**
- 本地数据存储（无需数据库）
- 跨域支持 (CORS)
- 腾讯云 COS 适配
- jsonbin.io 集成 (备选)
- 完全离线可用

---

**上次更新**: 2026-03-23 14:45  
**部署版本**: v1.0.0  
**支持的浏览器**: Chrome, Firefox, Safari, Edge (现代版本)
