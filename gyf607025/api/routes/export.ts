import { Router, type Request, type Response } from "express";
import { store } from "../data/store.js";
import type { VerifyStatus, CourseTransaction } from "../../shared/types.js";

const router = Router();

function csvEscape(s: unknown): string {
  const v = s == null ? "" : String(s);
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

router.get("/", (req: Request, res: Response): void => {
  const { phone, status } = req.query;
  let items: CourseTransaction[] = [...store.transactions];
  if (typeof phone === "string" && phone.trim()) {
    items = items.filter((t) => t.phone.includes(phone.trim()));
  }
  if (typeof status === "string" && status !== "all") {
    const s = status as VerifyStatus;
    items = items.filter((t) => store.getTxStatus(t.transactionId) === s);
  }
  const total = items.length;

  const headers = ["交易流水号","手机号","宝宝姓名","课程名称","套餐名称","总课时","已用课时","金额(元)","购买日期","来源","核验状态","操作人/补录人"];
  const rows = items.map((t) => [
    t.transactionId,
    t.phone,
    t.babyName,
    t.courseName,
    t.packageName,
    String(t.totalSessions),
    String(t.usedSessions),
    String(t.amount),
    t.purchaseDate,
    t.source,
    store.getTxStatus(t.transactionId),
    t.operator ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="transactions.csv"');
  res.setHeader("X-Total-Count", String(total));
  res.send("\uFEFF" + csv);
});

export default router


