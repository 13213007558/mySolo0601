export interface Baby {
  id: string;
  name: string;
  avatar: string;
  className: string;
  parentPhone: string;
  healthCode: string;
  exportRowNo?: number;
}

export type CheckStatus = 'normal' | 'abnormal' | 'leave';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'rolled-back';
export type DataQuality = 'clean' | 'dirty' | 'empty';
export type CheckItemStatus = 'normal' | 'abnormal';
export type OperationType = 'create' | 'update' | 'delete' | 'manual-entry' | 'rollback';

export interface MorningCheck {
  id: string;
  babyId: string;
  date: string;
  temperature: number;
  oralCheck: CheckItemStatus;
  handCheck: CheckItemStatus;
  skinCheck: CheckItemStatus;
  status: CheckStatus;
  reviewStatus: ReviewStatus;
  dataQuality: DataQuality;
  isManualEntry: boolean;
  thermometerLogId?: string;
  leaveSlipId?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ThermometerLog {
  id: string;
  deviceNo: string;
  temperature: number;
  measuredAt: string;
  babyId: string;
  rawSnapshot: string;
}

export interface LeaveSlip {
  id: string;
  babyId: string;
  photoUrl: string;
  reason: string;
  submittedBy: string;
  submittedAt: string;
}

export interface AuditLog {
  id: string;
  recordId: string;
  fieldName: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  operator: string;
  operatedAt: string;
  operationType: OperationType;
  isAutoRollback: boolean;
}

export interface ManualEntry {
  id: string;
  recordId: string;
  beforeSnapshot: Record<string, unknown>;
  afterSnapshot: Record<string, unknown>;
  enteredBy: string;
  enteredAt: string;
}

export interface PartialSubmitResult {
  success: number[];
  failed: { index: number; error: string }[];
  message: string;
}

export interface RecordWithBaby extends MorningCheck {
  babyName: string;
  babyAvatar: string;
  className: string;
}
