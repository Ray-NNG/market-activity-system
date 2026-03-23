/**
 * 腾讯云 COS 适配器
 * 自动替换 jsonbin.io 存储为腾讯云 COS
 * 
 * 使用方法：在 HTML 文件中引入此文件即可
 * <script src="tencentcloud-adapter.js"></script>
 */

(function() {
  'use strict';

  // ============ 配置 ============
  const CONFIG = {
    // COS 存储桶配置
    bucketName: 'market-activity-system',
    region: 'bj',
    endpoint: 'https://market-activity-system.cos.bj.myqcloud.com',
    
    // 数据文件配置
    activitiesFile: 'activities.json',
    filesFile: 'files.json',
    
    // 网络配置
    timeout: 30000, // 30秒超时
    retries: 3,     // 重试3次
    retryDelay: 1000, // 重试延迟
  };

  // ============ 日志工具 ============
  const Logger = {
    info: (msg) => console.log(`ℹ️ [COS] ${msg}`),
    success: (msg) => console.log(`✅ [COS] ${msg}`),
    warn: (msg) => console.warn(`⚠️ [COS] ${msg}`),
    error: (msg) => console.error(`❌ [COS] ${msg}`),
  };

  // ============ 网络请求包装 ============
  class COSClient {
    /**
     * 发送请求到 COS
     */
    static async request(method, path, options = {}) {
      const url = `${CONFIG.endpoint}${path}`;
      const timeout = options.timeout || CONFIG.timeout;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 处理不同的响应类型
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text();
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error(`请求超时 (${timeout}ms)`);
        }
        throw error;
      }
    }

    /**
     * 获取数据
     */
    static async get(path, options = {}) {
      return this.request('GET', path, options);
    }

    /**
     * 保存数据
     */
    static async put(path, data, options = {}) {
      return this.request('PUT', path, {
        ...options,
        body: data,
      });
    }

    /**
     * 删除数据
     */
    static async delete(path, options = {}) {
      return this.request('DELETE', path, options);
    }

    /**
     * 带重试的请求
     */
    static async requestWithRetry(method, path, options = {}, retryCount = 0) {
      try {
        return await this.request(method, path, options);
      } catch (error) {
        if (retryCount < CONFIG.retries) {
          Logger.warn(`请求失败，${CONFIG.retryDelay}ms 后重试 (${retryCount + 1}/${CONFIG.retries}): ${error.message}`);
          
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
          return this.requestWithRetry(method, path, options, retryCount + 1);
        } else {
          throw new Error(`${error.message} (重试 ${CONFIG.retries} 次后放弃)`);
        }
      }
    }
  }

  // ============ 数据管理 ============
  class COSDataManager {
    /**
     * 读取活动数据
     */
    static async loadActivities() {
      try {
        Logger.info(`正在从 COS 读取活动数据...`);
        const data = await COSClient.requestWithRetry('GET', `/${CONFIG.activitiesFile}`);
        
        // 处理响应数据
        const activities = typeof data === 'string' ? JSON.parse(data) : data;
        Logger.success(`✨ 成功加载 ${activities.length || 0} 个活动`);
        
        return activities;
      } catch (error) {
        Logger.error(`读取活动数据失败: ${error.message}`);
        
        // 尝试从本地缓存恢复
        const cached = localStorage.getItem('mcm_activities_backup');
        if (cached) {
          Logger.warn(`使用本地缓存数据`);
          return JSON.parse(cached);
        }
        
        throw error;
      }
    }

    /**
     * 保存活动数据
     */
    static async saveActivities(activities) {
      try {
        Logger.info(`正在保存活动数据到 COS...`);
        
        // 本地备份
        localStorage.setItem('mcm_activities_backup', JSON.stringify(activities));
        
        // 上传到 COS
        await COSClient.requestWithRetry('PUT', `/${CONFIG.activitiesFile}`, { body: activities });
        
        Logger.success(`✅ 活动数据已保存`);
        return true;
      } catch (error) {
        Logger.error(`保存活动数据失败: ${error.message}`);
        
        // 如果离线队列系统存在，加入队列
        if (window.syncQueue) {
          Logger.warn(`${error.message}，已加入离线队列`);
          window.syncQueue.addTask('save_activities', activities);
          return true;
        }
        
        throw error;
      }
    }

    /**
     * 读取文件数据
     */
    static async loadFiles() {
      try {
        Logger.info(`正在从 COS 读取文件数据...`);
        const data = await COSClient.requestWithRetry('GET', `/${CONFIG.filesFile}`);
        
        const files = typeof data === 'string' ? JSON.parse(data) : data;
        Logger.success(`✨ 成功加载 ${files.length || 0} 个文件`);
        
        return files;
      } catch (error) {
        Logger.warn(`读取文件数据失败: ${error.message}，返回空数组`);
        
        // 返回空数组而不是抛出错误
        return [];
      }
    }

    /**
     * 保存文件数据
     */
    static async saveFiles(files) {
      try {
        Logger.info(`正在保存文件数据到 COS...`);
        
        // 本地备份
        localStorage.setItem('mcm_files_backup', JSON.stringify(files));
        
        // 上传到 COS
        await COSClient.requestWithRetry('PUT', `/${CONFIG.filesFile}`, { body: files });
        
        Logger.success(`✅ 文件数据已保存`);
        return true;
      } catch (error) {
        Logger.error(`保存文件数据失败: ${error.message}`);
        
        // 加入离线队列
        if (window.syncQueue) {
          Logger.warn(`${error.message}，已加入离线队列`);
          window.syncQueue.addTask('save_files', files);
          return true;
        }
        
        throw error;
      }
    }
  }

  // ============ 健康检查 ============
  class HealthCheck {
    static async check() {
      try {
        Logger.info(`正在检查 COS 连接...`);
        
        // 尝试访问一个小文件
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${CONFIG.endpoint}/`, {
          method: 'HEAD',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok || response.status === 404) {
          Logger.success(`✅ COS 连接正常`);
          return true;
        } else {
          Logger.error(`COS 连接异常: HTTP ${response.status}`);
          return false;
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          Logger.error(`COS 连接超时`);
        } else {
          Logger.error(`COS 连接失败: ${error.message}`);
        }
        return false;
      }
    }
  }

  // ============ 全局接口 ============
  window.TENCENTCLOUD = {
    CONFIG: CONFIG,
    COSClient: COSClient,
    COSDataManager: COSDataManager,
    Logger: Logger,
    HealthCheck: HealthCheck,
    
    // 便捷方法
    loadActivities: () => COSDataManager.loadActivities(),
    saveActivities: (data) => COSDataManager.saveActivities(data),
    loadFiles: () => COSDataManager.loadFiles(),
    saveFiles: (data) => COSDataManager.saveFiles(data),
    checkHealth: () => HealthCheck.check(),
  };

  // ============ 初始化 ============
  Logger.success(`腾讯云 COS 适配器已加载`);
  Logger.info(`存储地址: ${CONFIG.endpoint}`);
  Logger.info(`活动文件: ${CONFIG.activitiesFile}`);
  Logger.info(`文件数据: ${CONFIG.filesFile}`);

  // 自动健康检查（延迟 1 秒，避免影响页面加载）
  setTimeout(() => {
    HealthCheck.check().then(healthy => {
      if (!healthy) {
        Logger.warn(`⚠️ COS 连接异常，请检查网络或存储桶配置`);
      }
    });
  }, 1000);

})();
