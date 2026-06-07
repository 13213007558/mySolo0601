export type RecordStatus = "normal" | "abnormal" | "pending_review" | "reviewed";
export type RecordSource = "system" | "manual";
export type Severity = "warning" | "danger";

export interface Ingredient {
  id: string;
  name: string;
  day: "Day1" | "Day2" | "Day3";
  meal: "早餐" | "午餐" | "晚餐" | "加餐";
}

export interface TabooMatch {
  id: string;
  ingredientName: string;
  tabooReason: string;
  severity: Severity;
}

export interface StatusLog {
  id: string;
  fromStatus: RecordStatus | null;
  toStatus: RecordStatus | null;
  reason: string;
  operator: "系统" | "店长";
  timestamp: string;
  type?: "status_change" | "duplicate_block" | "refresh_recover" | "manual_create";
}

export interface CheckRecord {
  id: string;
  babyName: string;
  babyMonthAge: number;
  parentName: string;
  parentPhone: string;
  checkDate: string;
  source: RecordSource;
  status: RecordStatus;
  submitMethod: string;
  photoUrl?: string;
  ingredients: Ingredient[];
  taboos: TabooMatch[];
  statusLogs: StatusLog[];
  createdAt: string;
  updatedAt: string;
  corrupted?: boolean;
}

export type ReviewTarget = "normal" | "abnormal";
