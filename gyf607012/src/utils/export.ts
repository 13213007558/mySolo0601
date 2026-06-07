import type { FollowUpRecord } from "@/types";
import { formatDate, formatDateTime, formatGender, mealLabel, statusLabel } from "./format";

export function buildExportSummary(records: FollowUpRecord[]): string {
  if (records.length === 0) {
    return "【婴幼儿辅食随访摘要】\n\n暂无记录可供导出。";
  }

  const lines: string[] = [];
  lines.push("【婴幼儿辅食随访摘要】");
  lines.push(`导出时间：${formatDateTime(new Date().toISOString())}`);
  lines.push(`记录数量：${records.length} 条`);
  lines.push("");

  records.forEach((r, idx) => {
    lines.push(`━━━━━━━━━━ 第 ${idx + 1} 条 ━━━━━━━━━━`);
    lines.push(
      `随访对象：${r.infant.name}（${r.infant.ageMonths}月龄，${formatGender(r.infant.gender)}）`
    );
    lines.push(`随访日期：${formatDate(r.followUpDate)}`);
    lines.push(`当前状态：${statusLabel[r.status]}`);
    if (r.isManualEntry) {
      lines.push(`记录来源：手工补录`);
    }
    lines.push("");
    lines.push("三日食材记录：");
    r.threeDayMeals.forEach((day) => {
      const mealStr = day.meals
        .map((m) => {
          const abnormalMark = m.isAbnormal ? "【风险】" : "";
          return `${mealLabel[m.meal]}：${abnormalMark}${m.food}`;
        })
        .join("；");
      lines.push(`· ${formatShortDate(day.date)}：${mealStr}`);
    });

    const abnormalItems: string[] = [];
    r.threeDayMeals.forEach((day) => {
      day.meals.forEach((m) => {
        if (m.isAbnormal) {
          abnormalItems.push(
            `- ${formatShortDate(day.date)}${mealLabel[m.meal]} ${m.food}${
              m.remark ? `（${m.remark}）` : ""
            }`
          );
        }
      });
    });
    if (abnormalItems.length > 0) {
      lines.push("");
      lines.push("风险提示：");
      abnormalItems.forEach((item) => lines.push(item));
    }

    if (r.parentNote) {
      lines.push("");
      lines.push("家长补充信息：");
      lines.push(r.parentNote);
    }

    if (r.reviseReason) {
      lines.push("");
      lines.push("人工改判说明：");
      lines.push(r.reviseReason);
    }

    if (r.manualEntryNote) {
      lines.push("");
      lines.push("补录说明：");
      lines.push(r.manualEntryNote);
    }

    if (r.lastOperator && r.reviewTime) {
      lines.push("");
      lines.push(`复核人：${r.lastOperator}`);
      lines.push(`复核时间：${formatDateTime(r.reviewTime)}`);
    }
    lines.push("");
  });

  return lines.join("\n");
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日 `;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      document.body.removeChild(ta);
      return false;
    }
  }
}
