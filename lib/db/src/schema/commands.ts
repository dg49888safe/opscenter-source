import { pgTable, text, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const commandsTable = pgTable("commands", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  command: text("command").notNull(),
  status: text("status").notNull().default("pending"),
  output: text("output"),
  exitCode: integer("exit_code"),
  createdBy: text("created_by").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertCommandSchema = createInsertSchema(commandsTable).omit({ id: true, createdAt: true });
export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Command = typeof commandsTable.$inferSelect;
