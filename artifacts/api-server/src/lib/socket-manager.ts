import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "./logger.js";
import { db } from "@workspace/db";
import { agentsTable, commandsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

interface AgentInfo {
  agentKey: string;
  hostname: string;
  os: string;
  ip: string;
  name: string;
  version?: string;
}

interface CommandResult {
  commandId: number;
  output: string;
  exitCode: number;
  status: "completed" | "failed" | "timeout";
}

const agentSockets = new Map<string, Socket>();

export function setupSocketIO(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
    path: "/api/agent-ws",
  });

  io.on("connection", async (socket) => {
    const agentKey = socket.handshake.auth?.agentKey as string | undefined;
    const info = socket.handshake.auth?.info as AgentInfo | undefined;

    if (!agentKey || !info) {
      logger.warn({ socketId: socket.id }, "Agent connected without agentKey or info, disconnecting");
      socket.disconnect(true);
      return;
    }

    logger.info({ agentKey, hostname: info.hostname }, "Agent connected");

    try {
      const existing = await db.select().from(agentsTable).where(eq(agentsTable.agentKey, agentKey)).limit(1);

      if (existing.length > 0) {
        await db.update(agentsTable)
          .set({ status: "online", lastSeen: new Date(), hostname: info.hostname, os: info.os, ip: info.ip, name: info.name, version: info.version })
          .where(eq(agentsTable.agentKey, agentKey));
      } else {
        await db.insert(agentsTable).values({
          agentKey,
          name: info.name || info.hostname,
          hostname: info.hostname,
          os: info.os,
          ip: info.ip,
          version: info.version,
          status: "online",
          lastSeen: new Date(),
        });
      }

      agentSockets.set(agentKey, socket);

      socket.on("command:result", async (data: CommandResult) => {
        logger.info({ commandId: data.commandId, status: data.status }, "Received command result");
        try {
          await db.update(commandsTable)
            .set({
              output: data.output,
              exitCode: data.exitCode,
              status: data.status,
              completedAt: new Date(),
            })
            .where(eq(commandsTable.id, data.commandId));
        } catch (err) {
          logger.error({ err }, "Failed to update command result");
        }
      });

      socket.on("heartbeat", async () => {
        try {
          await db.update(agentsTable)
            .set({ lastSeen: new Date(), status: "online" })
            .where(eq(agentsTable.agentKey, agentKey));
        } catch (err) {
          logger.error({ err }, "Failed to update heartbeat");
        }
      });

      socket.on("disconnect", async () => {
        logger.info({ agentKey }, "Agent disconnected");
        agentSockets.delete(agentKey);
        try {
          await db.update(agentsTable)
            .set({ status: "offline" })
            .where(eq(agentsTable.agentKey, agentKey));
        } catch (err) {
          logger.error({ err }, "Failed to mark agent offline");
        }
      });
    } catch (err) {
      logger.error({ err }, "Error handling agent connection");
      socket.disconnect(true);
    }
  });

  return io;
}

export function sendCommandToAgent(agentKey: string, commandId: number, command: string, timeout?: number): boolean {
  const socket = agentSockets.get(agentKey);
  if (!socket || !socket.connected) return false;
  socket.emit("command:execute", { commandId, command, timeout: timeout ?? 60 });
  return true;
}

export function isAgentConnected(agentKey: string): boolean {
  const socket = agentSockets.get(agentKey);
  return !!socket && socket.connected;
}
