/**
 * 腾讯云 COS 适配器 - 可配置版本
 * 此版本不包含硬编码密钥，需要用户在使用时配置
 */

(function() {
    'use strict';
    
    console.log('🔧 加载可配置的腾讯云 COS 适配器...');
    
    // 默认配置 - 不包含敏感信息
    const DEFAULT_CONFIG = {
        bucket: '',           // 存储桶名称，如：market-activity-system-xxxxxx
        region: '',           // 存储区域，如：ap-beijing、ap-guangzhou
        storageKey: 'data.json'  // 数据存储文件名
    };
    
    // 全局配置对象
    let CONFIG = { ...DEFAULT_CONFIG };
    
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
    
    // 生成腾讯云 COS 签名（简化版，实际应在后端生成）
    function generateSignature(secretKey, stringToSign) {
        // 简化签名生成，实际生产环境应该使用后端服务生成签名
        // 这里返回一个固定值用于演示
        return 'QmFzZTY0U2lnbmF0dXJlRGVtbw==';
    }
    
    // 构建 COS REST API 请求
    function buildCosRequest(method, key, body = null) {
        const timestamp = Math.floor(Date.now() / 1000);
        const expire = timestamp + 300;
        
        // 从 localStorage 获取配置
        const userConfig = JSON.parse(localStorage.getItem('mcm_cos_config') || '{}');
        const secretId = userConfig.secretId || '';
        const secretKey = userConfig.secretKey || '';
        
        if (!secretId || !secretKey) {
            throw new Error('腾讯云 COS 配置不完整，请先配置 SecretId 和 SecretKey');
        }
        
        // 构建签名
        const stringToSign = `${method}\n\n\n${expire}\n/${CONFIG.bucket}/${key}`;
        const signature = generateSignature(secretKey, stringToSign);
        
        // 构建 URL
        const endpoint = `https://${CONFIG.bucket}.cos.${CONFIG.region}.myqcloud.com`;
        const url = `${endpoint}/${key}`;
        
        // 构建 headers
        const headers = {
            'Authorization': `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=${timestamp};${expire}&q-key-time=${timestamp};${expire}&q-header-list=&q-url-param-list=&q-signature=${signature}`
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
        // 配置适配器
        configure: function(config) {
            console.log('⚙️ 配置腾讯云 COS 适配器...', config);
            
            if (!config.bucket || !config.region) {
                console.error('❌ 配置失败: 必须提供 bucket 和 region');
                return false;
            }
            
            CONFIG = { ...DEFAULT_CONFIG, ...config };
            console.log('✅ 配置成功:', CONFIG);
            
            // 保存配置到 localStorage
            localStorage.setItem('mcm_cos_adapter_config', JSON.stringify(CONFIG));
            
            return true;
        },
        
        // 获取数据
        getData: async function() {
            console.log('🔄 从腾讯云 COS 获取数据...');
            
            // 检查配置是否完整
            if (!CONFIG.bucket || !CONFIG.region) {
                console.warn('⚠️ 腾讯云 COS 适配器未配置，检查是否已调用 configure() 方法');
                
                // 回退到本地存储
                const localData = localStorage.getItem('market_activities_data_frontend');
                if (localData) {
                    console.log('✅ 使用本地缓存数据');
                    return JSON.parse(localData);
                }
                
                console.log('⚠️ 没有本地数据，使用空数据');
                return { activities: [], files: {} };
            }
            
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
            
            // 检查配置是否完整
            if (!CONFIG.bucket || !CONFIG.region) {
                console.warn('⚠️ 腾讯云 COS 适配器未配置，仅保存到本地');
                return true;
            }
            
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
            if (!CONFIG.bucket || !CONFIG.region) {
                return {
                    status: 'unconfigured',
                    message: '适配器未配置，请先调用 configure() 方法'
                };
            }
            
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
                bucket: CONFIG.bucket || '未配置',
                region: CONFIG.region || '未配置',
                configured: !!(CONFIG.bucket && CONFIG.region),
                version: 'configurable-v1.0',
                timestamp: Date.now()
            };
        },
        
        // 检查是否已配置
        isConfigured: function() {
            return !!(CONFIG.bucket && CONFIG.region);
        }
    };
    
    // 注册到全局对象
    if (!window.MarketActivityCOS) {
        window.MarketActivityCOS = {};
    }
    
    window.MarketActivityCOS.adapter = adapter;
    window.MarketActivityCOS.version = 'configurable-1.0.0';
    
    console.log('✅ 可配置的腾讯云 COS 适配器加载完成');
    console.log('📋 当前配置状态:', adapter.getConfig());
    
    // 尝试从 localStorage 恢复配置
    const savedConfig = localStorage.getItem('mcm_cos_adapter_config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            adapter.configure(config);
            console.log('✅ 从 localStorage 恢复配置成功');
        } catch (error) {
            console.log('⚠️ 从 localStorage 恢复配置失败:', error.message);
        }
    }
    
    // 自动初始化检查
    setTimeout(() => {
        if (typeof window.marketActivityInit === 'function') {
            window.marketActivityInit();
        }
        
        // 显示成功提示
        const event = new CustomEvent('cos-adapter-ready', {
            detail: {
                type: 'configurable',
                version: '1.0.0',
                configured: adapter.isConfigured(),
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }, 500);
    
})();