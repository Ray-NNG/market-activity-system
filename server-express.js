const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '.data-server');

// 创建数据目录
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`✅ 数据目录已创建: ${DATA_DIR}`);
}

// ============ 中间件 ============
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// ============ API 路由 ============

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 获取活动数据
app.get('/api/activities', (req, res) => {
  try {
    const dataFile = path.join(DATA_DIR, 'activities.json');
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf-8');
      res.json(JSON.parse(data));
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('❌ 读取失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 保存活动数据
app.post('/api/activities', (req, res) => {
  try {
    const dataFile = path.join(DATA_DIR, 'activities.json');
    const timestamp = new Date().toISOString();
    
    // 记录到文件
    fs.writeFileSync(dataFile, JSON.stringify(req.body, null, 2));
    
    // 备份历史记录
    const backupFile = path.join(DATA_DIR, `activities-backup-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(req.body, null, 2));
    
    console.log(`✅ 数据已保存 [${timestamp}]`);
    res.json({ 
      status: 'saved', 
      file: dataFile,
      backup: backupFile,
      timestamp: timestamp
    });
  } catch (error) {
    console.error('❌ 保存失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新单个活动
app.put('/api/activities/:id', (req, res) => {
  try {
    const dataFile = path.join(DATA_DIR, 'activities.json');
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8') || '[]');
    
    const index = data.findIndex(a => a.id === req.params.id);
    if (index !== -1) {
      data[index] = { ...data[index], ...req.body };
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      console.log(`✅ 活动已更新: ${req.params.id}`);
      res.json({ status: 'updated', activity: data[index] });
    } else {
      res.status(404).json({ error: '活动不存在' });
    }
  } catch (error) {
    console.error('❌ 更新失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除活动
app.delete('/api/activities/:id', (req, res) => {
  try {
    const dataFile = path.join(DATA_DIR, 'activities.json');
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8') || '[]');
    
    const filtered = data.filter(a => a.id !== req.params.id);
    fs.writeFileSync(dataFile, JSON.stringify(filtered, null, 2));
    
    console.log(`✅ 活动已删除: ${req.params.id}`);
    res.json({ status: 'deleted' });
  } catch (error) {
    console.error('❌ 删除失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取数据统计
app.get('/api/stats', (req, res) => {
  try {
    const dataFile = path.join(DATA_DIR, 'activities.json');
    let activities = [];
    
    if (fs.existsSync(dataFile)) {
      activities = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
    
    res.json({
      totalActivities: activities.length,
      totalParticipants: activities.reduce((sum, a) => sum + (a.participants?.length || 0), 0),
      lastUpdated: fs.statSync(dataFile)?.mtime || new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 导出数据为 JSON
app.get('/api/export/json', (req, res) => {
  try {
    const dataFile = path.join(DATA_DIR, 'activities.json');
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="activities.json"');
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    } else {
      res.status(404).json({ error: '无数据' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 导出数据为 CSV
app.get('/api/export/csv', (req, res) => {
  try {
    const dataFile = path.join(DATA_DIR, 'activities.json');
    if (fs.existsSync(dataFile)) {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      
      let csv = '活动名称,创建时间,参与人数\n';
      data.forEach(activity => {
        csv += `"${activity.name}","${activity.createdAt}","${activity.participants?.length || 0}"\n`;
      });
      
      res.setHeader('Content-Disposition', 'attachment; filename="activities.csv"');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.send(csv);
    } else {
      res.status(404).json({ error: '无数据' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ 静态文件路由 ============

// 根路径重定向到 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============ 错误处理 ============

app.use((req, res) => {
  res.status(404).json({ error: '路由不存在', path: req.path });
});

app.use((error, req, res, next) => {
  console.error('❌ 服务器错误:', error);
  res.status(500).json({ error: error.message });
});

// ============ 启动服务器 ============

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Node.js Express 服务器已启动');
  console.log('='.repeat(60) + '\n');
  
  console.log('📍 服务器信息:');
  console.log(`  🌐 访问地址: http://localhost:${PORT}`);
  console.log(`  📁 工作目录: ${__dirname}`);
  console.log(`  💾 数据目录: ${DATA_DIR}\n`);
  
  console.log('🎯 快速链接:');
  console.log(`  🏠 前台系统: http://localhost:${PORT}/index.html`);
  console.log(`  ⚙️  后台管理: http://localhost:${PORT}/admin.html`);
  console.log(`  🔑 登录页面: http://localhost:${PORT}/login.html`);
  console.log(`  📊 健康检查: http://localhost:${PORT}/health\n`);
  
  console.log('📚 API 端点:');
  console.log(`  GET  /api/activities - 获取活动列表`);
  console.log(`  POST /api/activities - 保存活动`);
  console.log(`  GET  /api/stats - 获取统计数据`);
  console.log(`  GET  /api/export/json - 导出为 JSON`);
  console.log(`  GET  /api/export/csv - 导出为 CSV\n`);
  
  console.log('💡 说明:');
  console.log('  • 按 Ctrl+C 停止服务器');
  console.log('  • 所有数据保存在 .data-server/ 目录');
  console.log('  • 支持 CORS 跨域请求');
  console.log('  • 自动创建数据备份\n');
  
  console.log('='.repeat(60) + '\n');
});

// ============ 优雅关闭 ============

process.on('SIGINT', () => {
  console.log('\n\n正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已停止\n');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭...');
  server.close(() => {
    console.log('✅ 服务器已停止');
    process.exit(0);
  });
});
