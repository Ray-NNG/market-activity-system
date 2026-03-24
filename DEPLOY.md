# 市场活动管理系统 - 部署指南

## 一、部署到 Vercel（前端）

### 1. 注册 Vercel
- 访问 https://vercel.com
- 用 GitHub 或邮箱注册登录

### 2. 安装 Vercel CLI
```bash
npm install -g vercel
```

### 3. 部署项目
在项目目录执行：
```bash
cd /Users/ray/WorkBuddy/20260320100957
vercel
```
按提示操作：
- Link to existing project → No
- Scope → 选择你的账号
- Project name → market-activity-system（自定义）
- Directory → ./（当前目录）
- Override Settings → 全部选 No

完成后会给你一个域名，比如 `https://market-activity-system.vercel.app`

---

## 二、配置 LeanCloud（数据库）

### 1. 注册 LeanCloud
- 访问 https://leancloud.cn
- 注册并登录

### 2. 创建应用
1. 点击「创建应用」
2. 选择「开发版」（免费）
3. 应用名称：market-activity-db
4. 完成创建

### 3. 获取应用凭证
进入应用 → 设置 → 应用凭证
记录以下信息：
- App ID
- App Key
- Server URL（如果是国内版，通常不需要改）

### 4. 创建数据表
进入「数据存储 → 结构化数据」
手动创建表（或通过代码自动创建）：

| 表名 | 字段 |
|------|------|
| Activity | id, name, owner, budget, actualCost, startDate, endDate, status, objectives, kpi, milestones, review, createdAt, updatedAt |

### 5. 设置安全域名
进入「设置 → 安全中心」
在「Web 安全域名」中添加你的 Vercel 域名（如 `https://market-activity-system.vercel.app`）

---

## 三、修改前端代码连接 LeanCloud

用下面的代码替换 `index.html` 中的数据操作部分：

### 在 `<head>` 中添加 LeanCloud SDK
```html
<script src="https://unpkg.com/leancloud-storage@4.0.0/dist/av-min.js"></script>
```

### 在 `<script>` 顶部初始化 LeanCloud
```javascript
// 替换成你的 LeanCloud 凭证
const LC_APP_ID = 'YOUR_APP_ID';        // 填入你的 App ID
const LC_APP_KEY = 'YOUR_APP_KEY';      // 填入你的 App Key
const LC_SERVER_URL = '';               // 国际版需要填，国内版留空

// 初始化 LeanCloud
AV.init({
  appId: LC_APP_ID,
  appKey: LC_APP_KEY,
  serverURL: LC_SERVER_URL
});
```

### 数据表操作封装
```javascript
// 活动数据表
const ActivityTable = AV.Object.extend('Activity');

// 获取所有活动
async function getActivities() {
  const query = new AV.Query(ActivityTable);
  query.descending('createdAt');
  const results = await query.find();
  return results.map(item => ({
    id: item.id,
    name: item.get('name'),
    owner: item.get('owner'),
    budget: item.get('budget'),
    actualCost: item.get('actualCost'),
    startDate: item.get('startDate'),
    endDate: item.get('endDate'),
    status: item.get('status'),
    objectives: item.get('objectives'),
    kpi: item.get('kpi'),
    milestones: item.get('milestones'),
    review: item.get('review'),
    createdAt: item.createdAt.toISOString()
  }));
}

// 保存活动（新增/更新）
async function saveActivity(data) {
  const activity = data.id ? AV.Object.createWithoutData('Activity', data.id) : new ActivityTable();

  activity.set('name', data.name);
  activity.set('owner', data.owner);
  activity.set('budget', data.budget);
  activity.set('actualCost', data.actualCost);
  activity.set('startDate', data.startDate);
  activity.set('endDate', data.endDate);
  activity.set('status', data.status);
  activity.set('objectives', data.objectives);
  activity.set('kpi', data.kpi);
  activity.set('milestones', data.milestones);
  activity.set('review', data.review);

  await activity.save();
  return { id: activity.id };
}

// 删除活动
async function deleteActivity(id) {
  const activity = AV.Object.createWithoutData('Activity', id);
  await activity.destroy();
}
```

### 替换原来的数据操作
把文件中所有 `localStorage` 相关的活动数据操作，替换成上面的 LeanCloud 调用。

---

## 四、重新部署到 Vercel

修改完代码后，再次部署：
```bash
vercel --prod
```

---

## 五、测试验证

1. 打开你的 Vercel 域名
2. 登录（密码：admin123）
3. 创建一个活动
4. 刷新页面，确认数据还在

---

## 注意事项

1. **数据安全**：LeanCloud 的 App Key 前端可见，建议在生产环境配置 ACL（访问控制列表）
2. **免费额度**：LeanCloud 开发版有请求次数限制，个人使用足够，商业版需升级
3. **国内访问**：LeanCloud 国内版访问快，但需要实名认证
4. **备份**：LeanCloud 可以导出数据，建议定期备份

---

## 需要我帮你做什么？

1. 我直接修改 `index.html`，集成 LeanCloud（你需要提供 App ID 和 App Key）
2. 你想先自己注册 LeanCloud，拿到凭证后再找我修改代码
