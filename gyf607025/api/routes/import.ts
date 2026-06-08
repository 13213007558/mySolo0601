import { Router, type Request, type Response } from "express";
import { store } from "../data/store.js";
import { sampleTransactions, sampleVerifications, sampleAuditLogs } from "../../shared/sampleData.js";
import type { AuditLog, IdempotentResult } from "../../shared/types.js";

const router = Router();

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

router.post("/import-sample", (req: Request, res: Response): void => {
  let inserted = 0;
  let skipped = 0;
  const totalSample = sampleTransactions.length;

  for (const tx of sampleTransactions) {
    if (store.findTransactionByTxId(tx.transactionId)) {
      skipped++;
      continue;
    }
    store.appendTransaction(tx);
    for (const v of sampleVerifications.filter((x) => x.transactionId === tx.transactionId)) {
      store.appendVerification(v);
    }
    inserted++;
  }

  const now = new Date().toISOString();
  const log: AuditLog = {
    id: genId("log"),
    timestamp: now,
    operator: "admin",
    role: "supervisor",
    action: "import_sample",
    targetId: `batch-${Date.now()}`,
    targetType: "import",
    before: null,
    after: { inserted, skipped, totalSample },
    ip: req.ip ?? "127.0.0.1",
    note: skipped > 0 ? "部分数据已存在（幂等跳过）" :"全部新增成功",
  };
  store.appendAuditLog(log);

  const result: IdempotentResult = { inserted, skipped, totalSample };
  res.json({ success: true, ...result });
});

export default router
