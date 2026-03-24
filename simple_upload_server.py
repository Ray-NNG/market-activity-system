#!/usr/bin/env python3
"""
极简文件上传服务器 - 无需安装 Flask
使用 Python 内置 http.server
"""
import http.server
import socketserver
import json
import uuid
import os
import cgi
from datetime import datetime
from urllib.parse import urlparse, parse_qs

UPLOAD_DIR = '/tmp/attachments'
PORT = 5001

class FileUploadHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        """处理 GET 请求"""
        parsed = urlparse(self.path)
        
        if parsed.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'code': 200,
                'message': '服务正常',
                'timestamp': datetime.now().isoformat()
            }).encode())
        
        elif parsed.path.startswith('/attachments/'):
            # 提供文件下载
            filename = parsed.path.split('/')[-1]
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(filepath):
                self.send_response(200)
                self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
                self.send_header('Access-Control-Allow-Origin', '*')
                with open(filepath, 'rb') as f:
                    content = f.read()
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_error(404, 'File not found')
        
        else:
            self.send_error(404, 'Not Found')
    
    def do_POST(self):
        """处理文件上传"""
        if self.path != '/api/upload':
            self.send_error(404, 'Not Found')
            return
        
        # 解析 multipart/form-data
        content_type = self.headers.get('Content-Type')
        if not content_type or 'multipart/form-data' not in content_type:
            self.send_error(400, '需要 multipart/form-data')
            return
        
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD': 'POST'}
        )
        
        if 'file' not in form:
            self.send_error(400, '没有文件字段')
            return
        
        file_item = form['file']
        if not file_item.filename:
            self.send_error(400, '文件名为空')
            return
        
        # 生成唯一文件名
        original_name = file_item.filename
        ext = original_name.split('.')[-1].lower() if '.' in original_name else ''
        unique_name = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
        
        # 确保目录存在
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filepath = os.path.join(UPLOAD_DIR, unique_name)
        
        # 保存文件
        try:
            with open(filepath, 'wb') as f:
                if isinstance(file_item.file, bytes):
                    f.write(file_item.file)
                else:
                    f.write(file_item.file.read())
            
            file_size = os.path.getsize(filepath)
            
            # 响应
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'code': 200,
                'message': '上传成功',
                'data': {
                    'id': unique_name,
                    'original_name': original_name,
                    'size': file_size,
                    'url': f'/attachments/{unique_name}',
                    'full_url': f'http://{self.headers.get("Host", "192.168.1.112:5001")}/attachments/{unique_name}',
                    'upload_time': datetime.now().isoformat()
                },
                'timestamp': datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode())
            
            print(f"[UPLOAD] {original_name} -> {unique_name} ({file_size} bytes)")
            
        except Exception as e:
            print(f"[ERROR] 上传失败: {str(e)}")
            self.send_error(500, f'上传失败: {str(e)}')
    
    def do_OPTIONS(self):
        """处理 CORS 预检请求"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

if __name__ == '__main__':
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    print(f"🚀 极简文件上传服务器启动在端口 {PORT}")
    print(f"📁 文件存储目录: {UPLOAD_DIR}")
    print(f"📤 上传接口: POST http://0.0.0.0:{PORT}/api/upload")
    print(f"📥 下载接口: GET http://0.0.0.0:{PORT}/attachments/<文件名>")
    print(f"🩺 健康检查: GET http://0.0.0.0:{PORT}/api/health")
    
    with socketserver.TCPServer(("", PORT), FileUploadHandler) as httpd:
        httpd.serve_forever()