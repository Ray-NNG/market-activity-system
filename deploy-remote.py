#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
远程服务器部署脚本
用于将市场活动系统部署到 192.168.1.112:5666

使用方法:
    python3 deploy-remote.py

配置:
    服务器地址: 192.168.1.112
    端口: 5666
    用户: huangshengwei
    密码: WKi3,Ly{1g
    部署路径: /home/huangshengwei/market-activity-system
"""

import os
import sys
import json
import subprocess
import tarfile
import io
from pathlib import Path

# 配置
REMOTE_HOST = "192.168.1.112"
REMOTE_PORT = 5666
REMOTE_USER = "huangshengwei"
REMOTE_PASSWORD = "WKi3,Ly{1g"
REMOTE_BASE_PATH = "/home/huangshengwei/market-activity-system"
REMOTE_DATA_PATH = f"{REMOTE_BASE_PATH}/.data"

LOCAL_PROJECT_PATH = "/Users/ray/WorkBuddy/20260320100957"

# 需要部署的文件和目录
DEPLOY_FILES = [
    "index.html",
    "admin.html",
    "login.html",
    "diagnostic.html",
    "tencentcloud-adapter.js",
    "server-express.js",
    "local-server.py",
]

DEPLOY_DIRS = []

class RemoteDeployer:
    def __init__(self):
        self.host = REMOTE_HOST
        self.port = REMOTE_PORT
        self.user = REMOTE_USER
        self.password = REMOTE_PASSWORD
        self.base_path = REMOTE_BASE_PATH
        
    def test_connection(self):
        """测试 SSH 连接"""
        print(f"🔌 测试服务器连接: {self.host}:{self.port}")
        
        try:
            # 尝试用 sshpass 测试连接
            cmd = f'sshpass -p "{self.password}" ssh -o StrictHostKeyChecking=no -p {self.port} {self.user}@{self.host} "echo ✅ 连接成功"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                print("✅ SSH 连接成功！")
                return True
            else:
                print(f"❌ SSH 连接失败: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ 连接出错: {e}")
            return False
    
    def run_remote_command(self, cmd):
        """在远程服务器上执行命令"""
        full_cmd = f'sshpass -p "{self.password}" ssh -o StrictHostKeyChecking=no -p {self.port} {self.user}@{self.host} "{cmd}"'
        result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=30)
        return result.returncode, result.stdout, result.stderr
    
    def create_remote_directory(self):
        """创建远程目录"""
        print(f"📁 创建远程目录: {self.base_path}")
        
        cmd = f"mkdir -p {self.base_path} {REMOTE_DATA_PATH}"
        code, stdout, stderr = self.run_remote_command(cmd)
        
        if code == 0:
            print(f"✅ 远程目录已创建")
            return True
        else:
            print(f"❌ 创建失败: {stderr}")
            return False
    
    def upload_file(self, local_file, remote_file):
        """上传文件到远程服务器"""
        try:
            # 使用 scp 上传文件
            cmd = f'sshpass -p "{self.password}" scp -P {self.port} -o StrictHostKeyChecking=no "{local_file}" {self.user}@{self.host}:"{remote_file}"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print(f"✅ 上传成功: {os.path.basename(local_file)}")
                return True
            else:
                print(f"❌ 上传失败 {os.path.basename(local_file)}: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ 上传出错: {e}")
            return False
    
    def upload_all_files(self):
        """上传所有需要部署的文件"""
        print("\n📤 开始上传文件...")
        
        success_count = 0
        for file in DEPLOY_FILES:
            local_path = os.path.join(LOCAL_PROJECT_PATH, file)
            
            if not os.path.exists(local_path):
                print(f"⚠️  文件不存在: {file}")
                continue
            
            remote_path = os.path.join(self.base_path, file)
            
            if self.upload_file(local_path, remote_path):
                success_count += 1
        
        print(f"\n✅ 共上传 {success_count}/{len(DEPLOY_FILES)} 个文件")
        return success_count > 0
    
    def setup_server_environment(self):
        """配置远程服务器环境"""
        print("\n⚙️  配置服务器环境...")
        
        # 检查 Node.js 和 npm
        code, stdout, stderr = self.run_remote_command("which node npm")
        
        if code == 0:
            print("✅ Node.js 和 npm 已安装")
        else:
            print("⚠️  未检测到 Node.js，尝试安装...")
            
            # 尝试安装 Node.js
            code, stdout, stderr = self.run_remote_command(
                "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash - && sudo apt-get install -y nodejs"
            )
            
            if code == 0:
                print("✅ Node.js 安装成功")
            else:
                print("⚠️  Node.js 自动安装失败，请手动安装")
        
        # 创建 package.json
        print("📦 创建 package.json...")
        
        package_json = {
            "name": "market-activity-system",
            "version": "1.0.0",
            "description": "市场活动管理系统",
            "main": "server-express.js",
            "scripts": {
                "start": "node server-express.js",
                "dev": "node server-express.js"
            },
            "dependencies": {
                "express": "^4.18.2",
                "cors": "^2.8.5",
                "body-parser": "^1.20.2"
            }
        }
        
        # 先上传 package.json
        local_package = os.path.join(LOCAL_PROJECT_PATH, "package.json")
        
        # 如果本地没有，创建一个
        if not os.path.exists(local_package):
            with open(local_package, 'w') as f:
                json.dump(package_json, f, indent=2)
        
        remote_package = os.path.join(self.base_path, "package.json")
        self.upload_file(local_package, remote_package)
        
        # 安装依赖
        print("📥 安装 npm 依赖...")
        code, stdout, stderr = self.run_remote_command(
            f"cd {self.base_path} && npm install 2>&1 | tail -5"
        )
        
        if code == 0:
            print("✅ 依赖安装成功")
        else:
            print(f"⚠️  依赖安装有问题: {stderr}")
    
    def get_server_url(self):
        """获取服务器访问 URL"""
        return f"http://{self.host}:{self.port}"
    
    def generate_start_script(self):
        """生成启动脚本"""
        print("\n🚀 生成启动脚本...")
        
        start_script = f"""#!/bin/bash
# 市场活动系统启动脚本

cd {self.base_path}

# 方案1: 使用 Node.js Express (推荐)
echo "正在启动 Node.js Express 服务器..."
node server-express.js

# 如果需要使用 Python (备选方案)
# python3 local-server.py
"""
        
        start_script_path = os.path.join(self.base_path, "start.sh")
        
        cmd = f"cat > {start_script_path} << 'EOF'\n{start_script}\nEOF\nchmod +x {start_script_path}"
        code, stdout, stderr = self.run_remote_command(cmd)
        
        if code == 0:
            print(f"✅ 启动脚本已生成: {start_script_path}")
            return True
        else:
            print(f"❌ 脚本生成失败: {stderr}")
            return False
    
    def create_systemd_service(self):
        """创建 systemd 服务（可选，用于自动启动）"""
        print("\n🔧 创建 systemd 服务文件...")
        
        service_content = f"""[Unit]
Description=Market Activity System
After=network.target

[Service]
Type=simple
User={self.user}
WorkingDirectory={self.base_path}
ExecStart=/usr/bin/node {self.base_path}/server-express.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
        
        service_path = f"/tmp/market-activity.service"
        
        # 写到本地临时文件，然后上传
        with open(service_path, 'w') as f:
            f.write(service_content)
        
        remote_service_path = f"{self.base_path}/market-activity.service"
        
        if self.upload_file(service_path, remote_service_path):
            print(f"✅ systemd 服务文件已生成")
            print(f"\n💡 如需自动启动，运行以下命令:")
            print(f"   sudo mv {remote_service_path} /etc/systemd/system/")
            print(f"   sudo systemctl daemon-reload")
            print(f"   sudo systemctl enable market-activity.service")
            print(f"   sudo systemctl start market-activity.service")
            return True
        else:
            return False
    
    def deploy(self):
        """执行完整部署"""
        print("=" * 60)
        print("🚀 开始部署市场活动系统到远程服务器")
        print("=" * 60)
        print(f"目标服务器: {self.host}:{self.port}")
        print(f"远程用户: {self.user}")
        print(f"部署路径: {self.base_path}")
        print("=" * 60 + "\n")
        
        # 步骤1：测试连接
        if not self.test_connection():
            print("\n❌ 无法连接到服务器，部署中止")
            return False
        
        # 步骤2：创建远程目录
        if not self.create_remote_directory():
            print("\n❌ 无法创建远程目录，部署中止")
            return False
        
        # 步骤3：上传文件
        if not self.upload_all_files():
            print("\n❌ 文件上传失败，部署中止")
            return False
        
        # 步骤4：配置环境
        self.setup_server_environment()
        
        # 步骤5：生成启动脚本
        self.generate_start_script()
        
        # 步骤6：创建 systemd 服务（可选）
        self.create_systemd_service()
        
        # 部署完成
        print("\n" + "=" * 60)
        print("✅ 部署完成！")
        print("=" * 60)
        print(f"\n🌐 访问地址: {self.get_server_url()}/index.html")
        print(f"📊 管理后台: {self.get_server_url()}/admin.html")
        print(f"🔑 登录: {self.get_server_url()}/login.html")
        print(f"\n默认管理员密码: admin123\n")
        print("📝 启动命令:")
        print(f"   cd {self.base_path}")
        print(f"   node server-express.js\n")
        print("=" * 60)
        
        return True

def main():
    """主函数"""
    deployer = RemoteDeployer()
    
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
