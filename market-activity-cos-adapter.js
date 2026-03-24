/**
 * 市场活动系统 - 腾讯云 COS 适配器 (安全版)
 * 使用官方 COS JS SDK，无需硬编码密钥，支持离线队列
 */

(function() {
  'use strict';

  // 全局对象
  window.MarketActivityCOS = window.MarketActivityCOS || {};

  // ============ 配置管理 ============
  const CONFIG = {
    // 存储桶配置（可运行时配置）
    Bucket: '',      // 例：'market-activity-system-1250000000'
    Region: '',      // 例：'ap-beijing'
    
    // 数据文件
    ACTIVITIES_KEY: 'market_activities_data.json',
    FILES_KEY: 'market_files_data.json',
    
    // 网络配置
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
  };

  // ============ 状态管理 ============
  let cosInstance = null;
  let isInitialized = false;
  let secretId = '';
  let secretKey = '';
  
  // 本地存储键
  const STORAGE_KEYS = {
    CONFIG: 'cos_config',
    BACKUP_ACTIVITIES: 'mcm_activities_backup',
    BACKUP_FILES: 'mcm_files_backup',
    SYNC_QUEUE: 'mcm_sync_queue',
  };

  // ============ 日志系统 ============
  const Logger = {
    info: (msg) => console.log(`ℹ️ [COS] ${msg}`),
    success: (msg) => console.log(`✅ [COS] ${msg}`),
    warn: (msg) => console.warn(`⚠️ [COS] ${msg}`),
    error: (msg) => console.error(`❌ [COS] ${msg}`),
    debug: (msg) => console.debug(`🐛 [COS] ${msg}`),
  };

  // ============ 配置函数 ============
  function configCOS(bucket, region, id, key) {
    CONFIG.Bucket = bucket || CONFIG.Bucket;
    CONFIG.Region = region || CONFIG.Region;
    secretId = id || secretId;
    secretKey = key || secretKey;
    
    // 保存到 localStorage（可选）
    if (bucket && region) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({
        bucket: bucket,
        region: region,
        configuredAt: new Date().toISOString()
      }));
    }
    
    isInitialized = false; // 需要重新初始化
    Logger.success(`COS 配置已更新: ${CONFIG.Bucket} @ ${CONFIG.Region}`);
  }

  // ============ 初始化 COS SDK ============
  function initCOS() {
    if (isInitialized && cosInstance) {
      return cosInstance;
    }
    
    // 检查配置
    if (!CONFIG.Bucket || !CONFIG.Region || !secretId || !secretKey) {
      throw new Error('腾讯云 COS 配置不完整，请调用 configCOS() 设置 bucket, region, SecretId, SecretKey');
    }
    
    try {
      // 动态加载 COS SDK（如果未加载）
      if (typeof COS === 'undefined') {
        // 创建 script 标签
        const script = document.createElement('script');
        script.src = 'https://cos-js-sdk-v5.myqcloud.com/cos-js-sdk-v5.min.js';
        script.onload = () => {
          Logger.success('腾讯云 COS SDK 加载完成');
          initCOS();
        };
        script.onerror = () => {
          Logger.error('腾讯云 COS SDK 加载失败');
          throw new Error('无法加载 COS SDK');
        };
        document.head.appendChild(script);
        return null;
      }
      
      // 创建 COS 实例
      cosInstance = new COS({
        SecretId: secretId,
        SecretKey: secretKey,
        Region: CONFIG.Region,
      });
      
      isInitialized = true;
      Logger.success(`腾讯云 COS 初始化成功: ${CONFIG.Bucket}`);
      return cosInstance;
    } catch (error) {
      Logger.error(`COS 初始化失败: ${error.message}`);
      throw error;
    }
  }

  // ============ 核心数据操作 ============
  const DataManager = {
    // 获取活动数据
    async getActivities() {
      try {
        Logger.info('正在从 COS 加载活动数据...');
        const cos = initCOS();
        if (!cos) throw new Error('COS 未初始化');
        
        const result = await cos.getObject({
          Bucket: CONFIG.Bucket,
          Region: CONFIG.Region,
          Key: CONFIG.ACTIVITIES_KEY,
        });
        
        // 解析数据
        let data;
        if (result.Body) {
          if (typeof result.Body === 'string') {
            data = JSON.parse(result.Body);
          } else if (result.Body instanceof ArrayBuffer) {
            const text = new TextDecoder().decode(result.Body);
            data = JSON.parse(text);
          } else {
            data = JSON.parse(result.Body.toString());
          }
        }
        
        const activities = data?.activities || [];
        Logger.success(`✅ 成功加载 ${activities.length} 个活动`);
        
        // 本地备份
        localStorage.setItem(STORAGE_KEYS.BACKUP_ACTIVITIES, JSON.stringify(activities));
        
        return { activities: activities, files: data?.files || {} };
      } catch (error) {
        if (error.statusCode === 404) {
          Logger.warn('活动数据文件不存在，返回空数据');
          return { activities: [], files: {} };
        }
        
        Logger.error(`加载活动数据失败: ${error.message}`);
        
        // 尝试从本地备份恢复
        const backup = localStorage.getItem(STORAGE_KEYS.BACKUP_ACTIVITIES);
        if (backup) {
          Logger.warn('使用本地备份数据');
          return { activities: JSON.parse(backup), files: {} };
        }
        
        return { activities: [], files: {} };
      }
    },

    // 保存活动数据
    async saveActivities(data) {
      try {
        Logger.info('正在保存数据到 COS...');
        const cos = initCOS();
        if (!cos) throw new Error('COS 未初始化');
        
        // 立即本地备份
        localStorage.setItem(STORAGE_KEYS.BACKUP_ACTIVITIES, JSON.stringify(data.activities || []));
        if (data.files) {
          localStorage.setItem(STORAGE_KEYS.BACKUP_FILES, JSON.stringify(data.files));
        }
        
        // 准备上传数据
        const uploadData = {
          activities: data.activities || [],
          files: data.files || {},
          updatedAt: new Date().toISOString(),
          version: '1.0.0'
        };
        
        // 上传到 COS
        await cos.putObject({
          Bucket: CONFIG.Bucket,
          Region: CONFIG.Region,
          Key: CONFIG.ACTIVITIES_KEY,
          Body: JSON.stringify(uploadData, null, 2),
          ContentType: 'application/json',
        });
        
        Logger.success('✅ 数据已成功保存到 COS');
        return true;
      } catch (error) {
        Logger.error(`保存数据失败: ${error.message}`);
        
        // 加入离线队列
        if (window.syncQueue) {
          Logger.warn(`已加入离线队列，等待网络恢复`);
          window.syncQueue.addTask({
            type: 'save',
            data: data,
            timestamp: Date.now(),
          });
        }
        
        throw error;
      }
    },

    // 获取文件数据（单独文件存储）
    async getFiles() {
      try {
        Logger.info('正在从 COS 加载文件数据...');
        const cos = initCOS();
        if (!cos) throw new Error('COS 未初始化');
        
        const result = await cos.getObject({
          Bucket: CONFIG.Bucket,
          Region: CONFIG.Region,
          Key: CONFIG.FILES_KEY,
        });
        
        let data = {};
        if (result.Body) {
          const text = typeof result.Body === 'string' ? result.Body : new TextDecoder().decode(result.Body);
          data = JSON.parse(text);
        }
        
        Logger.success(`✅ 成功加载文件数据`);
        return data;
      } catch (error) {
        if (error.statusCode === 404) {
          Logger.warn('文件数据文件不存在，返回空对象');
          return {};
        }
        
        Logger.error(`加载文件数据失败: ${error.message}`);
        return {};
      }
    },

    // 保存文件数据（单独文件存储）
    async saveFiles(files) {
      try {
        Logger.info('正在保存文件数据到 COS...');
        const cos = initCOS();
        if (!cos) throw new Error('COS 未初始化');
        
        await cos.putObject({
          Bucket: CONFIG.Bucket,
          Region: CONFIG.Region,
          Key: CONFIG.FILES_KEY,
          Body: JSON.stringify(files, null, 2),
          ContentType: 'application/json',
        });
        
        Logger.success('✅ 文件数据已保存');
        return true;
      } catch (error) {
        Logger.error(`保存文件数据失败: ${error.message}`);
        
        // 加入离线队列
        if (window.syncQueue) {
          window.syncQueue.addTask({
            type: 'save_files',
            data: files,
            timestamp: Date.now(),
          });
        }
        
        throw error;
      }
    },
  };

  // ============ 健康检查 ============
  async function checkHealth() {
    try {
      Logger.info('正在检查 COS 连接...');
      const cos = initCOS();
      if (!cos) return false;
      
      const result = await cos.headBucket({
        Bucket: CONFIG.Bucket,
        Region: CONFIG.Region,
      });
      
      Logger.success(`✅ COS 连接正常`);
      return true;
    } catch (error) {
      Logger.error(`❌ COS 连接失败: ${error.message}`);
      return false;
    }
  }

  // ============ 暴露接口 ============
  window.MarketActivityCOS.adapter = {
    // 配置
    config: configCOS,
    configCOS: configCOS,
    
    // 数据操作
    getData: () => DataManager.getActivities(),
    saveData: (data) => DataManager.saveActivities(data),
    getFiles: () => DataManager.getFiles(),
    saveFiles: (files) => DataManager.saveFiles(files),
    
    // 工具
    checkHealth: checkHealth,
    getConfig: () => ({ ...CONFIG, initialized: isInitialized }),
    
    // 日志
    logger: Logger,
  };

  // ============ 自动初始化检查 ============
  setTimeout(() => {
    // 检查是否有本地配置
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        Logger.info(`检测到本地配置: ${config.bucket} @ ${config.region}`);
      }
    } catch (e) {
      // 忽略错误
    }
    
    // 尝试从 URL 参数获取配置（开发时使用）
    if (window.location.search.includes('cos_debug')) {
      const params = new URLSearchParams(window.location.search);
      const bucket = params.get('bucket');
      const region = params.get('region');
      if (bucket && region) {
        Logger.info(`从 URL 参数获取配置: ${bucket} @ ${region}`);
        configCOS(bucket, region);
      }
    }
  }, 1000);

  Logger.success('市场活动系统 - 腾讯云 COS 适配器已加载');
  Logger.info('使用前请调用: window.MarketActivityCOS.adapter.configCOS(bucket, region, SecretId, SecretKey)');

})();