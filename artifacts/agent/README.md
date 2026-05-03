# 运维 Agent

轻量级自动化运维 Agent，连接到中控 VPS，接收并执行远程命令。

## 编译为单 EXE（Windows）

```bash
cd artifacts/agent

# 安装依赖
npm install

# 编译
npm run compile

# 打包为 EXE（需要 pkg）
npx pkg dist/index.js --targets node18-win-x64 --output dist/ops-agent.exe
```

## 使用方式

### 首次运行
```cmd
ops-agent.exe --server wss://your-vps.com --key YOUR_AGENT_KEY --name "办公室-PC-01"
```

- **--server**: 中控 VPS 的 WebSocket 地址（如 `wss://your-vps.com`）
- **--key**: 在管理后台为该机器生成的唯一密钥
- **--name**: 机器名称（可选，默认用主机名）

### 后续运行
配置会保存在 `~/.ops-agent.json`，之后直接运行即可：
```cmd
ops-agent.exe
```

### 设为开机启动（Windows）
将 `ops-agent.exe` 的快捷方式放入：
```
C:\Users\<用户名>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\
```

## 行为说明

- **首次运行**: 弹窗提醒用户这是自动化运维软件，点击 OK 后开始静默运行
- **后续启动**: 直接静默运行，无弹窗
- **断线重连**: 网络中断后自动重连，间隔最长 30 秒
- **心跳保活**: 每 30 秒向服务器发送心跳，维持在线状态
- **命令执行**: 接收服务器下发的 Shell 命令并返回结果

## 管理后台登录

- 地址: `https://your-vps.com/`
- 默认账号: `admin`
- 默认密码: `admin123`

**首次登录后请立即修改密码！**
