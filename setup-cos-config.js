/**
 * 腾讯云 COS 自动配置脚本
 * 在系统主页面加载后自动运行，配置 COS 适配器
 */

(function() {
    'use strict';
    
    // 等待页面加载完成
    document.addEventListener('DOMContentLoaded', function() {
        // 延迟执行，确保所有脚本已加载
        setTimeout(configureCOS, 1000);
    });
    
    // 配置函数
    async function configureCOS() {
        console.log('🔄 [自动配置] 开始配置腾讯云 COS...');
        
        // 配置信息
        const CONFIG = {
            bucket: 'nnqgcvte2026-1414699807',
            region: 'ap-guangzhou',
            secretId: 'AKIDFOL4Zquqa7RXSAfy4yfARWN0PTQGwQiW',
            secretKey: 'hBRWTCh2A6oJcibIo6h9NQM5av51lIdm'
        };
        
        try {
            // 检查 COS SDK 是否加载
            if (typeof COS === 'undefined') {
                console.warn('⚠️ [自动配置] 腾讯云 COS SDK 未加载，尝试动态加载...');
                await loadCOSSDK();
            }
            
            // 检查适配器是否加载
            if (!window.MarketActivityCOS || !window.MarketActivityCOS.adapter) {
                console.warn('⚠️ [自动配置] COS 适配器未加载，尝试加载...');
                await loadCOSAdapter();
            }
            
            // 配置适配器
            if (window.MarketActivityCOS && window.MarketActivityCOS.adapter) {
                window.MarketActivityCOS.adapter.configCOS(
                    CONFIG.bucket,
                    CONFIG.region,
                    CONFIG.secretId,
                    CONFIG.secretKey
                );
                
                console.log('✅ [自动配置] COS 适配器配置成功');
                console.log(`📦 存储桶: ${CONFIG.bucket}`);
                console.log(`📍 区域: ${CONFIG.region}`);
                
                // 保存配置到 localStorage（供其他页面使用）
                localStorage.setItem('mcm_cos_config', JSON.stringify({
                    ...CONFIG,
                    configuredAt: new Date().toISOString(),
                    version: '1.0'
                }));
                
                // 测试连接（可选）
                // setTimeout(testConnection, 2000);
                
                // 显示配置成功的提示
                showConfigSuccess();
                
            } else {
                throw new Error('COS 适配器加载失败');
            }
            
        } catch (error) {
            console.error('❌ [自动配置] 配置失败:', error);
            showConfigError(error.message);
        }
    }
    
    // 动态加载 COS SDK
    function loadCOSSDK() {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            if (typeof COS !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cos-js-sdk-v5.myqcloud.com/cos-js-sdk-v5.min.js';
            script.onload = () => {
                console.log('✅ [自动配置] COS SDK 加载成功');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ [自动配置] COS SDK 加载失败');
                reject(new Error('无法加载腾讯云 COS SDK'));
            };
            document.head.appendChild(script);
        });
    }
    
    // 动态加载 COS 适配器
    function loadCOSAdapter() {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            if (window.MarketActivityCOS && window.MarketActivityCOS.adapter) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'market-activity-cos-adapter.js';
            script.onload = () => {
                console.log('✅ [自动配置] COS 适配器加载成功');
                setTimeout(resolve, 500); // 给适配器初始化时间
            };
            script.onerror = () => {
                console.error('❌ [自动配置] COS 适配器加载失败');
                reject(new Error('无法加载 COS 适配器'));
            };
            document.head.appendChild(script);
        });
    }
    
    // 测试连接（可选）
    async function testConnection() {
        try {
            console.log('🔍 [自动配置] 正在测试 COS 连接...');
            const healthy = await window.MarketActivityCOS.adapter.checkHealth();
            
            if (healthy) {
                console.log('✅ [自动配置] COS 连接正常');
                updateConnectionStatus('✅ 已连接到腾讯云 COS', 'success');
            } else {
                console.warn('⚠️ [自动配置] COS 连接测试失败');
                updateConnectionStatus('⚠️ COS 连接异常', 'warning');
            }
        } catch (error) {
            console.error('❌ [自动配置] 连接测试失败:', error);
            updateConnectionStatus('❌ 连接测试失败', 'error');
        }
    }
    
    // 显示配置成功提示
    function showConfigSuccess() {
        // 创建提示元素
        const tip = document.createElement('div');
        tip.id = 'cos-config-success-tip';
        tip.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
            z-index: 9999;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease;
        `;
        
        tip.innerHTML = `
            <span style="font-size: 18px;">✅</span>
            <div>
                <div style="font-weight: 600;">腾讯云 COS 配置成功</div>
                <div style="font-size: 12px; opacity: 0.9;">数据将存储到广州节点</div>
            </div>
        `;
        
        document.body.appendChild(tip);
        
        // 5秒后自动消失
        setTimeout(() => {
            tip.style.opacity = '0';
            tip.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (tip.parentNode) {
                    tip.parentNode.removeChild(tip);
                }
            }, 300);
        }, 5000);
        
        // 添加动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 显示配置错误提示
    function showConfigError(errorMessage) {
        console.warn('⚠️ [自动配置] 显示错误提示:', errorMessage);
        
        // 创建错误提示（更不显眼的方式）
        const errorTip = document.createElement('div');
        errorTip.id = 'cos-config-error-tip';
        errorTip.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #fef3c7;
            color: #92400e;
            padding: 10px 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            z-index: 9999;
            font-size: 12px;
            max-width: 300px;
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0.9;
        `;
        
        const shortMessage = errorMessage.length > 50 
            ? errorMessage.substring(0, 47) + '...'
            : errorMessage;
        
        errorTip.innerHTML = `
            <span style="font-size: 16px;">⚠️</span>
            <div>
                <div style="font-weight: 600;">COS 配置提示</div>
                <div style="margin-top: 4px;">${shortMessage}</div>
                <div style="margin-top: 6px; font-size: 11px; opacity: 0.8;">
                    系统将使用本地存储，不影响基本功能
                </div>
            </div>
        `;
        
        document.body.appendChild(errorTip);
        
        // 10秒后自动消失
        setTimeout(() => {
            errorTip.style.opacity = '0';
            setTimeout(() => {
                if (errorTip.parentNode) {
                    errorTip.parentNode.removeChild(errorTip);
                }
            }, 300);
        }, 10000);
    }
    
    // 更新连接状态显示
    function updateConnectionStatus(message, type) {
        // 尝试更新系统状态指示器
        const statusIndicator = document.getElementById('connection-status');
        if (statusIndicator) {
            statusIndicator.textContent = message;
            statusIndicator.className = type;
        }
        
        // 或者在控制台显示
        console.log(`📡 [连接状态] ${message}`);
    }
    
    console.log('📋 [自动配置] 腾讯云 COS 自动配置脚本已加载');
    console.log('📦 存储桶: nnqgcvte2026-1414699807');
    console.log('📍 区域: ap-guangzhou (广州)');
    console.log('🔑 SecretId: AKIDFOL4Zquqa7RXSAfy4yfARWN0PTQGwQiW');
    
})();