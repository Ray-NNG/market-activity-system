# 简单部署方案 - GitHub Pages + jsonbin.io

## 一、注册账号

### 1. GitHub（免费）
- 访问：https://github.com/signup
- 用邮箱注册即可

### 2. jsonbin.io（免费）
- 访问：https://jsonbin.io/login
- 用 GitHub 账号登录（一键登录）
- 登录后去：https://jsonbin.io/api-keys
- 复制你的 **Master Key**（等下要用）

---

## 二、创建 JSON Bin 存储数据

### 1. 创建新 Bin
- 访问：https://jsonbin.io
- 点击 "Create New Bin"
- 粘贴以下初始数据（或者留空 `[]`）：

```json
[
  {
    "id": 1,
    "name": "2026 Q1 春节品牌营销",
    "type": "品牌活动",
    "owner": "张晓雯",
    "start": "2026-01-15",
    "end": "2026-02-10",
    "budget": 120000,
    "spent": 115000,
    "status": "已完成",
    "progress": 100,
    "goal": "春节期间品牌曝光量达100万，新用户注册2000人",
    "desc": "春节主题品牌营销，覆盖线上线下多渠道",
    "budgetItems": [
      {"name":"线上广告投放","source":"hq","amount":50000},
      {"name":"线下活动布置","source":"hq","amount":30000},
      {"name":"物料制作","source":"subsidiary","amount":20000},
      {"name":"🏗️ 展台搭建","source":"hq","amount":15000},
      {"name":"🚚 物流运输","source":"subsidiary","amount":5000}
    ],
    "kpis": [
      {"name":"曝光量","target":100,"actual":128,"unit":"万"},
      {"name":"新用户注册","target":2000,"actual":2456,"unit":"人"},
      {"name":"转化率","target":8,"actual":9.2,"unit":"%"}
    ],
    "tasks": [
      {"name":"确定创意方向","done":true},
      {"name":"制作视觉素材","done":true},
      {"name":"投放媒体渠道","done":true},
      {"name":"线下活动布置","done":true},
      {"name":"数据汇总复盘","done":true}
    ],
    "risks": [],
    "review": {
      "score":4.8,
      "summary":"超额完成目标，曝光量超预期28%，建议下次加大投放预算",
      "lessons":"提前3周确认供应商，避免春节期间资源紧张"
    },
    "roi": 3.8,
    "satisfaction": 4.8
  }
]
```

### 2. 获取 Bin ID 和 Secret Key
- 创建后，URL 会是：`https://jsonbin.io/xxxxxxxxx`
- 其中 `xxxxxxxxx` 就是你的 **Bin ID**
- 复制这个 ID（等下要用）

---

## 三、部署到 GitHub Pages

### 1. 创建仓库
1. 登录 GitHub
2. 点击右上角 `+` → `New repository`
3. 仓库名：`market-activity-system`
4. 勾选 "Public"
5. 点击 "Create repository"

### 2. 上传文件

**方法 A：用命令行（推荐）**

在本地终端执行：
```bash
cd /Users/ray/WorkBuddy/20260320100957

# 初始化 Git
git init
git add index.html
git commit -m "初始提交"

# 关联远程仓库（替换为你的 GitHub 用户名）
git remote add origin https://github.com/你的用户名/market-activity-system.git
git branch -M main
git push -u origin main
```

**方法 B：网页上传**
1. 在 GitHub 仓库页面，点击 "uploading an existing file"
2. 把 `index.html` 拖进去
3. 填写提交信息，点击 "Commit changes"

### 3. 开启 GitHub Pages
1. 进入仓库 → Settings → Pages
2. 在 "Source" 下选择 `main` 分支
3. 点击 Save
4. 等待 1-2 分钟，会显示你的网站地址：
   ```
   https://你的用户名.github.io/market-activity-system
   ```

---

## 四、配置 jsonbin.io 访问

打开 `index.html`，找到以下位置并修改：

### 1. 替换 API 配置（文件顶部）
```javascript
// ===== jsonbin.io 配置 =====
const JSONBIN_MASTER_KEY = '你的MasterKey';      // 替换
const JSONBIN_BIN_ID = '你的BinID';              // 替换
const JSONBIN_API = 'https://api.jsonbin.io/v3/b';
```

### 2. 替换数据操作函数

找到所有 `localStorage` 相关的 `getActivities` / `saveActivity` / `deleteActivity`，替换为：

```javascript
// 获取所有活动
async function getActivities() {
  const res = await fetch(`${JSONBIN_API}/${JSONBIN_BIN_ID}/latest`, {
    headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
  });
  if (!res.ok) throw new Error('获取数据失败');
  const data = await res.json();
  return data.record || [];
}

// 保存活动（新增/更新）
async function saveActivity(data) {
  const activities = await getActivities();
  const index = activities.findIndex(a => a.id === data.id);
  
  if (index >= 0) {
    activities[index] = { ...activities[index], ...data, id: data.id };
  } else {
    activities.push({ id: data.id || Date.now().toString(), ...data });
  }
  
  const res = await fetch(`${JSONBIN_API}/${JSONBIN_BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_MASTER_KEY
    },
    body: JSON.stringify(activities)
  });
  
  if (!res.ok) throw new Error('保存失败');
  return data;
}

// 删除活动
async function deleteActivity(id) {
  const activities = await getActivities();
  const index = activities.findIndex(a => a.id === id);
  if (index === -1) throw new Error('活动不存在');
  
  activities.splice(index, 1);
  
  const res = await fetch(`${JSONBIN_API}/${JSONBIN_BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_MASTER_KEY
    },
    body: JSON.stringify(activities)
  });
  
  if (!res.ok) throw new Error('删除失败');
  return { success: true };
}
```

### 3. 提交修改
```bash
git add index.html
git commit -m "配置 jsonbin.io"
git push
```

---

## 五、测试验证

1. 打开你的 GitHub Pages 地址：
   ```
   https://你的用户名.github.io/market-activity-system
   ```

2. 登录（密码：admin123）

3. 创建一个活动，刷新页面，确认数据还在

---

## 六、常用操作

### 更新代码
```bash
cd /Users/ray/WorkBuddy/20260320100957
git add .
git commit -m "更新"
git push
```

GitHub Pages 会自动部署，1-2 分钟生效

### 备份数据
登录 jsonbin.io，导出你的 Bin 数据

---

## 限制

- jsonbin.io 免费版：请求限制 10,000 次/月
- GitHub Pages：只能放静态文件，无法执行后端代码
- 数据安全：Master Key 暴露在前端代码中，仅适合个人使用

---

## 需要我帮你做什么？

把你的 **Master Key** 和 **Bin ID** 告诉我，我直接帮你修改 `index.html`
