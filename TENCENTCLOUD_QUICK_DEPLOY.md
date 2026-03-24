# 腾讯云部署快速清单 ⚡

## ✅ 当前状态

你已经具备所有必需信息：

| 项目 | 值 | 状态 |
|------|-----|------|
| 腾讯云账户 | ✅ 有 | |
| COS 存储桶 | `nnqgcvte2026-1414699807` | ✅ 已创建 |
| 地域 | ap-guangzhou | ✅ 已配置 |
| API 密钥 | ✅ 有 | |
| 账户 ID | 100047455089 | ✅ 已确认 |

---

## 🚀 3 分钟快速部署

### 选项 A：通过腾讯云控制台（推荐，最简单）

**适合**：不想用命令行，喜欢可视化操作

**步骤**（3 分钟）：

1. 打开腾讯云控制台
   ```
   https://console.cloud.tencent.com/cos
   ```

2. 选择存储桶 `nnqgcvte2026-1414699807`

3. 点击 **上传文件** 按钮

4. 选择这 4 个文件：
   ```
   ✅ index.html
   ✅ admin.html
   ✅ login.html
   ✅ tencentcloud-adapter.js
   ```

5. 点击 **上传** 等待完成

6. 访问：
   ```
   https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/index.html
   ```

### 选项 B：使用 Python 脚本（推荐，最快）

**适合**：喜欢自动化，一条命令完成

**步骤**（1 分钟）：

1. 获取你的 API 密钥
   ```
   https://console.cloud.tencent.com/cam/capi
   ```

2. 编辑脚本，填入密钥
   ```bash
   vim deploy-cos-auto.py
   
   # 修改这两行
   "SECRET_ID": "你的 SecretId",     # ← 填这里
   "SECRET_KEY": "你的 SecretKey",   # ← 填这里
   ```

3. 运行脚本
   ```bash
   python3 deploy-cos-auto.py
   ```

4. 自动显示访问 URL

### 选项 C：使用腾讯云 CLI（高级）

**适合**：经常使用命令行

**步骤**：

```bash
# 1. 安装 coscmd
pip install coscmd

# 2. 配置凭证
coscmd config -a YOUR_SECRET_ID -s YOUR_SECRET_KEY -b nnqgcvte2026-1414699807 -r ap-guangzhou

# 3. 上传文件
coscmd upload index.html /
coscmd upload admin.html /
coscmd upload login.html /
coscmd upload tencentcloud-adapter.js /

# 4. 查看文件
coscmd list-objects /
```

---

## 📌 上传后的访问地址

```
前台报名：
https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/index.html

后台管理：
https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/admin.html
账户：admin
密码：admin123

登录页面：
https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/login.html
```

---

## 🔒 必做的配置

### 1. 设置存储桶为公开可读 ⭐⭐⭐⭐⭐

**重要**：否则访问会返回 403 Forbidden

在腾讯云控制台：

1. 选择存储桶 `nnqgcvte2026-1414699807`
2. 点击 **权限管理** → **Bucket 策略**
3. 点击 **编辑** 或 **添加语句**
4. 粘贴这个策略：

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "qcs": ["qcs::cam::anyone:anyone"]
      },
      "Action": "cos:GetObject",
      "Resource": "qcs::cos:ap-guangzhou:uid/100047455089:nnqgcvte2026-1414699807/*"
    }
  ],
  "version": "2.0"
}
```

5. 点击 **保存**

✅ 完成后就可以公开访问了

### 2. 启用 CORS（跨域访问）

如果前端和数据接口不同域：

1. 选择存储桶
2. **安全管理** → **CORS 配置**
3. 添加规则：
   ```json
   {
     "Origin": "*",
     "AllowedMethod": ["GET", "POST", "PUT", "DELETE"],
     "AllowedHeader": "*",
     "ExposeHeader": "*"
   }
   ```

---

## 📊 性能数据

| 指标 | 值 |
|------|-----|
| 存储空间 | ~200 KB（3 个 HTML 文件） |
| 首次加载 | 5-10 秒（CDN 缓存中） |
| 后续访问 | < 1 秒（CDN 加速） |
| 数据上传 | 50-200ms（广州地域） |
| 月成本 | ¥1-5 |

---

## 🎯 下一步（可选）

### 配置 CDN 加速（推荐）

为了更快的访问速度，配置 CDN：

1. 访问 https://console.cloud.tencent.com/cdn
2. 新建分发域名
3. 源站：`nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com`
4. 配置自己的域名（如 `market.example.com`）
5. 完成后访问：`https://market.example.com/index.html`

**优势**：
- ✅ 全国加速（延迟 < 100ms）
- ✅ 支持自己的域名
- ✅ 支持 HTTPS
- ✅ 流量防护

### 配置自动备份

腾讯云 COS 内置功能：

1. 启用 **版本控制**
   - 存储桶设置 → 版本控制 → 启用
   - 30 天内可恢复任何版本

2. 启用 **跨地域复制**
   - 自动复制到其他地域
   - 数据更安全

---

## ⚠️ 常见问题快速排查

### ❌ 访问返回 403 Forbidden

```
检查清单：
□ 存储桶策略已添加？
□ 对象 ACL 已设置为 Public Read？
□ 文件上传成功？
□ 没有防盗链限制？
```

**解决**：查看 **权限管理** → **Bucket 策略**

### ❌ 文件上传失败

```
检查清单：
□ 网络连接正常？
□ API 密钥正确？
□ 存储桶名称正确？
□ 地域正确？
□ 磁盘空间足够？
```

### ❌ 数据无法保存

```
检查清单：
□ tencentcloud-adapter.js 已上传？
□ index.html 中已引入适配器？
□ API 密钥有写入权限？
□ 存储桶名、地域、账户 ID 一致？
```

---

## 📞 支持资源

- **腾讯云 COS 文档**：https://cloud.tencent.com/document/product/436
- **COS 控制台**：https://console.cloud.tencent.com/cos
- **问题排查**：https://cloud.tencent.com/document/product/436/7751
- **价格计算**：https://cloud.tencent.com/product/cos/pricing

---

## 🎉 就这么简单！

**现在选一个方式，上传文件，3 分钟完成部署！** 🚀

有问题？告诉我具体错误信息，我帮你排查。
