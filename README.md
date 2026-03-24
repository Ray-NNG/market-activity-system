# 市场活动管理系统 - 腾讯云 COS 版本

## 🚀 快速开始

### 1. 配置腾讯云 COS
1. 访问 `cos-configuration.html`
2. 填写你的腾讯云信息：
   - SecretId（API密钥ID）
   - SecretKey（API密钥）
   - Bucket（存储桶名称）
   - Region（地区，如：ap-guangzhou）
3. 点击"保存配置"

### 2. 使用系统
- **前台报名**: `index.html`
- **后台管理**: `admin.html`
- 默认管理员密码: `admin123`

## 📊 功能特点

- ✅ **极速响应**: 腾讯云国内节点，延迟 50-100ms
- ✅ **数据安全**: 本地存储 + 云端备份
- ✅ **离线可用**: 网络异常时自动使用本地存储
- ✅ **自动重试**: 失败自动重试最多 3 次
- ✅ **成本优化**: 月成本 ¥1-5（原 jsonbin.io ¥50+）

## 🔧 部署选项

### GitHub Pages（推荐）
```bash
# 将此目录推送到你的 GitHub 仓库
git init
git add .
git commit -m "部署市场活动管理系统"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

### 本地服务器
```bash
python3 local-server.py
# 访问: http://localhost:8000
```

### 远程服务器
```bash
bash deploy.sh 服务器地址 用户名 密码
```

## 📞 技术支持

如有问题，请检查：
1. 腾讯云 COS 配置是否正确
2. 存储桶 CORS 设置是否允许当前域名
3. 网络连接是否正常