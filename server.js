// 服务器端 API - market-activity-api.js
// 运行：node market-activity-api.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'activities.json');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // 前端文件放 public 目录

// 确保数据目录存在
async function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir);
  }
  
  // 初始化数据文件
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  }
}

// 读取数据
async function readData() {
  const content = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(content);
}

// 写入数据
async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// API 路由

// 获取所有活动
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await readData();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个活动
app.get('/api/activities/:id', async (req, res) => {
  try {
    const activities = await readData();
    const activity = activities.find(a => a.id === req.params.id);
    if (!activity) return res.status(404).json({ error: '活动不存在' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建活动
app.post('/api/activities', async (req, res) => {
  try {
    const activities = await readData();
    const newActivity = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...req.body
    };
    activities.push(newActivity);
    await writeData(activities);
    res.json(newActivity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新活动
app.put('/api/activities/:id', async (req, res) => {
  try {
    const activities = await readData();
    const index = activities.findIndex(a => a.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: '活动不存在' });
    
    activities[index] = {
      ...activities[index],
      ...req.body,
      id: req.params.id, // 确保不被覆盖
      updatedAt: new Date().toISOString()
    };
    
    await writeData(activities);
    res.json(activities[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除活动
app.delete('/api/activities/:id', async (req, res) => {
  try {
    const activities = await readData();
    const index = activities.findIndex(a => a.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: '活动不存在' });
    
    activities.splice(index, 1);
    await writeData(activities);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 启动服务器
async function start() {
  await ensureDataDir();
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 数据文件：${DATA_FILE}`);
  });
}

start();
