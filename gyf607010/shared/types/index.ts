export type RecordStatus = 'pending' | 'confirmed' | 'withdrawn' | 'conflict';
export type FeedingMethod = 'breast' | 'formula' | 'mixed' | 'other';
export type Shift = 'morning' | 'afternoon' | 'night';
export type UserRole = 'nurse' | 'supervisor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface MilkRecord {
  id: string;
  babyName: string;
  recordDate: string;
  shift: Shift;
  milkAmountMl: number;
  feedingMethod: FeedingMethod;
  remark: string;
  status: RecordStatus;
  conflictReason?: string;
  withdrawReason?: string;
  createdBy: string;
  createdByName: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeHistory {
  id: string;
  recordId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  operatedBy: string;
  operatedByName: string;
  operatedAt: string;
  reviewedAt?: string;
  action: 'create' | 'update' | 'review' | 'withdraw';
  reason?: string;
}

export interface RecordFilter {
  dateFrom?: string;
  dateTo?: string;
  babyName?: string;
  status?: RecordStatus;
  operatorName?: string;
}

export interface ReviewPayload {
  pass: boolean;
  reason?: string;
  operator: User;
}

export interface WithdrawPayload {
  reason: string;
  operator: User;
}

export interface CreateRecordInput {
  babyName: string;
  recordDate: string;
  shift: Shift;
  milkAmountMl: number;
  feedingMethod: FeedingMethod;
  remark?: string;
  operator: User;
}

export interface UpdateRecordInput {
  babyName?: string;
  recordDate?: string;
  shift?: Shift;
  milkAmountMl?: number;
  feedingMethod?: FeedingMethod;
  remark?: string;
  operator: User;
}

export interface RecordWithHistory {
  record: MilkRecord;
  history: ChangeHistory[];
}

export const RecordStatusLabel: Record<RecordStatus, string> = {
  pending: '待复核',
  confirmed: '已确认',
  withdrawn: '已撤回',
  conflict: '预约冲突',
};

export const ShiftLabel: Record<Shift, string> = {
  morning: '早班',
  afternoon: '午班',
  night: '夜班',
};

export const FeedingMethodLabel: Record<FeedingMethod, string> = {
  breast: '纯母乳',
  formula: '配方奶',
  mixed: '混合喂养',
  other: '其他',
};
