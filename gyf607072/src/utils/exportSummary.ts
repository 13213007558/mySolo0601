import type { FoodRecord, UserRole } from "@/types";

function getStatusText(status: FoodRecord["status"]): string {
  const map: Record<string, string> = {
    normal: "一切正常 ✓",
    abnormal: "发现问题 ⚠",
    pending_review: "等待家长确认",
    manually_edited: "已手工补录",
    revised: "已人工改判",
    invalid: "数据异常（已隔离）",
  };
  return map[status] || status;
}

export function generateElderSummary(record: FoodRecord): string {
  const tabooItems = record.ingredients.filter((i) => i.isTaboo);
  const tabooText = tabooItems.length > 0
    ? `有${tabooItems.length}样需要注意：${tabooItems.map((i) => i.name).join("、")}，家长已经看过了。`
    : "没有问题。";

  return [
    `【${record.dateLabel} ${record.mealPeriodLabel}】`,
    `吃了：${record.ingredients.map((i) => i.name).join("、")}`,
    `结论：${getStatusText(record.status)}。${tabooText}`,
  ].join("\n");
}

export function generateParentSummary(records: FoodRecord[]): string {
  const lines: string[] = [];
  lines.push("===== 沐沐三日食材对账摘要 =====");
  lines.push(`生成时间：${new Date().toLocaleString("zh-CN", { hour12: false })}`);
  lines.push("");

  const grouped = records.reduce<Record<string, FoodRecord[]>>((acc, r) => {
    if (r.status === "invalid") return acc;
    if (!acc[r.dateLabel]) acc[r.dateLabel] = [];
    acc[r.dateLabel].push(r);
    return acc;
  }, {});

  for (const [date, items] of Object.entries(grouped)) {
    lines.push(`── ${date} ──`);
    for (const r of items) {
      const ingredients = r.ingredients.map((i) => `${i.emoji || ""}${i.name}`).join(" ");
      const tabooCount = r.ingredients.filter((i) => i.isTaboo).length;
      const suffix = tabooCount > 0 ? ` ⚠${tabooCount}项禁忌` : "";
      const editMark = r.status === "manually_edited" ? " [补录]" : r.status === "revised" ? " [改判]" : "";
      lines.push(`  ${r.mealPeriodLabel}：${ingredients} —— ${getStatusText(r.status)}${suffix}${editMark}`);
      if (r.manualEdit) {
        lines.push(`    补录说明：${r.manualEdit.reason}`);
      }
      if (r.status === "revised") {
        const revise = r.auditLogs.find((l) => l.action === "manual_review");
        if (revise?.reason) lines.push(`    改判原因：${revise.reason}`);
      }
    }
    lines.push("");
  }

  if (records.some((r) => r.status === "invalid")) {
    lines.push("※ 另有 1 条异常数据已自动隔离，不影响正常记录统计。");
  }
  lines.push("===== 摘要结束 =====");
  return lines.join("\n");
}

export function generateColleagueSummary(records: FoodRecord[]): string {
  const total = records.filter((r) => r.status !== "invalid").length;
  const normal = records.filter((r) => r.status === "normal").length;
  const abnormal = records.filter((r) => ["abnormal", "pending_review"].includes(r.status)).length;
  const revised = records.filter((r) => r.status === "revised").length;
  const edited = records.filter((r) => r.status === "manually_edited").length;
  const supplements = records.reduce((sum, r) => sum + r.supplements.filter((s) => s.addedAfterClose).length, 0);

  return [
    "【协作摘要】婴幼儿辅食对账周报",
    `统计时段：最近三日`,
    `记录总数：${total} 条（已排除 ${records.length - total} 条脏数据）`,
    `  · 正常通过：${normal} 条`,
    `  · 触发禁忌预警：${abnormal} 条`,
    `  · 人工复核改判：${revised} 条`,
    `  · 手工补录修正：${edited} 条`,
    `  · 结案后追加观察记录：${supplements} 条`,
    "",
    "说明：所有已关闭记录均保留完整审计链路，处理人缺失的系统自动操作均已标注原因。详情可登录对账台查看。",
  ].join("\n");
}

export function exportSummary(role: UserRole, records: FoodRecord[], singleRecord?: FoodRecord): string {
  if (role === "elder" && singleRecord) {
    return generateElderSummary(singleRecord);
  }
  if (role === "parent") {
    return generateParentSummary(records);
  }
  if (role === "nanny") {
    return generateParentSummary(records);
  }
  return generateColleagueSummary(records);
}
