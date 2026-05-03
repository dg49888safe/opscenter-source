import { Router } from "express";
import { db } from "@workspace/db";
import { commandsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const cmds = await db.select().from(commandsTable)
      .orderBy(desc(commandsTable.createdAt))
      .limit(100);

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
    req.log.error({ err }, "Failed to list commands");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
