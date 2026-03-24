# Cloudflare Workers 部署指南

## 📋 部署前准备

需要以下信息：
- **JSONBIN_MASTER_KEY**: `$2a$10$qPXYw8sncxMpyTyfamrf2.uiMaK9BwgDig//LaW9NSYySggFytYde`
- **JSONBIN_BIN_ID**: `69bd20d6b7ec241ddc86e1c2`
- **ALLOWED_ORIGIN**: `https://ray-nng.github.io`

---

## ✅ 部署步骤

### 1️⃣ 登录 Cloudflare
访问 https://dash.cloudflare.com （用你的 Cloudflare 账户登录）

### 2️⃣ 进入 Workers & Pages
- 左侧菜单找到 **"Workers & Pages"** 或 **"Workers"**
- 点击 **"Create application"** → **"Create Worker"**

### 3️⃣ 创建 Worker
- **名称**：输入 `mcm-api-proxy`
- **环境**：保持默认
- 点击 **"Create"**

### 4️⃣ 粘贴代码
删除默认代码，把 `cloudflare-worker.js` 文件的全部内容（第 34 行开始到最后）粘贴进去：

```javascript
export default {
  async fetch(request, env) {
    // ... 代码内容 ...
  }
};
```

点击 **"Save and Deploy"**

### 5️⃣ 配置环境变量

部署成功后，进入 Worker 的**设置**：
- 点击 **"Settings"** 标签
- 找到 **"Variables"** 或 **"Environment Variables"**
- 点击 **"Add Variable"**

**添加三个环境变量**：

#### 变量 1：JSONBIN_MASTER_KEY
| 字段 | 值 |
|------|-----|
| **变量名** | `JSONBIN_MASTER_KEY` |
| **值** | `$2a$10$qPXYw8sncxMpyTyfamrf2.uiMaK9BwgDig//LaW9NSYySggFytYde` |
| **加密** | ✅ 勾选 "Encrypt" |

点击 **"Save"**

#### 变量 2：JSONBIN_BIN_ID
| 字段 | 值 |
|------|-----|
| **变量名** | `JSONBIN_BIN_ID` |
| **值** | `69bd20d6b7ec241ddc86e1c2` |
| **加密** | 不勾选 |

点击 **"Save"**

#### 变量 3：ALLOWED_ORIGIN
| 字段 | 值 |
|------|-----|
| **变量名** | `ALLOWED_ORIGIN` |
| **值** | `https://ray-nng.github.io` |
| **加密** | 不勾选 |

点击 **"Save"**

### 6️⃣ 获取 Worker URL
- 回到 Worker 首页
- 在右侧找到 **"Deployments"** 或 **"Production"** 部分
- 你会看到类似这样的 URL：
  ```
  https://mcm-api-proxy.<your-subdomain>.workers.dev
  ```
- **复制整个 URL**

### 7️⃣ 更新前端代码

把 Worker URL 告诉我，我来更新 `index.html` 和 `admin.html` 中的：

```javascript
const PROXY_API = 'https://mcm-api-proxy.<your-subdomain>.workers.dev';
```

---

## 🧪 测试

完成后，打开浏览器 F12 控制台，你应该看到：
```
✅ 代理响应: 200 OK
✅ 数据加载成功
```

---

## ❌ 常见问题

### Q: 环境变量保存后没有出现在列表中？
A: 刷新页面。有时需要等 1-2 秒。

### Q: 提示 "服务器配置错误：缺少环境变量"？
A: 检查三个环境变量是否都添加了，尤其注意大小写和空格。

### Q: 仍然超时？
A: 
1. 检查 Worker URL 是否正确
2. 在浏览器访问 `https://mcm-api-proxy.<your-subdomain>.workers.dev/data/latest` 测试
3. 查看 Workers 的实时日志（Cloudflare 仪表板 → Workers → 日志）

### Q: 收到 CORS 错误？
A: 确保 `ALLOWED_ORIGIN` 值是 `https://ray-nng.github.io`（注意 https）

---

## 📝 完成后

部署完成后告诉我 Worker URL，我会：
1. 更新代码中的 `PROXY_API` 地址
2. 移除 Master Key 明文
3. 重新启用 Workers 代理模式
4. 推送到 GitHub
