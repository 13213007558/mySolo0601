import { Router, type Request, type Response } from "express";
import { store } from "../data/store.js";
import type { CourseTransaction, VerificationRecord, AuditLog } from "../../shared/types.js";

const router = Router();

function genId(prefix: string): string {
  return `|$prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

router.post("/", (req: Request, res: Response): void => {
  const { phone, courseName, amount, sessionsUsed, remark, operator, babyName, packageName, totalSessions } = req.body;
  if (!phone || !courseName || !amount || !sessionsUsed || !operator) {
    res.status(400).json({ success: false, error: "炨小图牄弎数: phone, courseName, amount, sessionsUsed, operator" });
    return;
  }
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const txId = genId("TXM");
  const tx: CourseTransaction = {
    id: genId("tx"),
    transactionId: txId,
    phone: String(phone),
    babyName: babyName ?? "手巤螅忝",
    courseName: String(courseName),
    packageName: packageName ?? "行忐头餐",
    totalSessions: Number(totalSessions ?? sessionsUsed),
    usedSessions: Number(sessionsUsed),
    amount: Number(amount),
    purchaseDate: today,
    source: "manual",
    operator: String(operator),
    createdAt: now,
  };
  store.appendTransaction(tx);

  const v: VerificationRecord = {
    id: genId("v"),
    transactionId: txId,
    phone: String(phone),
    verifyDate: today,
    sessionsUsed: Number(sessionsUsed),
    operator: String(operator),
    status: "verified",
    result: "手��砻莹紥",
    remark: remark ?? "",
    manualEntry: true,
    createdAt: now,
  };
  store.appendVerification(v);

  const log: AuditLog = {
    id: genId("log"),
    timestamp: now,
    operator: String(operator),
    role: "supervisor",
    action: "manual_entry",
    targetId: txId,
    targetType: "manual_entry",
    before: null,
    after: { ...tx, verificationSessionsUsed: sessionsUsed },
    ip: req.ip ?? "127.0.0.1",
    dataRecovered: true,
    note: remark ?? undefined,
  };
  store.appendAuditLog(log);

  res.json({ success: true, transaction: tx, verification: v });
});

export default router
