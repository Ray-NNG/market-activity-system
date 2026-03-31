#!/usr/bin/env python3
"""
COS 上传脚本 - 自动清理旧版本
用法: python3 upload-to-cos.py [文件名]
默认上传 index.html
"""
import hmac, hashlib, time, urllib.request, urllib.parse, base64, sys
import xml.etree.ElementTree as ET

SECRET_ID  = 'AKIDS3QaXHxPcbQ1NTLzlJc2DAtOegT0Mmlz'
SECRET_KEY = 'HEzWpwd7XqX2V9jEdtwkgYDdpmUWJrAE'
BUCKET     = 'nnqgcvte2026-1414699807'
REGION     = 'ap-guangzhou'
host       = f'{BUCKET}.cos.{REGION}.myqcloud.com'

def make_auth(method, uri_path, url_params, headers_dict):
    now = int(time.time()); exp = now + 3600; st = f'{now};{exp}'
    sorted_h = sorted((k.lower(), v) for k, v in headers_dict.items())
    hh = '&'.join(f'{k}={urllib.parse.quote(str(v), safe="")}' for k, v in sorted_h)
    hl = ';'.join(k for k, v in sorted_h)
    sorted_p = sorted(urllib.parse.parse_qsl(url_params, keep_blank_values=True))
    hp = '&'.join(f'{k.lower()}={urllib.parse.quote(str(v), safe="")}' for k, v in sorted_p)
    pl = ';'.join(k.lower() for k, v in sorted_p) if sorted_p else ''
    hs = hashlib.sha1(f'{method.lower()}\n{uri_path}\n{hp}\n{hh}\n'.encode()).hexdigest()
    sk = hmac.new(SECRET_KEY.encode(), st.encode(), hashlib.sha1).hexdigest()
    sig = hmac.new(sk.encode(), f'sha1\n{st}\n{hs}\n'.encode(), hashlib.sha1).hexdigest()
    return f'q-sign-algorithm=sha1&q-ak={SECRET_ID}&q-sign-time={st}&q-key-time={st}&q-header-list={hl}&q-url-param-list={pl}&q-signature={sig}'

def put_file(local_path, cos_key):
    with open(local_path, 'rb') as f:
        body = f.read()
    ct = 'text/html; charset=utf-8'
    headers = {
        'cache-control': 'no-cache',
        'content-disposition': 'inline',
        'content-type': ct,
        'host': host,
    }
    encoded_key = '/'.join(urllib.parse.quote(seg, safe='') for seg in cos_key.split('/'))
    auth = make_auth('PUT', f'/{cos_key}', '', headers)
    req = urllib.request.Request(f'https://{host}/{encoded_key}', data=body, method='PUT')
    for k, v in headers.items():
        req.add_header(k.title(), v)
    req.add_header('Authorization', auth)
    r = urllib.request.urlopen(req, timeout=60)
    print(f'✅ 上传成功: {cos_key} ({len(body)//1024}KB) HTTP {r.status}')
    # 返回新版本ID
    return r.headers.get('x-cos-version-id', '')

def list_old_versions(cos_key):
    auth = make_auth('get', '/', f'prefix={cos_key}&versions=', {'host': host})
    req = urllib.request.Request(f'https://{host}/?prefix={urllib.parse.quote(cos_key)}&versions=', method='GET')
    req.add_header('Host', host)
    req.add_header('Authorization', auth)
    r = urllib.request.urlopen(req, timeout=10)
    xml_text = r.read().decode()
    root = ET.fromstring(xml_text)
    old_versions = []
    for v in root.findall('.//Version'):
        is_latest = v.find('IsLatest')
        vid = v.find('VersionId')
        key = v.find('Key')
        if is_latest is not None and is_latest.text == 'false' and vid is not None and key is not None:
            if key.text == cos_key:  # 精确匹配
                old_versions.append((key.text, vid.text))
    return old_versions

def delete_version(cos_key, version_id):
    encoded_key = '/'.join(urllib.parse.quote(seg, safe='') for seg in cos_key.split('/'))
    url_param = f'versionId={version_id}'
    auth = make_auth('delete', f'/{cos_key}', url_param, {'host': host})
    req = urllib.request.Request(f'https://{host}/{encoded_key}?{url_param}', method='DELETE')
    req.add_header('Host', host)
    req.add_header('Authorization', auth)
    try:
        r = urllib.request.urlopen(req, timeout=10)
        return r.status
    except urllib.error.HTTPError as e:
        if e.code == 204:
            return 204
        raise

def upload_and_clean(local_path, cos_key):
    print(f'\n📤 上传 {local_path} → {cos_key}')
    put_file(local_path, cos_key)
    
    print(f'🔍 检查旧版本...')
    time.sleep(1)  # 等待版本列表刷新
    old_versions = list_old_versions(cos_key)
    
    if old_versions:
        print(f'🗑️  发现 {len(old_versions)} 个旧版本，清理中...')
        for key, vid in old_versions:
            try:
                status = delete_version(key, vid)
                print(f'   ✅ 删除 {vid[:24]}... HTTP {status}')
            except Exception as e:
                print(f'   ⚠️  删除失败 {vid[:24]}...: {e}')
        print(f'✅ 旧版本清理完成')
    else:
        print(f'✅ 无旧版本，无需清理')
    
    print(f'\n🎉 部署完成！')
    print(f'🌐 访问地址: http://nnqgcvte2026-1414699807.cos-website.ap-guangzhou.myqcloud.com/')

if __name__ == '__main__':
    files = sys.argv[1:] if len(sys.argv) > 1 else ['index.html']
    for f in files:
        upload_and_clean(f, f)
