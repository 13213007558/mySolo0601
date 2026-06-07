export interface Baby {
  id: string;
  name: string;
  className: string;
  age: number;
  guardian: string;
  guardianPhone: string;
}

export interface TemperatureRecord {
  id: string;
  babyId: string;
  temperature: number;
  measureTime: string;
  measurePerson: string;
  deviceId: string;
  rawNote?: string;
}

export interface LeaveAttachment {
  id: string;
  babyId: string;
  date: string;
  imageUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export type CheckStatus = 'normal' | 'abnormal' | 'pending' | 'leave';
export type ReviewStatus = 'unreviewed' | 'reviewed' | 'appealed';

export interface DailyCheckRecord {
  id: string;
  babyId: string;
  date: string;
  temperatures: TemperatureRecord[];
  status: CheckStatus;
  initialReason: string;
  leaveAttachments: LeaveAttachment[];
  reviewStatus: ReviewStatus;
  auditLogs?: AuditLog[];
}

export interface AuditLog {
  id: string;
  recordId: string;
  babyId: string;
  operatorId: string;
  operatorName: string;
  oldStatus: string;
  newStatus: string;
  oldReason: string;
  newReason: string;
  operatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type DirtyRowErrorType = 'empty' | 'invalid_temperature' | 'missing_baby' | 'format_error' | 'unknown';

export interface DirtyRowDetail {
  rowNumber: number;
  rowData: Record<string, any>;
  errorType: DirtyRowErrorType;
  errorMessage: string;
}

export interface ImportResult {
  totalRows: number;
  successRows: number;
  dirtyRows: number;
  emptyRows: number;
  partialSuccess: boolean;
  dirtyRowDetails: DirtyRowDetail[];
  importedRecords: DailyCheckRecord[];
}

export const STATUS_LABELS: Record<CheckStatus, string> = {
  normal: '正常',
  abnormal: '异常',
  pending: '待复核',
  leave: '请假',
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  unreviewed: '未复核',
  reviewed: '已复核',
  appealed: '已申诉',
};

export const ERROR_TYPE_LABELS: Record<DirtyRowErrorType, string> = {
  empty: '空数据行',
  invalid_temperature: '体温格式错误',
  missing_baby: '宝宝信息不存在',
  format_error: '数据格式错误',
  unknown: '未知错误',
};
