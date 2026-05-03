# 自动化运维平台 (OpsCenter)

## 概述

集中式远程运维管理平台。管理员通过 Web 后台管理所有已连接的机器，在各内网 PC 上安装轻量 Agent，Agent 主动连接中控 VPS，支持远程命令执行、实时状态监控、审计日志。

## 技术栈

- **Monorepo**: pnpm workspaces
- **Node.js**: v24
- **TypeScript**: 5.9
- **前端**: React + Vite + TailwindCSS + shadcn/ui (artifacts/dashboard)
- **后端**: Express 5 + Socket.IO (artifacts/api-server)
- **数据库**: PostgreSQL + Drizzle ORM (lib/db)
- **实时通信**: Socket.IO (WebSocket)
- **认证**: express-session + bcryptjs
- **API 合约**: OpenAPI 3.1 → Orval codegen (React Query hooks + Zod)
- **Agent**: Node.js TypeScript，可用 pkg 编译为单 EXE

## 目录结构

```
artifacts/
  dashboard/          # 管理后台前端 (React + Vite)，预览路径 /
  api-server/         # 后端 API + WebSocket 服务，路径 /api
  agent/              # 轻量 Agent 源码（可编译为 EXE）
lib/
  db/                 # PostgreSQL schema (users, agents, commands, audit_logs)
  api-spec/           # OpenAPI 规范 + Orval 配置
  api-client-react/   # 生成的 React Query hooks
  api-zod/            # 生成的 Zod 校验 schemas
```

## 数据库表

- `users` — 管理员账户
- `agents` — 已注册的 Agent 机器
- `commands` — 远程命令执行记录
- `audit_logs` — 操作审计日志

## 默认账号

- 用户名: `admin`
- 密码: `admin123`
- **首次登录后请立即修改密码！**

## Agent 使用

```bash
# 编译 EXE（在 artifacts/agent 目录）
npm install
npm run compile
npx pkg dist/index.js --targets node18-win-x64 --output dist/ops-agent.exe

# 运行 Agent
ops-agent.exe --server wss://your-vps.com --key YOUR_AGENT_KEY --name "机器名称"
```

Agent 行为：
- 首次运行弹窗提醒（Windows MessageBox / macOS osascript / Linux notify-send）
- 后续启动静默运行
- 每 30 秒心跳保活
- 断线自动重连（最长间隔 30 秒）

## WebSocket 协议

- Agent 连接路径: `/api/agent-ws`
- Agent → Server: `heartbeat`, `command:result`
- Server → Agent: `command:execute`

## 关键命令

- `pnpm run typecheck` — 全量类型检查
- `pnpm --filter @workspace/api-spec run codegen` — 重新生成 API hooks
- `pnpm --filter @workspace/db run push` — 推送 DB schema 变更

## 第一期功能（已完成）

- [x] 管理员登录/登出
- [x] 仪表盘（在线统计、Agent 列表、命令概览）
- [x] Agent 管理（列表、详情、删除）
- [x] 远程命令执行（实时状态轮询）
- [x] 命令历史记录
- [x] 审计日志
- [x] WebSocket Agent 连接层
- [x] 轻量 Agent 源码（含启动弹窗 + 静默运行）

## 第二期规划

- [ ] Agent 注册密钥管理（在后台生成密钥分发给机器）
- [ ] 任务队列（Agent 离线时缓存任务）
- [ ] 多租户支持
- [ ] 计费/授权模块
