import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const logs = await db.select().from(auditLogsTable)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(200);

    res.json(logs.map(l => ({
      id: String(l.id),
      action: l.action,
      target: l.target,
      detail: l.detail ?? undefined,
      operator: l.operator,
      createdAt: l.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "\u5217\u8868\u5ba1\u8ba1\u65e5\u5fd7\u5931\u8d25");
    res.status(500).json({ error: "\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef" });
  }
});

export default router;
