export type UserRole = 'supervisor' | 'nurse' | 'viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  shift?: string;
}

export type RecordStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cross_shift'
  | 'bad_data'
  | 'archived';

export type AnomalyType =
  | 'cross_shift_conflict'
  | 'duplicate_baby'
  | 'missing_required'
  | 'invalid_data'
  | 'slot_occupied'
  | 'none';

export interface AnomalyDetail {
  type: AnomalyType;
  message: string;
  conflictingRecordId?: string;
  resolution?: string;
}

export interface RescheduleRecord {
  id: string;
  babyName: string;
  babyId: string;
  originalShift: string;
  originalDate: string;
  targetShift: string;
  targetDate: string;
  reason: string;
  sourceFileName: string;
  sourceUploadedAt: string;
  handlerId: string;
  handlerName: string;
  status: RecordStatus;
  latestNote?: string;
  latestNoteAt?: string;
  latestNoteBy?: string;
  anomaly: AnomalyDetail | null;
  isIsolated: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AuditAction =
  | 'create'
  | 'update_status'
  | 'add_note'
  | 'approve'
  | 'reject'
  | 'isolate'
  | 'export'
  | 'import';

export interface AuditLog {
  id: string;
  recordId: string;
  action: AuditAction;
  operatorId: string;
  operatorName: string;
  note?: string;
  oldStatus?: RecordStatus;
  newStatus?: RecordStatus;
  createdAt: string;
}

export interface AccessDeniedLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  targetRecordId: string;
  targetBabyName: string;
  reason: string;
  attemptedAt: string;
}

export interface ImportDryRunResult {
  totalRows: number;
  validRows: RescheduleRecord[];
  badRows: Array<{
    rowIndex: number;
    rawData: Record<string, unknown>;
    errors: string[];
  }>;
  sourceFileName: string;
}

export const STATUS_LABELS: Record<RecordStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  cross_shift: '跨班冲突',
  bad_data: '数据异常',
  archived: '已归档',
};

export const ANOMALY_LABELS: Record<AnomalyType, string> = {
  cross_shift_conflict: '跨班冲突',
  duplicate_baby: '重复宝宝',
  missing_required: '必填缺失',
  invalid_data: '数据无效',
  slot_occupied: '时段占用',
  none: '无异常',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  supervisor: '主管',
  nurse: '护士',
  viewer: '查看员',
};
