# 销售和售前搜索功能修复指南

## 问题描述
用户报告：销售和售前搜索点击没有反应。

## 已确认的系统组件

### 1. 售前讲师运营系统
- **页面ID**: `page-presales`
- **搜索框ID**: `ps-filter-keyword`
- **搜索函数**: `renderPresalesList()` → `getFilteredPresales()`
- **数据存储**: `localStorage.getItem('mcm_presales_records')`
- **导航**: 通过导航栏"👨‍🏫 售前讲师运营"访问

### 2. 渠道库管理系统
- **页面ID**: `page-channelOps`
- **搜索框ID**: `ops-lib-search`
- **搜索函数**: `renderOpsLibTable()`
- **数据存储**: `localStorage.getItem('mcm_ops_channels')`

### 3. 全局搜索
- **搜索框ID**: `global-search`
- **搜索函数**: `onSearchInput()` → `showSearchResults()`
- **搜索范围**: 活动、文件、任务

## 已确认的代码功能正常

✓ 所有搜索框的HTML元素都存在
✓ 所有搜索框都有正确的事件绑定（oninput/onchange）
✓ 所有搜索函数都已实现
✓ 数据加载逻辑正常
✓ 过滤逻辑正常

## 可能的问题原因

### 1. 页面初始化问题
- 售前讲师页面可能需要手动导航才能看到
- 需要点击侧边栏的"👨‍🏫 售前讲师运营"菜单

### 2. 数据为空问题
- localStorage中可能没有售前讲师数据
- 需要先导入数据或添加记录

### 3. JavaScript错误
- 浏览器控制台可能有错误阻止事件执行
- 需要按F12打开开发者工具查看控制台

### 4. 权限问题
- 用户角色可能没有访问售前讲师模块的权限

## 快速测试步骤

### 步骤1：检查页面访问
1. 登录系统
2. 点击侧边栏的"👨‍🏫 售前讲师运营"菜单
3. 确认页面显示正常

### 步骤2：添加测试数据
1. 在售前讲师页面点击"+ 新增记录"
2. 填写测试数据：
   - 公司：测试公司
   - 销售：张三
   - 售前：李老师
   - 类型：产品培训
   - 层级：核心
3. 保存记录

### 步骤3：测试搜索功能
1. 在搜索框中输入"测试"
2. 按Enter或等待输入完成
3. 表格应该显示包含"测试"的记录

### 步骤4：检查控制台
1. 按F12打开开发者工具
2. 切换到Console选项卡
3. 查看是否有红色错误信息

## 修复方案

如果搜索功能确实不工作，请尝试以下修复：

### 修复1：添加调试日志
在`index.html`中搜索函数`renderPresalesList()`，在开头添加：
```javascript
console.log('renderPresalesList called');
console.log('Search keyword:', document.getElementById('ps-filter-keyword')?.value);
console.log('Records count:', presalesRecords.length);
```

### 修复2：确保数据初始化
在页面加载时添加：
```javascript
// 页面加载完成后初始化售前讲师数据
window.addEventListener('load', function() {
    loadPresalesRecords();
    console.log('售前讲师数据已加载:', presalesRecords.length, '条记录');
});
```

### 修复3：修复可能的事件绑定问题
检查所有搜索框是否有正确的oninput属性：
```html
<!-- 售前讲师搜索框 -->
<input type="text" id="ps-filter-keyword" class="form-control" 
       placeholder="搜索公司/内容..." oninput="renderPresalesList()" style="width:180px">
       
<!-- 渠道库搜索框 -->  
<input class="form-control" id="ops-lib-search" 
       placeholder="🔍 搜索公司名称、联系人…" style="width:200px;flex-shrink:0" 
       oninput="renderOpsLibTable()">
       
<!-- 全局搜索框 -->
<input class="search-input" id="global-search" placeholder="搜索活动、负责人、文件…"
       oninput="onSearchInput(this.value)" onfocus="onSearchFocus()" onblur="onSearchBlur()">
```

## 测试工具

已创建调试页面：`debug-search.html`
- 测试页面导航
- 测试搜索框事件绑定
- 测试过滤函数
- 测试数据加载

访问地址：`http://localhost:8080/debug-search.html`

## 联系支持

如果以上步骤都不能解决问题，请提供：
1. 浏览器控制台截图（F12 → Console）
2. 浏览器类型和版本
3. 具体操作的步骤描述