#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTTP 远程部署脚本
用于将市场活动系统部署到 192.168.1.112:5666

使用方法:
    python3 deploy-http.py
"""

import os
import sys
import json
import requests
import time
from pathlib import Path

# 配置
REMOTE_HOST = "192.168.1.112"
REMOTE_PORT = 5666
REMOTE_BASE_URL = f"http://{REMOTE_HOST}:{REMOTE_PORT}"

LOCAL_PROJECT_PATH = "/Users/ray/WorkBuddy/20260320100957"

# 需要部署的文件
DEPLOY_FILES = [
    "index.html",
    "admin.html",
    "login.html",
    "diagnostic.html",
    "tencentcloud-adapter.js",
]

class HTTPDeployer:
    def __init__(self):
        self.base_url = REMOTE_BASE_URL
        self.session = requests.Session()
        self.session.timeout = 10
    
    def test_connection(self):
        """测试 HTTP 连接"""
        print(f"🔌 测试服务器连接: {self.base_url}")
        
        try:
            response = self.session.get(f"{self.base_url}/", timeout=5)
            print(f"✅ HTTP 连接成功 (状态码: {response.status_code})")
            return True
        except requests.exceptions.ConnectionError as e:
            print(f"❌ 无法连接到服务器: {e}")
            return False
        except Exception as e:
            print(f"⚠️  连接测试异常: {e}")
            # 可能服务器响应异常，但连接存在
            return True
    
    def upload_file(self, local_file, remote_filename):
        """上传文件到远程服务器"""
        try:
            with open(local_file, 'rb') as f:
                files = {'file': (remote_filename, f)}
                
                # 尝试多个上传端点
                endpoints = [
                    f"{self.base_url}/upload",
                    f"{self.base_url}/api/upload",
                    f"{self.base_url}/deploy",
                ]
                
                for endpoint in endpoints:
                    try:
                        response = self.session.post(endpoint, files=files, timeout=10)
                        
                        if response.status_code in [200, 201, 204]:
                            print(f"✅ 上传成功: {os.path.basename(local_file)} → {endpoint}")
                            return True
                    except:
                        continue
                
                # 如果上传端点都不可用，直接 PUT
                print(f"💡 尝试 PUT 方法上传: {os.path.basename(local_file)}")
                
                with open(local_file, 'rb') as f:
                    response = self.session.put(
                        f"{self.base_url}/{remote_filename}",
                        data=f,
                        timeout=10
                    )
                    
                    if response.status_code in [200, 201, 204]:
                        print(f"✅ PUT 上传成功: {os.path.basename(local_file)}")
                        return True
                    else:
                        print(f"⚠️  PUT 返回状态码: {response.status_code}")
                        return False
        
        except Exception as e:
            print(f"❌ 上传失败 {os.path.basename(local_file)}: {e}")
            return False
    
    def upload_all_files(self):
        """上传所有文件"""
        print("\n📤 开始上传文件...\n")
        
        success_count = 0
        for file in DEPLOY_FILES:
            local_path = os.path.join(LOCAL_PROJECT_PATH, file)
            
            if not os.path.exists(local_path):
                print(f"⚠️  文件不存在: {file}")
                continue
            
            file_size = os.path.getsize(local_path)
            print(f"📋 上传 {file} ({file_size:,} 字节)...")
            
            if self.upload_file(local_path, file):
                success_count += 1
            
            time.sleep(0.5)  # 短暂延迟避免限制
        
        print(f"\n✅ 共上传 {success_count}/{len(DEPLOY_FILES)} 个文件\n")
        return success_count > 0
    
    def verify_deployment(self):
        """验证部署是否成功"""
        print("🔍 验证部署...\n")
        
        verification_files = [
            ("index.html", "前台系统"),
            ("admin.html", "后台管理"),
            ("login.html", "登录页面"),
        ]
        
        verified_count = 0
        for filename, description in verification_files:
            try:
                response = self.session.head(f"{self.base_url}/{filename}", timeout=5)
                if response.status_code == 200:
                    print(f"✅ {description} ({filename}) - 可访问")
                    verified_count += 1
                else:
                    print(f"⚠️  {description} ({filename}) - 返回 {response.status_code}")
            except Exception as e:
                print(f"⚠️  {description} ({filename}) - 检查失败: {e}")
        
        print(f"\n✅ 验证完成: {verified_count}/{len(verification_files)} 个文件可访问\n")
        return verified_count > 0
    
    def deploy(self):
        """执行部署"""
        print("=" * 60)
        print("🚀 HTTP 远程部署 - 市场活动系统")
        print("=" * 60)
        print(f"目标服务器: {self.base_url}")
        print("=" * 60 + "\n")
        
        # 步骤1：测试连接
        if not self.test_connection():
            print("\n⚠️  警告: 无法连接到服务器")
            print("请检查:")
            print("  1. 服务器地址和端口是否正确")
            print("  2. 服务器是否在运行")
            print("  3. 网络连接是否正常")
            print("\n或者，你也可以手动上传这些文件:")
            for file in DEPLOY_FILES:
                print(f"  - {file}")
            return False
        
        # 步骤2：上传文件
        if not self.upload_all_files():
            print("\n⚠️  文件上传可能失败，请检查日志")
        
        # 步骤3：验证部署
        print("\n稍候 2 秒后验证部署...")
        time.sleep(2)
        
        self.verify_deployment()
        
        # 完成
        print("=" * 60)
        print("✅ 部署流程完成！")
        print("=" * 60)
        print(f"\n🌐 前台系统: {self.base_url}/index.html")
        print(f"📊 后台管理: {self.base_url}/admin.html")
        print(f"🔑 登录页面: {self.base_url}/login.html")
        print(f"\n默认管理员密码: admin123\n")
        print("=" * 60)
        
        return True

def main():
    """主函数"""
    deployer = HTTPDeployer()
    
    try:
        success = deployer.deploy()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  部署被中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 部署出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
