#!/usr/bin/env python3
"""
简单的HTTP服务器 - 启动在8080端口
"""

import http.server
import socketserver
import os

PORT = 8080

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def main():
    # 设置工作目录为当前目录
    os.chdir(os.path.dirname(__file__))
    
    print("=" * 60)
    print("🚀 市场活动系统 - 本地服务器启动")
    print("=" * 60)
    print(f"📍 服务地址: http://localhost:{PORT}/")
    print(f"📂 当前目录: {os.getcwd()}")
    print(f"📄 主页面: http://localhost:{PORT}/index.html")
    print("=" * 60)
    print("\n💡 账户信息:")
    print("   用户名: admin")
    print("   密码: admin123")
    print("\n⚠️  按 Ctrl + C 停止服务器")
    print("=" * 60 + "\n")
    
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"✅ 服务器已在端口 {PORT} 启动")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✅ 服务器已停止")

if __name__ == "__main__":
    main()