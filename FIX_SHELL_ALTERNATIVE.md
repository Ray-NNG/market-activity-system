# SSH Shell 修复 - 替代方案

## 问题
```
sudo: usermod: command not found
```

说明这个 Linux 系统可能是 **Alpine/BusyBox** 或其他轻量级系统，没有 `usermod` 命令。

---

## 🔧 替代方案

### 方案 1：直接编辑 /etc/passwd（最可靠）⭐⭐⭐

```bash
# 方式 A：用 sed 修改
sudo sed -i 's|huangshengwei:/sbin/nologin|huangshengwei:/bin/bash|g' /etc/passwd

# 方式 B：用 vi/nano 直接编辑
sudo vi /etc/passwd
# 找到这一行：huangshengwei:x:1000:1000::/home/huangshengwei:/sbin/nologin
# 改为：     huangshengwei:x:1000:1000::/home/huangshengwei:/bin/bash
# 保存退出 (vi: :wq)

# 方式 C：用 awk 修改
sudo awk -F: '$1=="huangshengwei" {$NF="/bin/bash"} 1' OFS=: /etc/passwd > /tmp/passwd.new && sudo mv /tmp/passwd.new /etc/passwd
```

**验证**：
```bash
grep huangshengwei /etc/passwd
# 应该显示末尾为 /bin/bash 而不是 /sbin/nologin
```

### 方案 2：检查系统类型并用对应方式修复

```bash
# 检查是否为 Alpine/BusyBox
cat /etc/os-release | grep -i alpine

# 检查 /etc/shadow（需要 root）
sudo cat /etc/shadow | grep huangshengwei

# 检查所有用户
cat /etc/passwd | grep huangshengwei
```

### 方案 3：如果还是不行，用 Perl

```bash
# 用 Perl 修改
sudo perl -i -ne 's/^huangshengwei:(.*):\K\/sbin\/nologin$//bin\/bash/; print' /etc/passwd
```

### 方案 4：完全绕过 SSH，用 SFTP 上传文件

如果修改 shell 还是不行，直接用 SFTP 上传文件到服务器：

```bash
# 在 Mac 本地执行
sshpass -p 'cvte2020' sftp huangshengwei@192.168.1.112 << 'EOF'
cd /var/www
put index.html
put admin.html
put login.html
bye
EOF
```

---

## 📋 推荐步骤

### 第 1 步：检查当前用户配置

```bash
sudo cat /etc/passwd | grep huangshengwei
```

**可能的输出**（选一个对应处理）：

**情况 A**：末尾是 `/sbin/nologin`
```
huangshengwei:x:1000:1000::/home/huangshengwei:/sbin/nologin
```
→ 用 `方案 1 - 方式 A`：`sudo sed -i 's|/sbin/nologin|/bin/bash|g' /etc/passwd`

**情况 B**：末尾是 `/bin/false`
```
huangshengwei:x:1000:1000::/home/huangshengwei:/bin/false
```
→ 用 `方案 1 - 方式 A`：`sudo sed -i 's|/bin/false|/bin/bash|g' /etc/passwd`

**情况 C**：末尾已经是 `/bin/bash`（但还是不能登录）
```
huangshingwei:x:1000:1000::/home/huangshengwei:/bin/bash
```
→ 可能是权限问题，执行：
```bash
sudo mkdir -p /home/huangshengwei
sudo chown huangshengwei:huangshengwei /home/huangshengwei
sudo chmod 755 /home/huangshengwei
```

### 第 2 步：创建 home 目录（必需）

```bash
sudo mkdir -p /home/huangshengwei
sudo chown huangshengwei:huangshengwei /home/huangshengwei
sudo chmod 755 /home/huangshengwei
```

### 第 3 步：验证修复

在服务器上执行：
```bash
ssh huangshengwei@localhost
# 如果看到 shell 提示符说明成功了
```

或者从 Mac 执行：
```bash
sshpass -p 'cvte2020' ssh huangshengwei@192.168.1.112 "echo 'SSH 登录成功'"
```

---

## 🆘 如果还是不行？

### 检查是否为 Alpine Linux

```bash
# 执行这个看看
cat /etc/os-release
```

**如果是 Alpine**，shell 文件位置可能不同：
```bash
# Alpine 中查找所有可用的 shell
cat /etc/shells

# 可能输出类似：
# /bin/sh
# /bin/ash
# /bin/bash (如果安装了)
```

**修改方式**：
```bash
# 用可用的 shell，比如 /bin/ash
sudo sed -i 's|huangshengwei:/sbin/nologin|huangshengwei:/bin/ash|g' /etc/passwd
```

### 检查是否有权限问题

```bash
# 查看 /etc/passwd 和 /etc/shadow 的权限
ls -l /etc/passwd /etc/shadow

# 应该显示：
# -rw-r--r-- ... /etc/passwd
# -r-------- ... /etc/shadow
```

---

## 💡 完整的一键修复脚本

如果你有 root 权限，可以这样做：

```bash
#!/bin/bash

# 修复 huangshengwei 账户

# 1. 修改 shell
echo "修复 shell..."
sudo sed -i 's|huangshengwei:/sbin/nologin|huangshengwei:/bin/bash|g' /etc/passwd
sudo sed -i 's|huangshengwei:/bin/false|huangshengwei:/bin/bash|g' /etc/passwd

# 2. 创建 home 目录
echo "创建 home 目录..."
sudo mkdir -p /home/huangshengwei
sudo chown huangshengwei:huangshengwei /home/huangshengwei
sudo chmod 755 /home/huangshengwei

# 3. 验证
echo "验证修复..."
grep huangshengwei /etc/passwd

echo "✅ 修复完成！"
```

保存为 `fix-shell.sh`，然后执行：
```bash
bash fix-shell.sh
```

---

## 🎯 快速判断

**按这个顺序尝试**：

1. **最简单**：先查看当前配置
   ```bash
   cat /etc/passwd | grep huangshengwei
   ```

2. **最可能成功**：用 sed 修改
   ```bash
   sudo sed -i 's|/sbin/nologin|/bin/bash|g' /etc/passwd
   ```

3. **如果失败**：尝试 Alpine 方案
   ```bash
   sudo sed -i 's|/sbin/nologin|/bin/ash|g' /etc/passwd
   ```

4. **都不行**：用 SFTP 绕过
   ```bash
   sshpass -p 'cvte2020' sftp huangshengwei@192.168.1.112 << 'EOF'
   cd /var/www
   put index.html
   bye
   EOF
   ```

---

## 📞 需要帮助？

告诉我：
1. 执行 `cat /etc/passwd | grep huangshengwei` 的输出
2. 或者执行 `cat /etc/os-release` 的输出
3. 我可以给你更精准的命令

或者直接让我执行 **方案 4（SFTP 上传）**，无需修改 shell！
