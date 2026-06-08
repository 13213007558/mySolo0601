import { Router, type Request, type Response } from "express";
import { store } from "../data/store.js";

const router = Router();

router.get("/", (req: Request, res: Response): void => {
  const { targetId } = req.query;
  const tid = typeof targetId === "string" ? targetId : undefined;
  const logs = store.findAuditLogsByTargetId(tid);
  res.json({ items: logs, total: logs.length });
});

export default router
