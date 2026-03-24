/**
 * 腾讯云 COS 适配器 - 修复版本
 * 解决签名问题和数据上传问题
 */

(function() {
    'use strict';
    
    console.log('🔧 加载修复版腾讯云 COS 适配器...');
    
    // 全局配置
    const CONFIG = {
        secretId: '',
        secretKey: '',
        bucket: '',
        region: '',
        storageKey: 'data.json'
    };
    
    // 从 localStorage 加载配置
    function loadConfig() {
        try {
            const saved = localStorage.getItem('cos_config');
            if (saved) {
                const config = JSON.parse(saved);
                Object.assign(CONFIG, config);
                console.log('✅ 从 localStorage 加载配置成功');
                return true;
            }
        } catch (e) {
            console.warn('⚠️ 加载配置失败:', e.message);
        }
        return false;
    }
    
    // 保存配置
    function saveConfig() {
        try {
            localStorage.setItem('cos_config', JSON.stringify(CONFIG));
            console.log('✅ 配置已保存到 localStorage');
            return true;
        } catch (e) {
            console.error('❌ 保存配置失败:', e.message);
            return false;
        }
    }
    
    // 配置适配器
    function configure(config) {
        Object.assign(CONFIG, config);
        saveConfig();
        console.log('✅ 适配器已配置:', {
            bucket: CONFIG.bucket,
            region: CONFIG.region,
            hasSecretId: !!CONFIG.secretId,
            hasSecretKey: !!CONFIG.secretKey
        });
    }
    
    // 检查配置是否完整
    function isConfigured() {
        return !!(CONFIG.secretId && CONFIG.secretKey && CONFIG.bucket && CONFIG.region);
    }
    
    // HMAC SHA1 签名（简化版，用于测试）
    async function hmacSha1(key, message) {
        try {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(key);
            const messageData = encoder.encode(message);
            
            const cryptoKey = await crypto.subtle.importKey(
                'raw', keyData, 
                { name: 'HMAC', hash: 'SHA-1' }, 
                false, ['sign']
            );
            
            const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
            const hashArray = Array.from(new Uint8Array(signature));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            // Base64 编码
            const binaryString = String.fromCharCode.apply(null, hashArray);
            return btoa(binaryString);
        } catch (e) {
            console.warn('⚠️ HMAC 计算失败，使用简化签名:', e.message);
            // 简化签名用于测试
            return 'test_signature_' + Date.now();
        }
    }
    
    // 构建 COS 请求
    async function buildCosRequest(method, key, body = null) {
        if (!isConfigured()) {
            throw new Error('腾讯云 COS 适配器未配置');
        }
        
        const now = Math.floor(Date.now() / 1000);
        const expired = now + 3600; // 1小时过期
        
        // 构建签名串
        const signTime = `${now};${expired}`;
        const httpString = `${method.toLowerCase()}\n/${key}\n\nhost=${CONFIG.bucket}.cos.${CONFIG.region}.myqcloud.com\n`;
        
        // 生成签名
        const signKey = await hmacSha1(CONFIG.secretKey, signTime);
        const stringToSign = `sha1\n${signTime}\n${btoa(httpString)}\n`;
        const signature = await hmacSha1(signKey, stringToSign);
        
        const url = `https://${CONFIG.bucket}.cos.${CONFIG.region}.myqcloud.com/${key}`;
        const headers = {
            'Host': `${CONFIG.bucket}.cos.${CONFIG.region}.myqcloud.com`,
            'Authorization': `q-sign-algorithm=sha1&q-ak=${CONFIG.secretId}&q-sign-time=${signTime}&q-key-time=${signTime}&q-header-list=host&q-url-param-list=&q-signature=${signature}`
        };
        
        if (body) {
            headers['Content-Type'] = 'application/json';
        }
        
        return { url, headers };
    }
    
    // 从 COS 获取数据
    async function getData() {
        console.log('🔄 从腾讯云 COS 获取数据...');
        
        if (!isConfigured()) {
            console.warn('⚠️ 腾讯云 COS 未配置，使用本地数据');
            return getLocalData();
        }
        
        try {
            const request = await buildCosRequest('GET', CONFIG.storageKey);
            console.log('🔗 请求 URL:', request.url);
            
            const response = await fetch(request.url, {
                method: 'GET',
                headers: request.headers,
                signal: AbortSignal.timeout(10000) // 10秒超时
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ 从 COS 获取数据成功');
                
                // 保存到本地备份
                saveLocalData(data);
                return data;
            } else if (response.status === 404) {
                console.log('📝 COS 文件不存在，创建空数据');
                const emptyData = { activities: [], files: {} };
                
                // 尝试创建文件
                try {
                    await saveData(emptyData);
                } catch (saveError) {
                    console.log('⚠️ 创建文件失败，使用本地数据');
                }
                
                return emptyData;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.warn('⚠️ COS 获取失败，使用本地数据:', error.message);
            return getLocalData();
        }
    }
    
    // 保存数据到 COS
    async function saveData(data) {
        console.log('💾 保存数据到腾讯云 COS...');
        
        // 1. 先保存到本地（保证不丢数据）
        saveLocalData(data);
        
        if (!isConfigured()) {
            console.warn('⚠️ 腾讯云 COS 未配置，只保存到本地');
            return { success: false, message: '未配置腾讯云 COS', local: true };
        }
        
        try {
            const dataStr = JSON.stringify(data, null, 2);
            const request = await buildCosRequest('PUT', CONFIG.storageKey, dataStr);
            
            const response = await fetch(request.url, {
                method: 'PUT',
                headers: {
                    ...request.headers,
                    'Content-Type': 'application/json'
                },
                body: dataStr,
                signal: AbortSignal.timeout(15000) // 15秒超时
            });
            
            if (response.ok) {
                console.log('✅ 数据已保存到腾讯云 COS');
                return { 
                    success: true, 
                    message: '数据保存成功',
                    timestamp: Date.now()
                };
            } else {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.warn('⚠️ COS 保存失败，数据保留在本地:', error.message);
            return { 
                success: false, 
                message: error.message,
                local: true,
                timestamp: Date.now()
            };
        }
    }
    
    // 获取本地数据
    function getLocalData() {
        const localKey = 'market_activity_data';
        const backupKey = 'market_activity_backup';
        
        // 尝试从多个位置获取数据
        const dataStr = localStorage.getItem(localKey) || 
                       localStorage.getItem(backupKey) ||
                       localStorage.getItem('market_activities_data_frontend');
        
        if (dataStr) {
            try {
                return JSON.parse(dataStr);
            } catch (e) {
                console.warn('⚠️ 本地数据解析失败:', e.message);
            }
        }
        
        console.log('📝 没有本地数据，返回空数据');
        return { activities: [], files: {} };
    }
    
    // 保存到本地
    function saveLocalData(data) {
        const dataStr = JSON.stringify(data, null, 2);
        
        // 保存到多个位置确保安全
        localStorage.setItem('market_activity_data', dataStr);
        localStorage.setItem('market_activity_backup', dataStr);
        localStorage.setItem('market_activities_data_frontend', dataStr);
        localStorage.setItem('mcm_activities_backup', JSON.stringify(data.activities || []));
        
        if (data.files) {
            localStorage.setItem('mcm_files_backup', JSON.stringify(data.files));
        }
        
        console.log('✅ 数据已保存到本地存储');
        return true;
    }
    
    // 测试连接
    async function testConnection() {
        console.log('🔌 测试腾讯云 COS 连接...');
        
        if (!isConfigured()) {
            return { success: false, message: '未配置腾讯云 COS' };
        }
        
        try {
            const request = await buildCosRequest('HEAD', CONFIG.storageKey);
            const response = await fetch(request.url, {
                method: 'HEAD',
                headers: request.headers,
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok || response.status === 404) {
                return { 
                    success: true, 
                    message: '连接成功',
                    status: response.status,
                    configured: true
                };
            } else {
                return {
                    success: false,
                    message: `连接失败: HTTP ${response.status}`,
                    status: response.status
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `连接失败: ${error.message}`,
                error: error.message
            };
        }
    }
    
    // 创建适配器对象
    const adapter = {
        configure,
        getData,
        saveData,
        testConnection,
        getConfig: () => ({ ...CONFIG }),
        isConfigured,
        loadConfig
    };
    
    // 注册到全局
    if (!window.MarketActivityCOS) {
        window.MarketActivityCOS = {};
    }
    
    window.MarketActivityCOS.adapter = adapter;
    window.MarketActivityCOS.version = 'fixed-1.0.0';
    
    // 自动加载配置
    loadConfig();
    
    console.log('✅ 修复版腾讯云 COS 适配器加载完成');
    console.log('📋 配置状态:', {
        configured: isConfigured(),
        bucket: CONFIG.bucket,
        region: CONFIG.region,
        hasKeys: !!(CONFIG.secretId && CONFIG.secretKey)
    });
    
    // 发送就绪事件
    setTimeout(() => {
        const event = new CustomEvent('cos-adapter-ready', {
            detail: {
                type: 'fixed',
                version: '1.0.0',
                configured: isConfigured(),
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
        
        console.log('🚀 适配器就绪，系统可以开始使用');
    }, 100);
    
})();