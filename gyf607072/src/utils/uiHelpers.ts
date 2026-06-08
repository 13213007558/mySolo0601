import { cn } from "@/lib/utils";
import type { RecordStatus, UserRole } from "@/types";

export function statusBadgeClass(status: RecordStatus): string {
  const map: Record<string, string> = {
    normal: "bg-sage-100 text-sage-700",
    abnormal: "bg-baby-100 text-baby-500",
    pending_review: "bg-sunset-100 text-sunset-500",
    manually_edited: "bg-cream-200 text-ink-700",
    revised: "bg-sunset-100 text-sunset-500",
    invalid: "bg-gray-100 text-gray-400",
  };
  return map[status] || "bg-cream-100 text-ink-700";
}

export function statusText(status: RecordStatus): string {
  const map: Record<string, string> = {
    normal: "正常 ✓",
    abnormal: "异常 ⚠",
    pending_review: "待改判",
    manually_edited: "已补录",
    revised: "已改判",
    invalid: "已隔离",
  };
  return map[status] || status;
}

export function roleText(role: UserRole): string {
  const map: Record<string, string> = {
    elder: "👵 老人视图",
    parent: "👨‍👩‍👧 父母视图",
    nanny: "👩‍🍳 育儿嫂视图",
  };
  return map[role] || role;
}

export function roleDescription(role: UserRole): string {
  const map: Record<string, string> = {
    elder: "仅显示摘要，方便老人快速了解",
    parent: "完整详情 + 改判 + 导出权限",
    nanny: "录入与核对，不可改判历史",
  };
  return map[role] || "";
}

export { cn };
