# 腾讯云部署 - 文件上传清单

## 📁 需要上传的文件

| 文件 | 大小 | 用途 | 必需 |
|------|------|------|------|
| **index.html** | 144 KB | 前台报名系统 | ✅ 必需 |
| **admin.html** | 29 KB | 后台管理系统 | ✅ 必需 |
| **login.html** | 4.6 KB | 登录页面 | ✅ 必需 |
| **tencentcloud-adapter.js** | 8.6 KB | COS 数据适配器 | ✅ 必需 |

**总大小**：约 185 KB

---

## 🚀 上传方式选择

### 方式 A：腾讯云控制台（推荐，最简单）✨

**步骤**：

1. 打开腾讯云控制台
   ```
   https://console.cloud.tencent.com/cos
   ```

2. 选择存储桶：`nnqgcvte2026-1414699807`

3. 点击 **上传文件**

4. 选择这 4 个文件（按顺序）：
   ```
   1️⃣  index.html
   2️⃣  admin.html
   3️⃣  login.html
   4️⃣  tencentcloud-adapter.js
   ```

5. 点击 **上传** → 等待完成

6. ✅ 完成！

**所需时间**：3 分钟
**难度**：⭐☆☆☆☆（最简单）

---

### 方式 B：Python 脚本（推荐，最快）⚡

**前置**：需要你的 SecretId 和 SecretKey

**步骤**：

1. 编辑脚本 `deploy-cos-auto.py`：
   ```bash
   nano deploy-cos-auto.py
   # 或者用任何编辑器打开
   ```

2. 找到这两行（第 18-19 行）：
   ```python
   "SECRET_ID": "",  # ← 填你的 SecretId
   "SECRET_KEY": "",  # ← 填你的 SecretKey
   ```

3. 改成：
   ```python
   "SECRET_ID": "你复制的 SecretId",
   "SECRET_KEY": "你复制的 SecretKey",
   ```

4. 保存文件

5. 打开终端，运行：
   ```bash
   cd /Users/ray/WorkBuddy/20260320100957
   python3 deploy-cos-auto.py
   ```

6. 脚本自动：
   - ✅ 检查文件
   - ✅ 连接 COS
   - ✅ 上传所有文件
   - ✅ 显示访问 URL

7. ✅ 完成！

**所需时间**：1 分钟
**难度**：⭐⭐☆☆☆（简单）

---

### 方式 C：腾讯云 CLI（高级用户）

**前置**：已安装 coscmd

```bash
# 1. 配置凭证
coscmd config \
  -a YOUR_SECRET_ID \
  -s YOUR_SECRET_KEY \
  -b nnqgcvte2026-1414699807 \
  -r ap-guangzhou

# 2. 上传文件
coscmd upload index.html /
coscmd upload admin.html /
coscmd upload login.html /
coscmd upload tencentcloud-adapter.js /

# 3. 验证
coscmd list-objects /
```

**所需时间**：2 分钟
**难度**：⭐⭐⭐☆☆（中等）

---

## ✅ 上传前检查清单

在上传之前，确认以下事项：

### 1. 腾讯云配置
- [ ] 登录了腾讯云账户
- [ ] 可以访问控制台（https://console.cloud.tencent.com/cos）
- [ ] 存储桶 `nnqgcvte2026-1414699807` 存在
- [ ] 地域是 `ap-guangzhou`（广州）

### 2. API 密钥（如果用脚本）
- [ ] 获取了 SecretId
- [ ] 获取了 SecretKey
- [ ] 密钥有 COS 的读写权限

### 3. 本地文件
- [ ] index.html 存在（144 KB）
- [ ] admin.html 存在（29 KB）
- [ ] login.html 存在（4.6 KB）
- [ ] tencentcloud-adapter.js 存在（8.6 KB）

### 4. 权限配置
- [ ] 已设置存储桶为公开可读（Bucket 策略）
- [ ] 已设置 CORS（如需要）

---

## 🔒 必做配置：设置公开读权限

**否则上传后无法访问（会返回 403）**

### 步骤：

1. 打开腾讯云 COS 控制台

2. 选择存储桶 `nnqgcvte2026-1414699807`

3. 点击 **权限管理** → **Bucket 策略**

4. 如果没有策略，点击 **添加语句**

5. 按照以下配置：

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

6. 点击 **保存**

✅ 完成后就可以公开访问了

---

## 📌 上传完成后的访问地址

上传成功后，使用以下 URL 访问：

### 前台报名系统
```
https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/index.html
```

用户通过这个链接填写报名信息

### 后台管理系统
```
https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/admin.html
```

登录信息：
- 账户：`admin`
- 密码：`admin123`

可以在后台：
- 📊 查看所有报名数据
- 🔍 筛选和搜索
- 📥 导出数据（CSV/JSON）
- ⚙️ 管理系统设置

### 登录页面
```
https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/login.html
```

---

## 🧪 验证上传成功

上传完成后，验证文件：

### 1. 在腾讯云控制台检查

- 打开存储桶 `nnqgcvte2026-1414699807`
- 应该看到 4 个文件列出
- 文件大小应该匹配

### 2. 在浏览器中测试

打开这个链接：
```
https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/index.html
```

如果看到前台报名页面 → ✅ 成功！

### 3. 测试功能

在前台页面：
1. 填写报名信息
2. 点击提交
3. 进入后台验证数据已保存

---

## ⚠️ 常见问题

### Q: 访问返回 403 Forbidden

**原因**：存储桶权限未设置为公开可读

**解决**：
1. 查看 **权限管理** → **Bucket 策略**
2. 确认已添加公开读权限策略
3. 可能需要刷新浏览器缓存

### Q: 文件上传失败

**原因**：网络问题或 API 密钥错误

**解决**：
1. 检查网络连接
2. 确认 SecretId 和 SecretKey 正确
3. 确保 API 密钥有 COS 写入权限
4. 重试上传

### Q: 页面打不开

**原因**：可能是 DNS 解析延迟

**解决**：
1. 等待 2-3 分钟
2. 清除浏览器缓存
3. 用隐私浏览模式尝试
4. 检查网络连接

### Q: 数据无法保存

**原因**：tencentcloud-adapter.js 未正确上传或加载

**解决**：
1. 确认 tencentcloud-adapter.js 已上传
2. 打开浏览器开发者工具（F12）
3. 查看 Console 中的错误信息
4. 检查存储桶名、地域、账户 ID 是否一致

---

## 📈 上传进度示例

```
📤 开始上传...

[1/4] 上传 index.html...
✅ 完成 (144 KB)
📍 https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/index.html

[2/4] 上传 admin.html...
✅ 完成 (29 KB)
📍 https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/admin.html

[3/4] 上传 login.html...
✅ 完成 (4.6 KB)
📍 https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/login.html

[4/4] 上传 tencentcloud-adapter.js...
✅ 完成 (8.6 KB)
📍 https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/tencentcloud-adapter.js

🎉 全部上传完成！
```

---

## 🎯 现在就开始

选一个方式上传：

1. **最简单**：用腾讯云控制台（方式 A）
2. **最快**：用 Python 脚本（方式 B）
3. **最专业**：用 CLI（方式 C）

**需要帮助？告诉我卡在哪里了，我帮你解决！** 🚀
