export type PickupStatus = 'pending' | 'picked' | 'exception' | 'withdrawn';
export type PickupType = 'normal' | 'phone_authorized' | 'temp_aunt';
export type AuditAction = 'create' | 'update' | 'withdraw' | 'correct' | 'partial_success' | 'batch_pick';
export type UserRole = 'duty_officer' | 'gate_supervisor' | 'director';

export interface PhoneAuthInfo {
  callerName: string;
  callerPhone: string;
  authTime: string;
  identityVerified: boolean;
  authContent: string;
}

export interface TempAuntInfo {
  auntName: string;
  auntId: string;
  verifiedAt: string;
  relationNote: string;
}

export interface PickupRecord {
  id: string;
  babyName: string;
  className: string;
  status: PickupStatus;
  pickupType: PickupType;
  authorizedBy: string;
  pickupPerson: string;
  phoneAuth?: PhoneAuthInfo;
  tempAunt?: TempAuntInfo;
  isBadRow: boolean;
  exceptionReason?: string;
  conflictNote?: string;
  createdAt: string;
  updatedAt: string;
  withdrawnReason?: string;
  withdrawnBy?: string;
  withdrawnAt?: string;
  pickedAt?: string;
}

export interface AuditLog {
  id: string;
  recordId: string;
  action: AuditAction;
  operator: string;
  operatorRole: UserRole;
  timestamp: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export interface CorrectionRecord {
  id: string;
  recordId: string;
  originalSnapshot: PickupRecord;
  correctedSnapshot: PickupRecord;
  correctedBy: string;
  correctedAt: string;
  correctionReason: string;
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface BatchOperationResult {
  total: number;
  succeeded: number;
  failed: number;
  succeededIds: string[];
  failedIds: string[];
  failedDetails: { recordId: string; reason: string }[];
}

export interface ExportReportSummary {
  totalExpected: number;
  totalPicked: number;
  totalException: number;
  totalPhoneAuthorized: number;
  totalTempAunt: number;
  totalWithdrawn: number;
  totalBadRows: number;
  generatedAt: string;
  shiftName: string;
  consistencyHash: string;
}

export interface ExportReport {
  summary: ExportReportSummary;
  records: PickupRecord[];
  auditLogs: AuditLog[];
  corrections: CorrectionRecord[];
}

export const STATUS_LABEL: Record<PickupStatus, string> = {
  pending: '待接送',
  picked: '已接走',
  exception: '异常',
  withdrawn: '已撤回',
};

export const TYPE_LABEL: Record<PickupType, string> = {
  normal: '正常接送',
  phone_authorized: '电话授权',
  temp_aunt: '临时阿姨',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  duty_officer: '夜班值班员',
  gate_supervisor: '门岗负责人',
  director: '托育主管',
};

export const ACTION_LABEL: Record<AuditAction, string> = {
  create: '创建记录',
  update: '更新记录',
  withdraw: '撤回记录',
  correct: '人工更正',
  partial_success: '部分成功',
  batch_pick: '批量确认',
};
