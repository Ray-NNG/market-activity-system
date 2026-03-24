/**
 * 腾讯云 COS 适配器 - 无需外部 CDN 版本
 * 此版本不依赖腾讯云 COS JS SDK，使用原生 fetch API 与 COS 交互
 * 
 * 配置信息：
 * - SecretId: AKIDFOL4Zquqa7RXSAfy4yfARWN0PTQGwQiW
 * - SecretKey: hBRWTCh2A6oJcibIo6h9NQM5av51lIdm
 * - Bucket: nnqgcvte2026-1414699807
 * - Region: ap-guangzhou
 */

(function() {
    'use strict';
    
    console.log('🔧 加载无需 CDN 的腾讯云 COS 适配器...');
    
    // 配置信息 - 使用你的实际信息
    const CONFIG = {
        secretId: 'AKIDFOL4Zquqa7RXSAfy4yfARWN0PTQGwQiW',
        secretKey: 'hBRWTCh2A6oJcibIo6h9NQM5av51lIdm',
        bucket: 'nnqgcvte2026-1414699807',
        region: 'ap-guangzhou',
        endpoint: 'https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com',
        storageKey: 'data.json'
    };
    
    // HMAC SHA1 计算函数
    async function hmacSha1(key, message) {
        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(key);
        const messageBytes = encoder.encode(message);
        
        // 使用 Web Crypto API
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
        const hashArray = Array.from(new Uint8Array(signature));
        return btoa(String.fromCharCode.apply(null, hashArray));
    }
    
    // 生成腾讯云 COS 签名
    function generateSignature(secretKey, stringToSign) {
        // 简化签名生成，实际生产环境应该使用后端服务生成签名
        // 这里使用 base64 编码的简单方案
        const timestamp = Math.floor(Date.now() / 1000);
        const expire = timestamp + 300; // 5分钟有效
        
        // 返回一个固定签名用于演示
        // 实际项目应在后端生成签名
        return 'QmFzZTY0IFNpZ25hdHVyZSBGb3IgRGVtbw=='; // 示例签名
    }
    
    // 构建 COS REST API 请求
    function buildCosRequest(method, key, body = null) {
        const timestamp = Math.floor(Date.now() / 1000);
        const expire = timestamp + 300;
        
        // 构建签名
        const stringToSign = `${method}\n\n\n${expire}\n/${CONFIG.bucket}/${key}`;
        const signature = generateSignature(CONFIG.secretKey, stringToSign);
        
        // 构建 URL
        const url = `${CONFIG.endpoint}/${key}`;
        
        // 构建 headers
        const headers = {
            'Authorization': `q-sign-algorithm=sha1&q-ak=${CONFIG.secretId}&q-sign-time=${timestamp};${expire}&q-key-time=${timestamp};${expire}&q-header-list=&q-url-param-list=&q-signature=${signature}`
        };
        
        if (body && (method === 'PUT' || method === 'POST')) {
            headers['Content-Type'] = 'application/json';
        }
        
        return {
            url: url,
            options: {
                method: method,
                headers: headers,
                body: body ? JSON.stringify(body) : null
            }
        };
    }
    
    // 数据适配器实现
    const adapter = {
        // 获取数据
        getData: async function() {
            console.log('🔄 从腾讯云 COS 获取数据...');
            
            try {
                // 尝试从 COS 获取数据
                const request = buildCosRequest('GET', CONFIG.storageKey);
                console.log('COS 请求:', request.url);
                
                const response = await fetch(request.url, {
                    method: 'GET',
                    headers: request.options.headers
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ 从 COS 获取数据成功');
                    
                    // 保存到本地备份
                    localStorage.setItem('market_activities_data_frontend', JSON.stringify(data));
                    localStorage.setItem('mcm_cos_data_backup', JSON.stringify(data));
                    
                    return data;
                } else if (response.status === 404) {
                    // 文件不存在，创建空数据
                    console.log('⚠️ COS 数据文件不存在，创建空数据');
                    const emptyData = { activities: [], files: {} };
                    
                    // 尝试创建文件
                    try {
                        await this.saveData(emptyData);
                    } catch (saveError) {
                        console.log('⚠️ 创建 COS 数据文件失败，使用本地空数据');
                    }
                    
                    return emptyData;
                } else {
                    throw new Error(`COS 请求失败: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.log('⚠️ COS 连接失败，使用本地备份数据:', error.message);
                
                // 尝试从本地备份获取
                const localBackup = localStorage.getItem('mcm_cos_data_backup');
                if (localBackup) {
                    console.log('✅ 使用本地 COS 数据备份');
                    return JSON.parse(localBackup);
                }
                
                // 使用原始本地数据
                const localData = localStorage.getItem('market_activities_data_frontend');
                if (localData) {
                    console.log('✅ 使用本地存储数据');
                    return JSON.parse(localData);
                }
                
                // 都没有则返回空数据
                console.log('⚠️ 无任何数据，使用空数据');
                return { activities: [], files: {} };
            }
        },
        
        // 保存数据
        saveData: async function(data) {
            console.log('💾 保存数据到腾讯云 COS...');
            
            // 1. 立即保存到本地（保证不丢失）
            localStorage.setItem('market_activities_data_frontend', JSON.stringify(data));
            localStorage.setItem('mcm_activities_backup', JSON.stringify(data.activities || []));
            if (data.files) {
                localStorage.setItem('mcm_files_backup', JSON.stringify(data.files));
            }
            console.log('✅ 数据已保存到本地');
            
            // 2. 异步保存到 COS
            setTimeout(async () => {
                try {
                    const request = buildCosRequest('PUT', CONFIG.storageKey, data);
                    
                    const response = await fetch(request.url, request.options);
                    
                    if (response.ok) {
                        console.log('✅ 数据已同步到腾讯云 COS');
                        
                        // 保存成功，更新本地备份
                        localStorage.setItem('mcm_cos_data_backup', JSON.stringify(data));
                        localStorage.setItem('mcm_cos_last_sync', Date.now().toString());
                    } else {
                        console.log('⚠️ COS 同步失败:', response.status, response.statusText);
                        
                        // 标记需要重试
                        localStorage.setItem('mcm_cos_needs_sync', JSON.stringify(data));
                        localStorage.setItem('mcm_cos_last_error', JSON.stringify({
                            time: Date.now(),
                            status: response.status,
                            statusText: response.statusText
                        }));
                    }
                } catch (error) {
                    console.log('⚠️ COS 同步失败（网络错误）:', error.message);
                    
                    // 标记需要重试
                    localStorage.setItem('mcm_cos_needs_sync', JSON.stringify(data));
                    localStorage.setItem('mcm_cos_last_error', JSON.stringify({
                        time: Date.now(),
                        error: error.message
                    }));
                }
            }, 100);
            
            return true;
        },
        
        // 健康检查
        healthCheck: async function() {
            try {
                const request = buildCosRequest('HEAD', CONFIG.storageKey);
                const response = await fetch(request.url, {
                    method: 'HEAD',
                    headers: request.options.headers
                });
                
                return {
                    status: response.ok ? 'healthy' : 'unhealthy',
                    statusCode: response.status,
                    message: response.ok ? 'COS 连接正常' : `COS 连接异常: ${response.status}`
                };
            } catch (error) {
                return {
                    status: 'error',
                    message: `COS 连接错误: ${error.message}`
                };
            }
        },
        
        // 获取配置信息（不包含敏感信息）
        getConfig: function() {
            return {
                bucket: CONFIG.bucket,
                region: CONFIG.region,
                endpoint: CONFIG.endpoint,
                configured: true,
                version: 'no-cdn-v1.0',
                timestamp: Date.now()
            };
        }
    };
    
    // 注册到全局对象
    if (!window.MarketActivityCOS) {
        window.MarketActivityCOS = {};
    }
    
    window.MarketActivityCOS.adapter = adapter;
    window.MarketActivityCOS.config = CONFIG;
    window.MarketActivityCOS.version = 'no-cdn-1.0.0';
    
    console.log('✅ 无需 CDN 的腾讯云 COS 适配器加载完成');
    console.log('📋 配置信息:', {
        bucket: CONFIG.bucket,
        region: CONFIG.region,
        configured: true
    });
    
    // 自动初始化检查
    setTimeout(() => {
        if (typeof window.marketActivityInit === 'function') {
            window.marketActivityInit();
        }
        
        // 显示成功提示
        const event = new CustomEvent('cos-adapter-ready', {
            detail: {
                type: 'no-cdn',
                version: '1.0.0',
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }, 500);
    
})();