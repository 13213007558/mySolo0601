export type RecordStatus = "normal" | "abnormal" | "revised" | "manual";

export type MealType = "breakfast" | "lunch" | "dinner";

export interface InfantInfo {
  name: string;
  gender: "male" | "female";
  ageMonths: number;
}

export interface MealItem {
  meal: MealType;
  food: string;
  isAbnormal: boolean;
  remark?: string;
}

export interface DayMeals {
  date: string;
  meals: MealItem[];
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  operator: string;
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  reason?: string;
}

export interface FollowUpRecord {
  id: string;
  infant: InfantInfo;
  followUpDate: string;
  updatedAt: string;
  status: RecordStatus;
  parentNote?: string;
  threeDayMeals: DayMeals[];
  history: HistoryEntry[];
  isManualEntry: boolean;
  manualEntryNote?: string;
  reviseReason?: string;
  lastOperator?: string;
  reviewTime?: string;
}

export type StatusFilter =
  | "all"
  | "normal"
  | "abnormal"
  | "revised"
  | "manual";
