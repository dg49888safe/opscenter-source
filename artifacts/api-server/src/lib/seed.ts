import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

export async function seedDefaultAdmin() {
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.username, "admin")).limit(1);
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await db.insert(usersTable).values({
        username: "admin",
        passwordHash,
        role: "admin",
      });
      logger.info("Default admin user created: admin / admin123");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed admin user");
  }
}
