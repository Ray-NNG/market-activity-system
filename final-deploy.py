#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
市场活动管理系统 - 最终部署脚本
直接上传所有文件到远程服务器
"""

import os
import sys
import requests
import json
from pathlib import Path
from urllib.parse import urljoin
import time

# 配置
SERVER_URL = "http://192.168.1.112:5666"
USERNAME = "huangshengwei"
PASSWORD = "WKi3,Ly{1g"
LOCAL_DIR = "/Users/ray/WorkBuddy/20260320100957"

# 要上传的核心文件
FILES_TO_UPLOAD = [
    "deploy-package.html",
    "index.html",
    "admin.html",
    "login.html",
    "tencentcloud-adapter.js",
]

# ANSI 颜色代码
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_success(msg):
    print(f"{Colors.OKGREEN}✅ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.FAIL}❌ {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.WARNING}⚠️  {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.OKBLUE}ℹ️  {msg}{Colors.ENDC}")

def print_header(msg):
    print(f"\n{Colors.BOLD}{Colors.OKGREEN}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{msg}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.OKGREEN}{'='*60}{Colors.ENDC}\n")

def check_server():
    """检查服务器连接"""
    print_header("🔍 第 1 步：检查服务器连接")
    
    try:
        response = requests.head(SERVER_URL, timeout=5)
        print_success(f"服务器在线: {SERVER_URL}")
        print_info(f"HTTP 状态码: {response.status_code}")
        print_info(f"服务器: {response.headers.get('Server', '未知')}")
        return True
    except Exception as e:
        print_error(f"无法连接到服务器: {e}")
        return False

def test_authentication():
    """测试认证"""
    print_header("🔐 第 2 步：测试认证")
    
    try:
        auth = (USERNAME, PASSWORD)
        response = requests.head(SERVER_URL, auth=auth, timeout=5)
        print_success(f"认证成功")
        print_info(f"响应状态码: {response.status_code}")
        return True
    except Exception as e:
        print_warning(f"认证可能失败: {e}")
        return False

def upload_file(filename):
    """上传单个文件"""
    local_path = os.path.join(LOCAL_DIR, filename)
    
    if not os.path.exists(local_path):
        print_warning(f"本地文件不存在: {filename}")
        return False
    
    file_size = os.path.getsize(local_path)
    print_info(f"上传 {filename} ({file_size/1024:.1f} KB)...")
    
    try:
        auth = (USERNAME, PASSWORD)
        url = urljoin(SERVER_URL, filename)
        
        with open(local_path, 'rb') as f:
            # 尝试 PUT 方法
            response = requests.put(url, data=f, auth=auth, timeout=10)
        
        if response.status_code in [200, 201, 204]:
            print_success(f"✓ {filename} 上传成功 (HTTP {response.status_code})")
            return True
        else:
            print_warning(f"HTTP {response.status_code}: {response.reason}")
            
            # 尝试 POST 方法
            print_info(f"尝试用 POST 方法...")
            with open(local_path, 'rb') as f:
                files = {'file': (filename, f)}
                response = requests.post(urljoin(SERVER_URL, 'upload'), 
                                       files=files, auth=auth, timeout=10)
            
            if response.status_code in [200, 201]:
                print_success(f"✓ {filename} 上传成功 (POST)")
                return True
            else:
                print_error(f"POST 失败: HTTP {response.status_code}")
                return False
                
    except Exception as e:
        print_error(f"上传失败: {e}")
        return False

def verify_upload(filename):
    """验证文件是否上传成功"""
    try:
        url = urljoin(SERVER_URL, filename)
        response = requests.head(url, timeout=5)
        if response.status_code == 200:
            print_success(f"✓ {filename} 验证成功 (HTTP {response.status_code})")
            return True
        else:
            print_warning(f"{filename} 返回 HTTP {response.status_code}")
            return False
    except Exception as e:
        print_warning(f"无法验证 {filename}: {e}")
        return False

def deploy():
    """执行部署"""
    print_header("🚀 市场活动管理系统 - 远程部署")
    print_info(f"目标服务器: {SERVER_URL}")
    print_info(f"用户: {USERNAME}")
    print()
    
    # 步骤 1: 检查服务器
    if not check_server():
        print_error("无法连接到服务器，部署中止")
        return False
    
    # 步骤 2: 测试认证
    test_authentication()
    
    # 步骤 3: 上传文件
    print_header("📤 第 3 步：上传文件")
    
    uploaded_files = []
    for filename in FILES_TO_UPLOAD:
        if upload_file(filename):
            uploaded_files.append(filename)
        print()
    
    # 步骤 4: 验证文件
    print_header("✔️  第 4 步：验证上传")
    
    verified_count = 0
    for filename in uploaded_files:
        time.sleep(0.5)  # 等待服务器处理
        if verify_upload(filename):
            verified_count += 1
        print()
    
    # 步骤 5: 显示访问地址
    print_header("📍 第 5 步：访问系统")
    
    print_success(f"部署完成！共上传 {len(uploaded_files)} 个文件，验证 {verified_count} 个")
    print()
    print_info("系统访问地址:")
    print(f"  {Colors.BOLD}前台报名:{Colors.ENDC} {SERVER_URL}/index.html")
    print(f"  {Colors.BOLD}后台管理:{Colors.ENDC} {SERVER_URL}/admin.html")
    print(f"  {Colors.BOLD}登录页面:{Colors.ENDC} {SERVER_URL}/login.html")
    print(f"  {Colors.BOLD}部署程序:{Colors.ENDC} {SERVER_URL}/deploy-package.html")
    print()
    print_info("默认管理员账户:")
    print(f"  {Colors.BOLD}用户名:{Colors.ENDC} admin")
    print(f"  {Colors.BOLD}密码:{Colors.ENDC} admin123")
    print()
    
    if verified_count == len(uploaded_files):
        print_success("🎉 所有文件验证成功！")
        print_info("现在访问上述地址即可使用系统")
        return True
    else:
        print_warning(f"⚠️  仅 {verified_count}/{len(uploaded_files)} 个文件验证成功")
        print_warning("可能需要手动检查服务器或尝试其他部署方式")
        return False

if __name__ == "__main__":
    try:
        success = deploy()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print_warning("\n部署已取消")
        sys.exit(1)
    except Exception as e:
        print_error(f"出错: {e}")
        sys.exit(1)
