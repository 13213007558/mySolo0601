import type { RecordStatus, MealType } from "@/types";

export const statusLabel: Record<RecordStatus, string> = {
  normal: "正常",
  abnormal: "异常",
  revised: "已人工改判",
  manual: "手工补录",
};

export const mealLabel: Record<MealType, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function formatGender(gender: "male" | "female"): string {
  return gender === "male" ? "男" : "女";
}

export function getStatusTagClass(status: RecordStatus): string {
  switch (status) {
    case "normal":
      return "tag-normal";
    case "abnormal":
      return "tag-abnormal";
    case "revised":
      return "tag-revised";
    case "manual":
      return "tag-manual";
  }
}

export function generateId(prefix = "rec"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowISO(): string {
  return new Date().toISOString().slice(0, 19);
}
