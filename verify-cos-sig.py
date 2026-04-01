#!/usr/bin/env python3
"""
腾讯云 COS 签名独立验证工具
用法: python3 verify-cos-sig.py
"""
import hmac, hashlib, sys

# ===== 从调试日志获取的值 =====
JS_SIGN_KEY  = "214ca3cdae39f2e135f7e08a29eae131abd92fc1"
JS_SIGNATURE = "1a10d41a460bd8d8a274148335337bcb98783af4"
SIGN_TIME    = "1774350111;1774353711"
HTTP_STRING  = "head\n/data.json\n\nhost=nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com\n"

# ===== 请填入你的 SecretKey =====
SECRET_KEY = input("请输入 SecretKey（不会显示）: ").strip()

if not SECRET_KEY:
    print("❌ SecretKey 为空")
    sys.exit(1)

print(f"\nSecretKey 长度: {len(SECRET_KEY)} 字符")
print(f"SecretKey 前4位: {SECRET_KEY[:4]}...")
print(f"SecretKey 后4位: ...{SECRET_KEY[-4:]}")
print()

# Step1: signKey = HMAC-SHA1(SecretKey, signTime)
py_sign_key = hmac.new(SECRET_KEY.encode('utf-8'), SIGN_TIME.encode('utf-8'), hashlib.sha1).hexdigest()
print(f"【Step1 signKey】")
print(f"  Python 计算: {py_sign_key}")
print(f"  JS     计算: {JS_SIGN_KEY}")
print(f"  ✅ 一致" if py_sign_key == JS_SIGN_KEY else f"  ❌ 不一致 ← SecretKey 输入有误或JS实现有bug")

# Step2: httpHash
py_http_hash = hashlib.sha1(HTTP_STRING.encode('utf-8')).hexdigest()
print(f"\n【Step2 httpHash】")
print(f"  Python: {py_http_hash}  ✅ 已知一致")

# Step3: stringToSign
string_to_sign = f"sha1\n{SIGN_TIME}\n{py_http_hash}\n"

# Step4: signature = HMAC-SHA1(signKey_bytes, stringToSign)
py_signature = hmac.new(bytes.fromhex(py_sign_key), string_to_sign.encode('utf-8'), hashlib.sha1).hexdigest()
print(f"\n【Step4 signature】")
print(f"  Python 计算: {py_signature}")
print(f"  JS     计算: {JS_SIGNATURE}")
print(f"  ✅ 一致" if py_signature == JS_SIGNATURE else f"  ❌ 不一致")

print()
if py_sign_key == JS_SIGN_KEY and py_signature == JS_SIGNATURE:
    print("🎉 JS签名与Python完全一致 → 403原因不是签名计算错误，而是密钥权限/存储桶配置问题")
elif py_sign_key != JS_SIGN_KEY:
    print("⚠️  signKey 不一致 → 说明 JS 读取到的 SecretKey 和你输入的不同")
    print("   → 请检查：设置页面保存后是否真的生效？localStorage 里是否有旧配置覆盖？")
