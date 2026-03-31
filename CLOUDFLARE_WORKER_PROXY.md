# Cloudflare Worker 代理 COS 方案

## 为什么需要这个？

腾讯云 2024年1月后新建的存储桶，所有 COS 默认域名访问都强制下载（无法关闭）。
通过 Cloudflare Worker 做反向代理，自动去掉 `Content-Disposition: attachment`，
让 index.html / admin.html 在浏览器正常打开。

**优势：**
- ✅ 只需维护 COS 一套文件，不需要同步到 Cloudflare Pages
- ✅ 更新文件只需上传到 COS，Worker 自动透传最新内容
- ✅ Worker 免费额度（每天 10万次请求）完全够用
- ✅ 数据读写（JSON 文件）也走同一个代理，CORS 问题一并解决

---

## 部署步骤（约 5 分钟）

### 第一步：创建 Worker

1. 打开 https://dash.cloudflare.com
2. 左侧菜单 → **Workers & Pages**
3. 点 **Create** → **Create Worker**
4. Worker 名称填：`mcm-cos-proxy`
5. 把 `cloudflare-worker.js` 的全部内容粘贴进去
6. 点 **Deploy**

### 第二步：配置环境变量

Worker 部署后，进入该 Worker → **Settings** → **Variables** → **Add variable**

| 变量名 | 值 | 是否加密 |
|--------|-----|---------|
| `COS_BUCKET` | `nnqgcvte2026-1414699807` | 否 |
| `COS_REGION` | `ap-guangzhou` | 否 |
| `COS_SECRET_ID` | `AKIDS3QaXHxPcbQ1NTLzlJc2DAtOegT0Mmlz` | ✅ 勾选 Encrypt |
| `COS_SECRET_KEY` | `HEzWpwd7XqX2V9jEdtwkgYDdpmUWJrAE` | ✅ 勾选 Encrypt |

配置完点 **Save and deploy**。

### 第三步：记录 Worker 地址

部署成功后，Worker 的访问地址为：
```
https://mcm-cos-proxy.<你的subdomain>.workers.dev
```

例如：`https://mcm-cos-proxy.ray-abc.workers.dev`

### 第四步：更新 index.html 里的 COS 域名

找到 `index.html` 和 `admin.html` 里的 COS 域名配置，替换为 Worker 地址。

在 index.html 里搜索 `cos.ap-guangzhou.myqcloud.com` 或 `COS_BASE_URL`，
把：
```
https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com
```
改为：
```
https://mcm-cos-proxy.<你的subdomain>.workers.dev
```

修改后，重新上传 index.html 和 admin.html 到 COS（Worker 会代理返回新版本）。

---

## 验证是否成功

访问以下地址，应该直接打开页面而不是下载：
```
https://mcm-cos-proxy.<你的subdomain>.workers.dev/index.html
```

检查浏览器开发者工具，响应头里应该**没有** `Content-Disposition: attachment`。

---

## 工作原理

```
用户浏览器
    ↓ 访问 workers.dev/index.html
Cloudflare Worker
    ↓ 转发到 COS，加上签名（写操作）
腾讯云 COS
    ↓ 返回文件（带 Content-Disposition: attachment）
Cloudflare Worker
    ↓ 删掉 Content-Disposition 头，修正 Content-Type
用户浏览器
    ✅ 正常渲染 HTML 页面
```

---

## 费用说明

- Cloudflare Workers 免费套餐：每天 **10万次请求**，完全够用
- 超出后：$5/月（1千万次请求），性价比极高

---

## 后续维护

以后更新系统只需：
1. 修改 `index.html` / `admin.html`
2. 上传到 COS（用 python3 upload-to-cos.py 或控制台）
3. **完成！** Worker 自动代理新版本，无需额外操作
