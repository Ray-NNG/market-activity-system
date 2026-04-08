# 自定义域名配置指南

## 域名信息
- **备案域名**: `gqswmhmktmanagement.cn`
- **当前 COS 地址**: `http://nnqgcvte2026-1414699807.cos-website.ap-guangzhou.myqcloud.com/`
- **目标**: 通过 `http://gqswmhmktmanagement.cn` 访问系统

## 配置步骤

### 步骤1: 腾讯云 COS 控制台配置

1. 登录 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)
2. 进入存储桶 `nnqgcvte2026-1414699807`
3. 点击左侧菜单 **"域名与传输管理" → "自定义 CDN 加速域名"**
4. 点击 **"添加域名"**
5. 填写配置：
   - **域名**: `gqswmhmktmanagement.cn`
   - **加速地域**: 中国境内
   - **源站类型**: COS 源站
   - **回源协议**: HTTP（如需 HTTPS 需配置 SSL 证书）
6. 保存并等待部署（约 5-10 分钟）

### 步骤2: 配置 DNS 解析

在域名服务商（如腾讯云 DNSPod）添加 CNAME 记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| CNAME | @ | COS 提供的 CDN 加速域名 |
| CNAME | www | COS 提供的 CDN 加速域名 |

> **注意**: 添加 CNAME 记录后，需要等待 DNS 生效（通常 10 分钟 - 24 小时）

### 步骤3: 验证配置

配置完成后，访问以下地址测试：
- `http://gqswmhmktmanagement.cn`

## 可选: 开启 HTTPS

如需 HTTPS 访问，需要：
1. 在腾讯云 SSL 证书管理申请/上传证书
2. 在 CDN 域名配置中开启 HTTPS
3. 强制 HTTPS 跳转（推荐）

## 部署脚本更新

绑定自定义域名后，部署脚本 `upload-to-cos.py` 无需修改，继续上传到同一个存储桶即可。

## 常见问题

### Q: 备案域名和 COS 地域有关系吗？
A: 备案域名可以接入任何地域的 COS，但建议选择和用户就近的地域以获得更好访问速度。

### Q: 配置后访问出现 403 错误？
A: 检查存储桶的 **访问权限** 是否为 **公有读私有写**。

### Q: 如何同时支持 www 和非 www 访问？
A: 配置两条 CNAME 记录，一条主机记录为 `@`，一条为 `www`。

---

**配置完成后，更新以下文件中的访问地址：**
- README.md
- package.json（如有）
- 系统内的链接（如有硬编码地址）
