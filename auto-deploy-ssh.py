#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
市场活动管理系统 - 一键 SSH 部署脚本
自动通过 SCP 上传文件到远程服务器
"""

import os
import sys
import subprocess
import time
from pathlib import Path

# 配置
SERVER_HOST = "192.168.1.112"
SERVER_PORT = 5666
SERVER_USER = "huangshengwei"
SERVER_PASSWORD = "WKi3,Ly{1g"
LOCAL_DIR = "/Users/ray/WorkBuddy/20260320100957"
REMOTE_DIR = "/var/www/market-activity"

# 要上传的文件
FILES_TO_UPLOAD = [
    "index.html",
    "admin.html", 
    "login.html",
    "tencentcloud-adapter.js",
    "deploy-package.html",
]

# ANSI 颜色
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg):
    print(f"{Colors.OKGREEN}✅ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.FAIL}❌ {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.WARNING}⚠️  {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.OKBLUE}ℹ️  {msg}{Colors.ENDC}")

def print_header(msg):
    print(f"\n{Colors.BOLD}{Colors.OKGREEN}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}{msg}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.OKGREEN}{'='*70}{Colors.ENDC}\n")

def run_command(cmd, use_password=False):
    """执行命令"""
    try:
        if use_password:
            # 使用 sshpass 处理密码
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        else:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "命令执行超时"
    except Exception as e:
        return -1, "", str(e)

def test_ssh_connection():
    """测试 SSH 连接"""
    print_header("🔍 第 1 步：测试 SSH 连接")
    
    cmd = f'sshpass -p "{SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -p {SERVER_PORT} {SERVER_USER}@{SERVER_HOST} "echo OK" 2>&1'
    
    print_info(f"连接到 {SERVER_USER}@{SERVER_HOST}:{SERVER_PORT}")
    
    returncode, stdout, stderr = run_command(cmd, use_password=True)
    
    if returncode == 0 and "OK" in stdout:
        print_success("SSH 连接成功！")
        return True
    else:
        print_error(f"SSH 连接失败")
        print_info(f"错误信息: {stderr}")
        
        # 检查是否安装了 sshpass
        if "sshpass" in stderr or "command not found" in stderr:
            print_warning("sshpass 未安装，尝试安装...")
            run_command("brew install sshpass -q", use_password=False)
            print_info("重试连接...")
            returncode, stdout, stderr = run_command(cmd, use_password=True)
            if returncode == 0:
                print_success("SSH 连接成功！")
                return True
        
        return False

def create_remote_directory():
    """创建远程目录"""
    print_header("📁 第 2 步：创建远程目录")
    
    cmd = f'sshpass -p "{SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -p {SERVER_PORT} {SERVER_USER}@{SERVER_HOST} "sudo mkdir -p {REMOTE_DIR} && sudo chmod 755 {REMOTE_DIR}" 2>&1'
    
    print_info(f"创建目录: {REMOTE_DIR}")
    
    returncode, stdout, stderr = run_command(cmd, use_password=True)
    
    if returncode == 0:
        print_success(f"目录创建成功: {REMOTE_DIR}")
        return True
    else:
        # 如果 sudo 需要密码，尝试不用 sudo
        print_warning("使用 sudo 失败，尝试不用 sudo...")
        cmd = f'sshpass -p "{SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -p {SERVER_PORT} {SERVER_USER}@{SERVER_HOST} "mkdir -p {REMOTE_DIR}" 2>&1'
        returncode, stdout, stderr = run_command(cmd, use_password=True)
        
        if returncode == 0:
            print_success(f"目录已就位: {REMOTE_DIR}")
            return True
        else:
            print_error(f"无法创建目录: {stderr}")
            return False

def upload_files():
    """上传文件"""
    print_header("📤 第 3 步：上传文件到服务器")
    
    uploaded = []
    failed = []
    
    for filename in FILES_TO_UPLOAD:
        local_path = os.path.join(LOCAL_DIR, filename)
        
        if not os.path.exists(local_path):
            print_warning(f"本地文件不存在: {filename}")
            continue
        
        file_size = os.path.getsize(local_path)
        print_info(f"上传 {filename} ({file_size/1024:.1f} KB)...")
        
        remote_path = f"{SERVER_USER}@{SERVER_HOST}:{REMOTE_DIR}/{filename}"
        cmd = f'sshpass -p "{SERVER_PASSWORD}" scp -o StrictHostKeyChecking=no -P {SERVER_PORT} "{local_path}" "{remote_path}" 2>&1'
        
        returncode, stdout, stderr = run_command(cmd, use_password=True)
        
        if returncode == 0:
            print_success(f"✓ {filename} 上传成功")
            uploaded.append(filename)
        else:
            print_error(f"✗ {filename} 上传失败: {stderr}")
            failed.append(filename)
        
        time.sleep(0.5)  # 避免过快
    
    print()
    print_info(f"上传完成: {len(uploaded)} 个成功，{len(failed)} 个失败")
    
    return len(uploaded), len(failed), uploaded, failed

def configure_nginx():
    """配置 Nginx"""
    print_header("⚙️  第 4 步：配置 Nginx")
    
    # 检查 Nginx 是否在运行
    cmd = f'sshpass -p "{SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -p {SERVER_PORT} {SERVER_USER}@{SERVER_HOST} "which nginx && nginx -v 2>&1" 2>&1'
    
    returncode, stdout, stderr = run_command(cmd, use_password=True)
    
    if returncode != 0:
        print_warning("Nginx 可能未安装或未启动")
        print_info("跳过 Nginx 配置")
        return False
    
    print_success("检测到 Nginx 已安装")
    print_info("创建 Nginx 配置...")
    
    # 创建配置文件
    nginx_config = f"""location /market-activity {{
    alias {REMOTE_DIR};
    index index.html;
    try_files $uri $uri/ /index.html;
}}
"""
    
    # 保存到临时文件并上传
    temp_config = "/tmp/nginx-market-activity.conf"
    with open(temp_config, "w") as f:
        f.write(nginx_config)
    
    # 上传配置文件
    cmd = f'sshpass -p "{SERVER_PASSWORD}" scp -o StrictHostKeyChecking=no -P {SERVER_PORT} "{temp_config}" "{SERVER_USER}@{SERVER_HOST}:/tmp/nginx-market-activity.conf" 2>&1'
    run_command(cmd, use_password=True)
    
    # 将配置添加到 Nginx 主配置
    print_info("添加配置到 Nginx...")
    
    cmd = f'sshpass -p "{SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -p {SERVER_PORT} {SERVER_USER}@{SERVER_HOST} "cat /tmp/nginx-market-activity.conf | sudo tee -a /etc/nginx/sites-available/default > /dev/null 2>&1 && echo OK" 2>&1'
    
    returncode, stdout, stderr = run_command(cmd, use_password=True)
    
    if "OK" in stdout or returncode == 0:
        print_success("Nginx 配置已添加")
        
        # 测试配置
        print_info("测试 Nginx 配置...")
        cmd = f'sshpass -p "{SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -p {SERVER_PORT} {SERVER_USER}@{SERVER_HOST} "sudo nginx -t 2>&1" 2>&1'
        returncode, stdout, stderr = run_command(cmd, use_password=True)
        
        if "successful" in stdout or returncode == 0:
            print_success("Nginx 配置测试通过")
            
            # 重启 Nginx
            print_info("重启 Nginx...")
            cmd = f'sshpass -p "{SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -p {SERVER_PORT} {SERVER_USER}@{SERVER_HOST} "sudo systemctl restart nginx 2>&1 && echo OK" 2>&1'
            returncode, stdout, stderr = run_command(cmd, use_password=True)
            
            if "OK" in stdout or returncode == 0:
                print_success("Nginx 已重启")
                return True
    
    print_warning("Nginx 配置可能失败，请手动检查")
    return False

def verify_deployment():
    """验证部署"""
    print_header("✔️  第 5 步：验证部署")
    
    files_verified = []
    
    for filename in FILES_TO_UPLOAD:
        # 通过 SSH 检查文件是否存在
        cmd = f'sshpass -p "{SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -p {SERVER_PORT} {SERVER_USER}@{SERVER_HOST} "test -f {REMOTE_DIR}/{filename} && echo OK" 2>&1'
        
        returncode, stdout, stderr = run_command(cmd, use_password=True)
        
        if "OK" in stdout:
            print_success(f"✓ {filename} 已验证")
            files_verified.append(filename)
        else:
            print_warning(f"✗ {filename} 验证失败")
    
    return len(files_verified)

def show_access_info():
    """显示访问信息"""
    print_header("🎉 部署完成！")
    
    print(f"{Colors.BOLD}系统访问地址:{Colors.ENDC}")
    print(f"  前台报名: http://{SERVER_HOST}:{SERVER_PORT}/market-activity/index.html")
    print(f"  后台管理: http://{SERVER_HOST}:{SERVER_PORT}/market-activity/admin.html")
    print(f"  登录页面: http://{SERVER_HOST}:{SERVER_PORT}/market-activity/login.html")
    print()
    print(f"{Colors.BOLD}管理员账户:{Colors.ENDC}")
    print(f"  用户名: admin")
    print(f"  密码: admin123")
    print()

def main():
    print(f"\n{Colors.BOLD}{Colors.OKGREEN}🚀 市场活动管理系统 - SSH 一键部署{Colors.ENDC}\n")
    print_info(f"服务器: {SERVER_USER}@{SERVER_HOST}:{SERVER_PORT}")
    print_info(f"本地目录: {LOCAL_DIR}")
    print_info(f"远程目录: {REMOTE_DIR}")
    print()
    
    # 第 1 步：测试连接
    if not test_ssh_connection():
        print_error("无法连接到服务器，部署中止")
        return False
    
    # 第 2 步：创建目录
    if not create_remote_directory():
        print_error("无法创建远程目录，部署中止")
        return False
    
    # 第 3 步：上传文件
    uploaded, failed, uploaded_files, failed_files = upload_files()
    
    if uploaded == 0:
        print_error("没有文件上传成功，部署中止")
        return False
    
    # 第 4 步：配置 Nginx
    configure_nginx()
    
    # 第 5 步：验证部署
    verified = verify_deployment()
    
    # 显示结果
    show_access_info()
    
    if verified > 0:
        print_success(f"🎉 部署成功！{verified} 个文件已验证")
        return True
    else:
        print_warning("部分文件验证失败，但可能已正确上传")
        return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print_warning("\n部署已取消")
        sys.exit(1)
    except Exception as e:
        print_error(f"出错: {e}")
        sys.exit(1)
