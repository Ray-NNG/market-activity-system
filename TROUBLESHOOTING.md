# 市场活动管理系统 - 功能诊断指南

## 问题描述
用户反馈点击"新建活动"按钮没有反应。

## 快速诊断步骤

### 1. 打开浏览器开发者工具
- Windows/Linux: 按 `F12` 或 `Ctrl + Shift + I`
- Mac: 按 `Cmd + Option + I`

### 2. 查看 Console (控制台) 标签
检查是否有红色错误信息。常见的错误类型:

#### 错误类型 A: "函数未定义" (ReferenceError)
```
Uncaught ReferenceError: openNewActivity is not defined
```
**原因**: JavaScript 加载失败或执行错误

**解决方法**:
1. 强制刷新页面: `Ctrl + F5` (Windows) 或 `Cmd + Shift + R` (Mac)
2. 清除浏览器缓存
3. 尝试无痕模式

#### 错误类型 B: "网络错误" (Network Error)
```
Failed to fetch / net::ERR_CONNECTION_REFUSED
```
**原因**: jsonbin.io API 连接失败

**解决方法**:
1. 检查网络连接
2. 确认 jsonbin.io 服务正常
3. 查看网络请求详情

#### 错误类型 C: "CORS错误"
```
Access to fetch at '...' has been blocked by CORS policy
```
**原因**: 跨域请求被阻止

**解决方法**:
- 这通常是临时问题,稍后重试

### 3. 测试按钮功能
在 Console 中手动执行以下命令:

```javascript
// 测试函数是否存在
typeof openNewActivity  // 应该返回 "function"

// 测试调用
openNewActivity()

// 检查模态框
document.getElementById('modal-new').classList.contains('show')  // 应该返回 true
```

### 4. 检查网络请求
切换到 Network (网络) 标签,查看是否有失败的请求:

- `https://api.jsonbin.io/v3/b/69bd20d6b7ec241ddc86e1c2/latest` - 数据加载
- `https://api.jsonbin.io/v3/b/69bd20d6b7ec241ddc86e1c2` - 数据保存

## 诊断工具

### 访问诊断页面
访问以下URL进行自动诊断:
```
https://ray-nng.github.io/market-activity-system/diagnostic.html
```

这个页面会自动检查:
- 浏览器兼容性
- JavaScript 函数是否正确定义
- 常见配置问题
- 显示所有控制台日志

### 本地测试
如果你想本地测试,可以打开项目中的测试文件:
- `test-minimal.html` - 最小化功能测试
- `test-simple.html` - 简单功能测试
- `test-global.html` - 全局函数测试

## 已知的常见问题

### 问题 1: 浏览器缓存旧版本
**症状**: 按钮点击无反应,代码看起来正常

**解决**:
1. 清除浏览器缓存
2. 强制刷新页面 (`Ctrl + F5`)
3. 等待 1-2 分钟让 GitHub Pages 完成部署

### 问题 2: 网络连接问题
**症状**: 控制台显示网络错误,数据无法加载

**解决**:
1. 检查网络连接
2. 等待几分钟后重试
3. 如果持续出现,可能是 jsonbin.io 服务暂时不可用

### 问题 3: JavaScript 执行错误
**症状**: 控制台显示红色错误,后续代码不执行

**解决**:
1. 查看错误的具体行号和消息
2. 截图发送给开发者
3. 尝试使用不同的浏览器(Chrome, Firefox, Edge)

## 获取帮助

如果以上方法都无法解决问题,请提供以下信息:

1. 浏览器类型和版本 (Chrome/Edge/Firefox + 版本号)
2. 操作系统 (Windows/Mac/Linux)
3. 控制台的完整错误信息截图
4. Network 标签中失败请求的详细信息

## 开发者备注

已添加全局错误处理,所有 JavaScript 错误都会在控制台显示:
```javascript
window.addEventListener('error', function(e) {
  console.error('全局错误:', e.message, 'at', e.filename, 'line', e.lineno);
});
```

## 部署信息

- GitHub 仓库: Ray-NNG/market-activity-system
- 前台系统: https://ray-nng.github.io/market-activity-system/
- 后台管理: https://ray-nng.github.io/market-activity-system/admin.html
- 数据存储: jsonbin.io (Bin ID: 69bd20d6b7ec241ddc86e1c2)

## 最新更改

2026-03-20:
- 添加全局错误处理
- 创建诊断页面
- 优化错误提示
