import { Router } from "express";
import { db } from "@workspace/db";
import { agentsTable, commandsTable, auditLogsTable } from "@workspace/db";
import { eq, desc, gte, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { sendCommandToAgent, isAgentConnected } from "../lib/socket-manager.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const agents = await db.select().from(agentsTable).orderBy(desc(agentsTable.lastSeen));
    res.json(agents.map(a => ({
      id: String(a.id),
      name: a.name,
      hostname: a.hostname,
      os: a.os,
      ip: a.ip,
      status: isAgentConnected(a.agentKey) ? "online" : "offline",
      version: a.version ?? undefined,
      lastSeen: a.lastSeen.toISOString(),
      createdAt: a.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "\u5217\u8868\u7ec8\u7aef\u5931\u8d25");
    res.status(500).json({ error: "\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef" });
  }
});

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const agents = await db.select().from(agentsTable);
    const total = agents.length;
    const online = agents.filter(a => isAgentConnected(a.agentKey)).length;
    const offline = total - online;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const commandsTodayResult = await db.select({ count: count() }).from(commandsTable).where(gte(commandsTable.createdAt, today));
    const commandsToday = commandsTodayResult[0]?.count ?? 0;

    res.json({ total, online, offline, commandsToday: Number(commandsToday) });
  } catch (err) {
    req.log.error({ err }, "\u83b7\u53d6\u7edf\u8ba1\u5931\u8d25");
    res.status(500).json({ error: "\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef" });
  }
});

router.get("/:agentId", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.agentId);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid agent ID" }); return; }

    const agents = await db.select().from(agentsTable).where(eq(agentsTable.id, id)).limit(1);
    const agent = agents[0];
    if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

    res.json({
      id: String(agent.id),
      name: agent.name,
      hostname: agent.hostname,
      os: agent.os,
      ip: agent.ip,
      status: isAgentConnected(agent.agentKey) ? "online" : "offline",
      version: agent.version ?? undefined,
      lastSeen: agent.lastSeen.toISOString(),
      createdAt: agent.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "\u83b7\u53d6\u7ec8\u7aef\u5931\u8d25");
    res.status(500).json({ error: "\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef" });
  }
});

router.delete("/:agentId", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.agentId);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid agent ID" }); return; }

    const agents = await db.select().from(agentsTable).where(eq(agentsTable.id, id)).limit(1);
    const agent = agents[0];
    if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

    await db.delete(agentsTable).where(eq(agentsTable.id, id));

    await db.insert(auditLogsTable).values({
      action: "delete_agent",
      target: agent.hostname,
      detail: `Agent ${agent.name} (${agent.hostname}) deleted`,
      operator: req.session?.username ?? "unknown",
    });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "\u5220\u9664\u7ec8\u7aef\u5931\u8d25");
    res.status(500).json({ error: "\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef" });
  }
});

router.post("/:agentId/execute", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.agentId);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid agent ID" }); return; }

    const { command, timeout } = req.body as { command: string; timeout?: number };
    if (!command) { res.status(400).json({ error: "\u9700\u8981\u547d\u4ee4" }); return; }

    const agents = await db.select().from(agentsTable).where(eq(agentsTable.id, id)).limit(1);
    const agent = agents[0];
    if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

    if (!isAgentConnected(agent.agentKey)) {
      res.status(404).json({ error: "\u7ec8\u7aef\u5df2\u79bb\u7ebf" });
      return;
    }

    const inserted = await db.insert(commandsTable).values({
      agentId: id,
      agentName: agent.name,
      command,
      status: "pending",
      createdBy: req.session?.username ?? "admin",
    }).returning();

    const cmd = inserted[0];

    const dispatched = sendCommandToAgent(agent.agentKey, cmd.id, command, timeout);
    if (dispatched) {
      await db.update(commandsTable).set({ status: "running" }).where(eq(commandsTable.id, cmd.id));
    }

    await db.insert(auditLogsTable).values({
      action: "execute_command",
      target: agent.hostname,
      detail: command,
      operator: req.session?.username ?? "admin",
    });

    res.json({
      id: String(cmd.id),
      agentId: String(cmd.agentId),
      agentName: cmd.agentName,
      command: cmd.command,
      status: dispatched ? "running" : "pending",
      createdAt: cmd.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "\u6267\u884c\u547d\u4ee4\u5931\u8d25");
    res.status(500).json({ error: "\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef" });
  }
});

router.get("/:agentId/commands", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.agentId);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid agent ID" }); return; }

    const cmds = await db.select().from(commandsTable)
      .where(eq(commandsTable.agentId, id))
      .orderBy(desc(commandsTable.createdAt))
      .limit(50);

    res.json(cmds.map(c => ({
      id: String(c.id),
      agentId: String(c.agentId),
      agentName: c.agentName,
      command: c.command,
      status: c.status,
      output: c.output ?? undefined,
      exitCode: c.exitCode ?? undefined,
      createdAt: c.createdAt.toISOString(),
      completedAt: c.completedAt?.toISOString() ?? undefined,
    })));
  } catch (err) {
    req.log.error({ err }, "\u5217\u8868\u547d\u4ee4\u5931\u8d25");
    res.status(500).json({ error: "\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef" });
  }
});

export default router;
