import type { CheckRecord, RecordStatus } from "@/types";
import { maskPhone, formatDateTime } from "./id";

const STATUS_TEXT: Record<RecordStatus, string> = {
  normal: "正常",
  abnormal: "异常",
  pending_review: "待人工复核",
  reviewed: "已人工复核",
};

const STATUS_ICON: Record<RecordStatus, string> = {
  normal: "✅",
  abnormal: "⚠️",
  pending_review: "🔍",
  reviewed: "✔️",
};

function getAdvice(record: CheckRecord): string {
  if (record.status === "normal") return "无需处理，继续保持";
  if (record.status === "reviewed") return "店长已改判，请按改判意见执行";
  if (record.status === "pending_review") return "请店长尽快完成人工复核并给出结论";
  const dangerCount = record.taboos.filter((t) => t.severity === "danger").length;
  if (dangerCount > 0) return "存在高风险禁忌，请客服立即联系家长确认宝宝是否出现不适，并通知厨房暂停该食材";
  return "存在中风险提醒，建议客服电话回访家长确认食用情况";
}

export function buildExportSummary(records: CheckRecord[]): string {
  const now = formatDateTime(new Date().toISOString());
  const uniqueParents = new Set(records.map((r) => r.parentPhone)).size;
  const lines: string[] = [];
  const sep = "━".repeat(52);

  lines.push(sep);
  lines.push("婴幼儿辅食禁忌对账摘要");
  lines.push(`生成时间：${now}`);
  lines.push(`共 ${records.length} 条记录，对应 ${uniqueParents} 位家长`);
  lines.push(sep);
  lines.push("");

  const grouped = new Map<string, CheckRecord[]>();
  records.forEach((r) => {
    const key = r.parentPhone;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  });

  let idx = 1;
  for (const [phone, list] of grouped.entries()) {
    const first = list[0];
    lines.push(`【家长】${first.parentName}（${maskPhone(phone)}）`);
    for (const record of list) {
      const tabooText =
        record.taboos.length === 0
          ? "无禁忌匹配"
          : record.taboos
              .map(
                (t, i) =>
                  `    ${i + 1}. ${t.ingredientName} —— ${t.tabooReason}${t.severity === "danger" ? "（高风险）" : "（中风险）"}`,
              )
              .join("\n");
      lines.push(`  【${idx}】${record.babyName}  ${record.babyMonthAge}月龄  |  对账日期：${record.checkDate}  |  来源：${record.submitMethod}`);
      lines.push(`      对账结果：${STATUS_ICON[record.status]} ${STATUS_TEXT[record.status]}（${record.taboos.length} 条禁忌）`);
      if (record.taboos.length > 0) lines.push(tabooText);
      const lastLog = record.statusLogs[record.statusLogs.length - 1];
      if (lastLog && record.status !== "normal") {
        lines.push(`      最近操作：${lastLog.operator} · ${formatDateTime(lastLog.timestamp)} — ${lastLog.reason}`);
      }
      lines.push(`      处理建议：${getAdvice(record)}`);
      lines.push("");
      idx++;
    }
    lines.push(sep);
    lines.push("");
  }

  lines.push("—— 本摘要由婴幼儿辅食禁忌对账台自动生成，可直接转发给客服同事核对 ——");
  return lines.join("\n");
}

export function downloadSummary(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
