/**
 * 腾讯云 COS CORS 配置检查脚本
 * 检查存储桶的跨域配置是否正确
 */

(function() {
    'use strict';
    
    // 检查 CORS 配置
    async function checkCORSConfig() {
        console.log('🔍 [CORS检查] 开始检查存储桶 CORS 配置...');
        
        const bucket = 'nnqgcvte2026-1414699807';
        const region = 'ap-guangzhou';
        
        try {
            // 尝试发送 OPTIONS 请求检查 CORS
            const testUrl = `https://${bucket}.cos.${region}.myqcloud.com/`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(testUrl, {
                method: 'OPTIONS',
                mode: 'cors',
                headers: {
                    'Origin': window.location.origin,
                    'Access-Control-Request-Method': 'PUT',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`📊 [CORS检查] 响应状态: ${response.status}`);
            console.log(`📊 [CORS检查] 响应头:`, Object.fromEntries(response.headers.entries()));
            
            // 检查关键的 CORS 头
            const corsHeaders = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
                'Access-Control-Max-Age': response.headers.get('Access-Control-Max-Age')
            };
            
            console.log('📋 [CORS检查] CORS 头信息:', corsHeaders);
            
            // 分析配置
            if (corsHeaders['Access-Control-Allow-Origin'] === '*' || 
                corsHeaders['Access-Control-Allow-Origin'] === window.location.origin) {
                console.log('✅ [CORS检查] Access-Control-Allow-Origin 配置正确');
            } else {
                console.warn('⚠️ [CORS检查] Access-Control-Allow-Origin 可能有问题:', 
                    corsHeaders['Access-Control-Allow-Origin']);
            }
            
            if (corsHeaders['Access-Control-Allow-Methods'] && 
                corsHeaders['Access-Control-Allow-Methods'].includes('PUT')) {
                console.log('✅ [CORS检查] Access-Control-Allow-Methods 包含 PUT');
            } else {
                console.warn('⚠️ [CORS检查] Access-Control-Allow-Methods 可能缺少 PUT');
            }
            
            // 显示配置建议
            showCORSConfigGuide(corsHeaders);
            
        } catch (error) {
            console.error('❌ [CORS检查] 检查失败:', error);
            showCORSConfigError(error);
        }
    }
    
    // 显示 CORS 配置指南
    function showCORSConfigGuide(corsHeaders) {
        console.group('📖 CORS 配置指南');
        console.log('如果检查发现 CORS 配置有问题，请在腾讯云控制台配置：');
        console.log('');
        console.log('1. 登录 https://console.cloud.tencent.com/cos');
        console.log('2. 进入存储桶 "nnqgcvte2026-1414699807"');
        console.log('3. 左侧菜单 → 安全管理 → 跨域访问CORS设置');
        console.log('4. 点击 "添加规则"，配置如下：');
        console.log('');
        console.log('   ┌─────────────────────────────────────────────┐');
        console.log('   │ 来源 Origin: *                             │');
        console.log('   │ 操作 Methods: GET,PUT,POST,DELETE,HEAD     │');
        console.log('   │ 头部 Headers: *                            │');
        console.log('   │ 超时 Max-Age: 600                          │');
        console.log('   │ 响应头部 ExposedHeaders: ETag              │');
        console.log('   └─────────────────────────────────────────────┘');
        console.log('');
        console.log('5. 点击 "保存"');
        console.log('');
        console.log('当前检测到的配置：');
        console.log('- Allow-Origin:', corsHeaders['Access-Control-Allow-Origin'] || '未检测到');
        console.log('- Allow-Methods:', corsHeaders['Access-Control-Allow-Methods'] || '未检测到');
        console.log('- Allow-Headers:', corsHeaders['Access-Control-Allow-Headers'] || '未检测到');
        console.groupEnd();
        
        // 在页面上显示提示
        const tip = document.createElement('div');
        tip.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: #fef3c7;
            color: #92400e;
            padding: 12px 16px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            max-width: 400px;
            z-index: 9999;
            font-size: 13px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        tip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                <span>🔧</span> CORS 配置检查
            </div>
            <div style="margin-bottom: 8px;">请确保存储桶已正确配置 CORS 规则：</div>
            <div style="background: rgba(0,0,0,0.05); padding: 8px; border-radius: 4px; font-size: 12px; font-family: monospace;">
                Origin: *<br>
                Methods: GET,PUT,POST,DELETE,HEAD<br>
                Headers: *
            </div>
            <div style="margin-top: 8px; font-size: 11px; opacity: 0.8;">
                打开浏览器控制台查看详细检查结果
            </div>
        `;
        
        document.body.appendChild(tip);
        
        // 10秒后自动消失
        setTimeout(() => {
            tip.style.opacity = '0';
            tip.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (tip.parentNode) {
                    tip.parentNode.removeChild(tip);
                }
            }, 300);
        }, 10000);
    }
    
    // 显示 CORS 配置错误
    function showCORSConfigError(error) {
        console.warn('⚠️ CORS 配置检查失败，可能原因：');
        console.warn('1. 存储桶不存在或无权访问');
        console.warn('2. 网络连接问题');
        console.warn('3. CORS 未配置或配置错误');
        console.warn('错误信息:', error.message);
        
        const errorTip = document.createElement('div');
        errorTip.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: #fee2e2;
            color: #7f1d1d;
            padding: 12px 16px;
            border-radius: 8px;
            border-left: 4px solid #dc2626;
            max-width: 400px;
            z-index: 9999;
            font-size: 13px;
        `;
        
        errorTip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                <span>⚠️</span> CORS 配置检查失败
            </div>
            <div>可能原因：存储桶不存在、无权访问或 CORS 未配置</div>
            <div style="margin-top: 8px; font-size: 11px;">
                请登录腾讯云控制台检查存储桶和 CORS 配置
            </div>
        `;
        
        document.body.appendChild(errorTip);
        
        setTimeout(() => {
            errorTip.style.opacity = '0';
            setTimeout(() => {
                if (errorTip.parentNode) {
                    errorTip.parentNode.removeChild(errorTip);
                }
            }, 300);
        }, 8000);
    }
    
    // 页面加载后开始检查
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(checkCORSConfig, 2000); // 等待其他脚本加载
        });
    } else {
        setTimeout(checkCORSConfig, 2000);
    }
    
    console.log('🔧 [CORS检查] CORS 配置检查脚本已加载');
    console.log('📦 存储桶: nnqgcvte2026-1414699807');
    console.log('📍 区域: ap-guangzhou');
    
})();