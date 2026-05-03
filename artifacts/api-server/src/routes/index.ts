import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import agentsRouter from "./agents.js";
import commandsRouter from "./commands.js";
import auditLogsRouter from "./audit-logs.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/agents", agentsRouter);
router.use("/commands", commandsRouter);
router.use("/audit-logs", auditLogsRouter);

export default router;
