#!/bin/bash
# 修复 huangshengwei 账户 SSH 登录
# 需要管理员权限执行

echo "🔧 正在修复 huangshengwei 账户 shell 设置..."

# 检查当前 shell
CURRENT_SHELL=$(grep ^huangshengwei /etc/passwd | cut -d: -f7)
echo "当前 shell: $CURRENT_SHELL"

# 修改为 /bin/bash
if [ "$CURRENT_SHELL" != "/bin/bash" ]; then
    sudo usermod -s /bin/bash huangshengwei 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ 已成功修改 shell 为 /bin/bash"
    else
        echo "❌ 修改失败，请确保有管理员权限"
        exit 1
    fi
else
    echo "✅ 已经是 /bin/bash，无需修改"
fi

# 验证修改
NEW_SHELL=$(grep ^huangshengwei /etc/passwd | cut -d: -f7)
echo "验证结果：$NEW_SHELL"

# 测试 SSH（可选）
echo ""
echo "📋 测试命令："
echo "ssh huangshengwei@192.168.1.112"
echo "密码: cvte2020"
echo ""
echo "如果还不行，尝试重启 SSH 服务："
echo "sudo systemctl restart ssh"
echo "或"
echo "sudo service ssh restart"