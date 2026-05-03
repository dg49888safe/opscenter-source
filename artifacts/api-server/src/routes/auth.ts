import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };

  if (!username || !password) {
    res.status(400).json({ error: "\u9700\u8981\u7528\u6237\u540d\u548c\u5bc6\u7801" });
    return;
  }

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    const user = users[0];

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    req.session!.userId = user.id;
    req.session!.username = user.username;
    req.session!.role = user.role;

    res.json({ id: String(user.id), username: user.username, role: user.role });
  } catch (err) {
    req.log.error({ err }, "\u767b\u5f55\u9519\u8bef");
    res.status(500).json({ error: "\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef" });
  }
});

router.post("/logout", (req, res) => {
  req.session?.destroy(() => {});
  res.json({ success: true });
});

router.get("/me", (req, res) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "\u672a\u8ba4\u8bc1" });
    return;
  }
  res.json({
    id: String(req.session.userId),
    username: req.session.username,
    role: req.session.role,
  });
});

export default router;
