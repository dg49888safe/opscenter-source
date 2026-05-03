/**
 * 自动化运维 Agent
 * 
 * 用法: ops-agent.exe --server wss://your-vps.com --key YOUR_AGENT_KEY
 * 
 * 启动时弹窗提醒，然后静默在后台运行并连接管理中控。
 */

import { io, Socket } from "socket.io-client";
import { exec, ExecOptions } from "child_process";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

// ─── 配置 ───────────────────────────────────────────────────────────────────
const CONFIG_FILE = path.join(os.homedir(), ".ops-agent.json");

interface Config {
  serverUrl: string;
  agentKey: string;
  name?: string;
}

function loadConfig(): Config {
  const args = process.argv.slice(2);
  let serverUrl = "";
  let agentKey = "";
  let name = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--server" && args[i + 1]) serverUrl = args[++i];
    if (args[i] === "--key" && args[i + 1]) agentKey = args[++i];
    if (args[i] === "--name" && args[i + 1]) name = args[++i];
  }

  // 从配置文件读取
  if (!serverUrl || !agentKey) {
    try {
      const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) as Config;
      serverUrl = serverUrl || saved.serverUrl;
      agentKey = agentKey || saved.agentKey;
      name = name || saved.name || "";
    } catch {}
  }

  if (!serverUrl || !agentKey) {
    console.error("[错误] 请提供 --server 和 --key 参数，或配置文件 ~/.ops-agent.json");
    console.error("[示例] ops-agent.exe --server wss://your-vps.com --key YOUR_KEY");
    process.exit(1);
  }

  // 保存配置
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ serverUrl, agentKey, name }, null, 2));
  } catch {}

  return { serverUrl, agentKey, name: name || os.hostname() };
}

// ─── 弹窗提醒（Windows / macOS / Linux）────────────────────────────────────
function showStartupNotice(callback: () => void) {
  const title = "自动化运维 Agent";
  const message = "自动化运维软件已启动。\n本软件由管理员授权运行，用于远程自动化运维。\n程序将在后台静默运行。";

  const platform = os.platform();

  if (platform === "win32") {
    // Windows: PowerShell MessageBox
    const ps = `powershell -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${message.replace(/'/g, "''")}','${title}','OK','Information')"`;
    exec(ps, () => callback());
  } else if (platform === "darwin") {
    // macOS: osascript
    const script = `osascript -e 'display dialog "${message.replace(/"/g, '\\"')}" with title "${title}" buttons {"OK"} default button "OK" with icon note'`;
    exec(script, () => callback());
  } else {
    // Linux: notify-send or zenity fallback
    const notify = `notify-send "${title}" "${message.replace(/"/g, '\\"')}" -t 8000 2>/dev/null || zenity --info --title="${title}" --text="${message.replace(/"/g, '\\"')}" 2>/dev/null || true`;
    exec(notify, () => callback());
  }
}

// ─── 命令执行 ────────────────────────────────────────────────────────────────
interface CommandPayload {
  commandId: number;
  command: string;
  timeout?: number;
}

function executeCommand(payload: CommandPayload, socket: Socket) {
  const { commandId, command, timeout = 60 } = payload;

  console.log(`[CMD #${commandId}] 执行: ${command}`);

  const options: ExecOptions = {
    timeout: timeout * 1000,
    maxBuffer: 10 * 1024 * 1024, // 10MB
    shell: os.platform() === "win32" ? "cmd.exe" : "/bin/sh",
  };

  exec(command, options, (error, stdout, stderr) => {
    const output = [stdout, stderr].filter(Boolean).join("\n").trim();
    const exitCode = error?.code ?? 0;

    let status: "completed" | "failed" | "timeout";
    if (!error) {
      status = "completed";
    } else if (error.killed || (error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
      status = "timeout";
    } else {
      status = "failed";
    }

    console.log(`[CMD #${commandId}] 完成: ${status} (exit: ${exitCode})`);

    socket.emit("command:result", {
      commandId,
      output: output || "(无输出)",
      exitCode,
      status,
    });
  });
}

// ─── 主逻辑 ──────────────────────────────────────────────────────────────────
function startAgent(config: Config) {
  const agentInfo = {
    agentKey: config.agentKey,
    hostname: os.hostname(),
    os: `${os.platform()} ${os.release()}`,
    ip: getLocalIP(),
    name: config.name || os.hostname(),
    version: "1.0.0",
  };

  console.log(`[Agent] 正在连接服务器: ${config.serverUrl}`);

  let reconnectDelay = 3000;

  function connect() {
    const socket = io(config.serverUrl, {
      path: "/api/agent-ws",
      auth: {
        agentKey: config.agentKey,
        info: agentInfo,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: reconnectDelay,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
      console.log(`[Agent] 已连接，Socket ID: ${socket.id}`);
      reconnectDelay = 3000;
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Agent] 断开连接: ${reason}`);
    });

    socket.on("connect_error", (err) => {
      console.log(`[Agent] 连接错误: ${err.message}，${reconnectDelay / 1000}s 后重试...`);
    });

    socket.on("command:execute", (payload: CommandPayload) => {
      executeCommand(payload, socket);
    });

    // 心跳
    setInterval(() => {
      if (socket.connected) {
        socket.emit("heartbeat");
      }
    }, 30000);
  }

  connect();
}

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaces = interfaces[name];
    if (!ifaces) continue;
    for (const iface of ifaces) {
      if (!iface.internal && iface.family === "IPv4") {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

// ─── 入口 ─────────────────────────────────────────────────────────────────────
const config = loadConfig();

// 只在第一次运行时显示弹窗（通过检查标志文件）
const noticeFlag = path.join(os.homedir(), ".ops-agent-noticed");
const alreadyNoticed = fs.existsSync(noticeFlag);

if (!alreadyNoticed) {
  showStartupNotice(() => {
    try { fs.writeFileSync(noticeFlag, "1"); } catch {}
    startAgent(config);
  });
} else {
  // 后续启动直接静默运行
  startAgent(config);
}

// 防止进程退出
process.on("uncaughtException", (err) => {
  console.error("[Agent] 未捕获异常:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Agent] 未处理的 Promise 拒绝:", reason);
});
