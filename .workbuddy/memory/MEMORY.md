# 长期记忆库

## 服务器连接信息

### 192.168.1.112 (192.168.1.112:5666) - Nginx 服务器

**基本信息**：
- 地址: 192.168.1.112
- Nginx 端口: 5666
- SSH 端口: 22（标准）
- 用户: huangshengwei
- 密码: cvte2020 ✅ （最后更新: 2026-03-23）

**连接状态**：
- HTTP: ✅ 连接正常 (200 OK)
- SSH: ❌ 账户被禁用 (shell 无效)
  - 错误: "This account is currently not available"
  - 需要: 服务器管理员修复 shell 设置
  - 方案: 执行 `sudo usermod -s /bin/bash huangshengwei`

**当前部署状态**：
- 系统文件: ❌ 未完全部署
- 原因: SSH 连接失败，无法自动上传文件
- 需要: 服务器管理员或手动 SFTP 上传

---

## GitHub 仓库信息

**仓库**: Ray-NNG/market-activity-system
- SSH 密钥: /Users/ray/.ssh/id_ed25519_github
- 部署地址: https://ray-nng.github.io/market-activity-system/

**后端存储配置**（已废弃，改用 COS）：
- 原方案: jsonbin.io (美国, 延迟 800ms+, 成本 ¥50+/月)
- 问题: 国内网络卡顿，用户反馈严重
- 新方案: 腾讯云 COS (北京, 延迟 50-100ms, 成本 ¥1-5/月)

**新部署方案** (已实施):
- 本地开发: local-server.py (延迟 1ms, 免费)
- 生产环境: 腾讯云 COS (延迟 80ms, ¥1-5/月)
- 适配器: tencentcloud-adapter.js

---

## 系统特性

**权限体系**（2026-03-27 重构）：
- **账号体系**：每个用户有独立 username/password/role/name，数据存 `mcm_users` + COS `sys_config.json` users字段
- 三级角色：👑超级管理员 / 🛡️管理员 / 👤使用人员
- 默认账号：superadmin/super2024, admin/admin123, viewer/view123
- 登录：输入账号+密码，从users列表匹配，确定角色
- 超级管理员：全部菜单，含系统设置、账户权限管理（创建/编辑/删除账号）
- 管理员：可增删改活动/渠道 + 可访问系统设置（改自己密码），不可访问账户权限管理
- 使用人员：只读，隐藏新建按钮和系统管理菜单
- 账号数据通过 COS sys_config.json 跨设备同步，B设备可用bucket同步账号列表

**复盘页渠道功能**（2026-03-25）：
- 复盘列表新增地市筛选、渠道导入按钮、关联渠道摘要显示
- 活动详情「关联渠道」Tab 新增：地市自动预选筛选、搜索框、分层筛选、只看已关联、面板内导入按钮

**COS集中管理**（2026-03-25）：
- 超管保存COS配置时写 sys_config.json 到COS（包含密码）
- 其他设备启动时 fetchSysConfigFromCOS() 自动同步

**渠道名单**（2026-03-25）：
- 侧边栏「渠道名单」页面，支持 Excel 导入（SheetJS），字段自动识别
- 渠道数据存 localStorage mcm_channels + COS data.json channels 字段
- 活动详情第6个Tab「关联渠道」，创建活动时可多选关联

**后台管理**（原有）：
- 默认账户: admin / admin123
- 功能: 数据查看、筛选、导出、设置

**关键改进**（2026-03-23）：
- 离线队列系统: 网络差时自动离线，支持 100% 离线工作
- 增量保存: 单条活动只上传 5-10KB，vs 原来 500KB+（减少 98%）
- 重试机制: 失败自动重试最多 3 次
- 超时优化: 分阶段超时控制，避免请求过早中断

---

## 本地部署脚本

**Python 本地服务器**：
- 文件: local-server.py
- 启动: `python3 local-server.py`
- 访问: http://localhost:8000
- 延迟: 1ms (极速)
- 成本: ¥0 (免费)

---

## Mac 连接方式（推荐顺序）

### 1. 浏览器 (最简单)
```
http://192.168.1.112:5666/
```

### 2. SSH 终端 (部署推荐)
```bash
ssh huangshengwei@192.168.1.112
# 密码: cvte2020
# 注: 目前账户被禁用，需要管理员修复
```

### 3. Finder SFTP (友好拖拽)
```
Cmd + K → sftp://huangshengwei@192.168.1.112:22
```

### 4. Cyberduck (功能全)
- 下载: https://cyberduck.io/
- 支持拖拽上传、多协议

### 5. VS Code Remote
- 安装扩展: Remote - SSH
- 直接编辑服务器文件

---

## 部署流程

### 本地测试 (推荐先做)
```bash
cd /Users/ray/WorkBuddy/20260320100957
python3 local-server.py
# 访问: http://localhost:8000
```

### 远程部署 (到 192.168.1.112)

**前置**: 需要 SSH 可用（目前不可用）

**流程**:
1. SSH 连接到服务器
2. 运行部署脚本: `bash -c "$(curl -fsSL ...server-install.sh)"`
3. 等待 2-3 分钟
4. 访问: http://192.168.1.112:5666/market-activity/

---

## 常见问题

### Q: SSH 连接失败怎么办?
**A**: 
1. 检查网络: `ping 192.168.1.112`
2. 当前账户被禁用，需要服务器管理员修复
3. 执行方案: `sudo usermod -s /bin/bash huangshengwei`

### Q: 网络卡顿怎么解决?
**A**:
1. 使用本地服务器测试 (local-server.py) - 1ms 延迟
2. 迁移到腾讯云 COS - 50-100ms 延迟 (国内)
3. 启用离线队列 - 即使网络差也能工作

### Q: 怎么备份数据?
**A**:
- 本地: 数据保存在 .data/ 目录
- 腾讯云: COS 自动备份
- 导出: 后台管理可导出 CSV/JSON

---

## 更新历史

- 2026-03-23: 创建 MEMORY.md，更新服务器密码为 cvte2020，诊断 SSH 账户禁用问题
- 2026-03-23: 实现离线队列系统、腾讯云 COS 部署、本地服务器方案
- 2026-03-27: 修复COS签名终极错误（signKey UTF-8字节处理），新密钥已全面验证
- 2026-03-27: COS配置完全修通：新密钥 AKIDS3QaXHxPcbQ1NTLzlJc2DAtOegT0Mmlz / HEzWpwd7XqX2V9jEdtwkgYDdpmUWJrAE，存储桶 nnqgcvte2026-1414699807（ap-guangzhou），sys_config.json已写入COS，公有读私有写+空referer允许，data.json/channels.json读写全部200✅
- 2026-03-29: Safari 对 myqcloud.com 域名触发下载弹窗无法解决，改用 Cloudflare Pages 托管静态文件。**正式访问地址改为 https://market-activity-system.pages.dev**（数据读写仍用腾讯云 COS）
- 2026-03-29: COS 强制下载根本原因：**腾讯云2024年1月后新建存储桶的安全策略**，所有默认域名（对象存储域名、静态网站域名）访问均强制下载（x-cos-force-download: true），无法通过API或控制台关闭，唯一官方方案是绑定已备案自定义域名。❌ COS 任何默认域名都无法在浏览器直接打开 index.html。✅ 正式地址用 **https://market-activity-system.pages.dev**（Cloudflare Pages，无此限制，访问正常）
- 2026-03-29: 登录兜底修复（v2026.03.29-12）：新设备/新域名本地无数据+COS连不上时，用内置账号 superadmin/super2024 和 admin/admin123 兜底登录
- 2026-03-30: 视觉优化（v2026.03.30-11）：针对用户反馈进度条颜色"太花里胡哨，看着眼花缭乱"，进行全面颜色方案优化。**主要改进**：1) 进度条从随机多色改为基于状态和进度的统一配色（完成=绿色，执行中=橙色，策划中=蓝色，进度值决定深浅）；2) 各图表颜色从鲜艳混乱改为以蓝色系为主的协调方案；3) 整体视觉更专业、清爽。
