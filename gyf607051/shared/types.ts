export type DataStatus = 'normal' | 'empty' | 'dirty';

export type ReviewStatus = 'pending' | 'passed' | 'rejected' | 'supplemented';

export type AuditActionType =
  | 'status_changed'
  | 'photo_missing'
  | 'manual_supplement'
  | 'anomaly_counted_normal'
  | 'review_created';

export interface Baby {
  id: string;
  name: string;
  className: string;
  parentName: string;
  parentPhone: string;
}

export interface ThermometerRecord {
  id: string;
  reviewId: string;
  temperature: number;
  measuredAt: string;
  deviceId: string;
  photoUrl?: string;
  status: DataStatus;
}

export interface LeaveRequest {
  id: string;
  reviewId: string;
  reason: string;
  submittedAt: string;
  photoUrl?: string;
  status: DataStatus;
}

export interface AuditLog {
  id: string;
  reviewId: string;
  action: AuditActionType;
  operator: string;
  operatorRole: 'waiter' | 'kitchen' | 'manager' | 'parent' | 'system';
  timestamp: string;
  note?: string;
  snapshotBefore?: Partial<MorningReview>;
  snapshotAfter?: Partial<MorningReview>;
}

export interface MorningReview {
  id: string;
  babyId: string;
  date: string;
  status: ReviewStatus;
  temperatureStatus: DataStatus;
  leaveStatus: DataStatus;
  overallStatus: DataStatus;
  hasPhotoMissing: boolean;
  isAnomalyCountedNormal: boolean;
  wasManuallySupplemented: boolean;
  reviewStage: 'waiter' | 'kitchen' | 'manager' | 'done';
  thermometerRecords: ThermometerRecord[];
  leaveRequests: LeaveRequest[];
  auditLogs: AuditLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ExportRow {
  reviewId: string;
  babyName: string;
  className: string;
  date: string;
  status: ReviewStatus;
  temperatureStatus: DataStatus;
  leaveStatus: DataStatus;
  hasPhotoMissing: boolean;
}
