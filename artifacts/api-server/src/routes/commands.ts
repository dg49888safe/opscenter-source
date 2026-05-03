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
    req.log.error({ err }, "\u5217\u8868\u547d\u4ee4\u5931\u8d25");
    res.status(500).json({ error: "\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef" });
  }
});

export default router;
