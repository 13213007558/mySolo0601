import { Router, type Request, type Response } from "express";
import { store } from "../data/store.js";
import type { VerifyStatus } from "../../shared/types.js";

const router = Router();

router.get("/", (req: Request, res: Response): void => {
  const { phone, status } = req.query;
  let items = [...store.transactions];
  if (typeof phone === "string" && phone.trim()) {
    items = items.filter((t) => t.phone.includes(phone.trim()));
  }
  if (typeof status === "string" && status !== "all") {
    const s = status as VerifyStatus;
    items = items.filter((t) => store.getTxStatus(t.transactionId) === s);
  }
  const total = items.length;
  if (req.query.count === "true" || req.query.count === "1") {
    res.json({ total });
    return;
  }
  res.json({ items, total });
});

router.get("/stats", (req: Request, res: Response): void => {
  res.json(store.getStats());
});

router.get("/:id", (req: Request, res: Response): void => {
  const tx = store.findTransactionByTxId(req.params.id);
  if (!tx) {
    res.status(404).json({ success: false, error: "Transaction not found" });
    return;
  }
  const verifications = store.findVerificationsByTxId(req.params.id);
  res.json({ transaction: tx, verifications });
});

export default router
