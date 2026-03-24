#!/bin/bash
# 部署飞牛附件上传服务
# 在本地运行此脚本，它会通过 SSH 在飞牛上部署

SERVER="huangshengwei@192.168.1.112"
PASS="cvte2020"
TARGET_DIR="/opt/mcm-upload"
ATTACHMENTS_DIR="/volume1/web/attachments"

echo "🚀 开始部署飞牛附件上传服务..."

# 通过 SSH 执行远程部署命令
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$SERVER" << EOF
    echo "1. 创建目录..."
    sudo mkdir -p $TARGET_DIR
    sudo mkdir -p $ATTACHMENTS_DIR
    sudo chmod 755 $ATTACHMENTS_DIR
    sudo chown huangshengwei:users $ATTACHMENTS_DIR

    echo "2. 创建 Python 虚拟环境..."
    cd $TARGET_DIR
    python3 -m venv venv 2>/dev/null || echo "虚拟环境可能已存在"
    source venv/bin/activate

    echo "3. 安装 Flask..."
    pip install flask flask-cors > /dev/null 2>&1

    echo "4. 创建上传服务代码..."
    cat > $TARGET_DIR/upload_server.py << 'PYEOF'
#!/usr/bin/env python3
"""
飞牛附件上传服务
运行在 http://192.168.1.112:5001
"""
import os
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import logging

# 配置
UPLOAD_FOLDER = '/volume1/web/attachments'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
                      'jpg', 'jpeg', 'png', 'gif', 'txt', 'zip', 'rar'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def allowed_file(filename):
    """检查文件类型"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def make_response_json(code, message, data=None):
    """统一响应格式"""
    return jsonify({
        'code': code,
        'message': message,
        'data': data,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def health():
    """健康检查"""
    return make_response_json(200, '服务正常')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """上传文件接口"""
    if 'file' not in request.files:
        return make_response_json(400, '没有选择文件')
    
    file = request.files['file']
    if file.filename == '':
        return make_response_json(400, '文件名为空')
    
    if not allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else '未知'
        return make_response_json(400, f'不支持的文件类型 .{ext}，支持: {", ".join(ALLOWED_EXTENSIONS)}')
    
    # 生成唯一文件名
    original_name = file.filename
    ext = original_name.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
    
    try:
        file.save(file_path)
        
        # 文件信息
        file_size = os.path.getsize(file_path)
        file_info = {
            'id': unique_name,
            'original_name': original_name,
            'size': file_size,
            'url': f'/attachments/{unique_name}',
            'full_url': f'http://192.168.1.112:5666/attachments/{unique_name}',
            'upload_time': datetime.now().isoformat()
        }
        
        logging.info(f"文件上传成功: {original_name} -> {unique_name} ({file_size} bytes)")
        return make_response_json(200, '上传成功', file_info)
        
    except Exception as e:
        logging.error(f"上传失败: {str(e)}")
        return make_response_json(500, f'上传失败: {str(e)}')

@app.route('/api/files', methods=['GET'])
def list_files():
    """列出所有文件"""
    try:
        files = []
        for fname in os.listdir(app.config['UPLOAD_FOLDER']):
            fpath = os.path.join(app.config['UPLOAD_FOLDER'], fname)
            if os.path.isfile(fpath):
                stat = os.stat(fpath)
                files.append({
                    'id': fname,
                    'name': fname,
                    'size': stat.st_size,
                    'url': f'/attachments/{fname}',
                    'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        return make_response_json(200, '获取成功', {'files': files})
    except Exception as e:
        return make_response_json(500, f'获取失败: {str(e)}')

@app.route('/api/files/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """删除文件"""
    if not file_id or '..' in file_id:
        return make_response_json(400, '非法文件名')
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_id)
    if not os.path.exists(file_path):
        return make_response_json(404, '文件不存在')
    
    try:
        os.remove(file_path)
        logging.info(f"文件已删除: {file_id}")
        return make_response_json(200, '删除成功')
    except Exception as e:
        logging.error(f"删除失败: {str(e)}")
        return make_response_json(500, f'删除失败: {str(e)}')

# 静态文件服务（通过 Nginx 提供，这里仅做备份）
@app.route('/attachments/<path:filename>', methods=['GET'])
def serve_file(filename):
    """提供文件下载"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.errorhandler(413)
def too_large(e):
    """文件太大"""
    return make_response_json(413, f'文件超过{MAX_FILE_SIZE//1024//1024}MB限制')

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    logging.info(f"附件上传服务启动，文件存储在: {UPLOAD_FOLDER}")
    app.run(host='0.0.0.0', port=5001, debug=False)
PYEOF

    echo "5. 创建启动脚本..."
    cat > $TARGET_DIR/start-upload.sh << 'SHEOF'
#!/bin/bash
cd /opt/mcm-upload
source venv/bin/activate
python3 upload_server.py
SHEOF

    cat > $TARGET_DIR/start-upload-systemd.sh << 'SYSEOF'
#!/bin/bash
# 系统服务启动脚本
cd /opt/mcm-upload
source venv/bin/activate
nohup python3 upload_server.py > /var/log/mcm-upload.log 2>&1 &
echo $! > /tmp/mcm-upload.pid
echo "服务已启动，PID: \$(cat /tmp/mcm-upload.pid)"
echo "日志: /var/log/mcm-upload.log"
echo "访问: http://192.168.1.112:5001/api/health"
SYSEOF

    chmod +x $TARGET_DIR/start-upload.sh
    chmod +x $TARGET_DIR/start-upload-systemd.sh

    echo "6. 创建 Nginx 配置（如果使用 Nginx 反向代理）..."
    cat > /tmp/mcm-upload-nginx.conf << 'NGINXEOF'
# 在 Nginx 配置中添加以下 location
# 将附件请求代理到 Flask 服务
location /attachments/ {
    alias /volume1/web/attachments/;
    autoindex off;
    expires 30d;
    add_header Cache-Control "public, immutable";
    
    # 安全设置
    location ~* \.(php|sh|pl|py)$ {
        deny all;
        return 403;
    }
}

# 或者反向代理到 Flask API
location /api/upload/ {
    proxy_pass http://127.0.0.1:5001;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
}
NGINXEOF

    echo "✅ 部署完成！"
    echo ""
    echo "👉 启动服务命令:"
    echo "   cd /opt/mcm-upload"
    echo "   ./start-upload.sh"
    echo ""
    echo "👉 测试服务:"
    echo "   curl http://127.0.0.1:5001/api/health"
    echo ""
    echo "👉 文件存储位置: /volume1/web/attachments/"
    echo "👉 服务地址: http://192.168.1.112:5001"
EOF

echo ""
echo "📋 部署完成！现在请通过 SSH 登录飞牛并启动服务："
echo "ssh huangshengwei@192.168.1.112"
echo "密码: cvte2020"
echo ""
echo "然后执行："
echo "cd /opt/mcm-upload && ./start-upload.sh"
echo ""
echo "如果遇到端口冲突，可以修改 upload_server.py 中的端口号。"