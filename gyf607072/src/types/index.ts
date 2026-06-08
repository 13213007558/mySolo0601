export type UserRole = "elder" | "parent" | "nanny";

export type RecordStatus =
  | "normal"
  | "abnormal"
  | "pending_review"
  | "manually_edited"
  | "revised"
  | "invalid";

export type MealPeriod = "breakfast" | "lunch" | "dinner" | "snack";

export type Severity = "low" | "medium" | "high";

export interface Ingredient {
  id: string;
  name: string;
  emoji?: string;
  category: string;
  isTaboo: boolean;
  tabooReason?: string;
  severity?: Severity;
  suggestion?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actionLabel: string;
  operatorId?: string;
  operatorName?: string;
  timestamp: string;
  reason?: string;
  handlerMissing: boolean;
  handlerMissingReason?: string;
}

export interface Supplement {
  id: string;
  content: string;
  addedBy: string;
  addedAt: string;
  addedAfterClose: boolean;
}

export interface ManualEditDiff {
  field: string;
  label: string;
  original: string;
  edited: string;
  type: "add" | "remove" | "modify";
}

export interface ManualEdit {
  id: string;
  editorName: string;
  editedAt: string;
  reason: string;
  diffs: ManualEditDiff[];
}

export interface FoodRecord {
  id: string;
  date: string;
  dateLabel: string;
  mealPeriod: MealPeriod;
  mealPeriodLabel: string;
  status: RecordStatus;
  handlerName: string;
  isClosed: boolean;
  parentNote?: string;
  noteUpdatedAt?: string;
  ingredients: Ingredient[];
  auditLogs: AuditLog[];
  supplements: Supplement[];
  manualEdit?: ManualEdit;
  tabooCount?: number;
}

export interface StoreState {
  records: FoodRecord[];
  currentRole: UserRole;
  activeFilter: RecordStatus | "all";
  parentNote: string;
  parentNoteUpdatedAt: string;
  needsReconfirm: boolean;
  setRole: (role: UserRole) => void;
  setFilter: (filter: RecordStatus | "all") => void;
  getRecordById: (id: string) => FoodRecord | undefined;
  addSupplement: (recordId: string, content: string, addedBy: string) => void;
  reconfirmAll: () => void;
  reviseRecord: (recordId: string, newStatus: RecordStatus, reason: string, operatorName: string) => void;
}
