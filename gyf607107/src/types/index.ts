export type AlarmStatus = 'pending' | 'processing' | 'completed' | 'reviewed' | 'withdrawn';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type UserRole = 'consultant' | 'supervisor';
export type ActionType = 'submit' | 'withdraw' | 'review' | 'resubmit' | 'supplement' | 'import';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  canExportRaw: boolean;
}

export interface Alarm {
  id: string;
  siteName: string;
  bladeNo: string;
  defectType: string;
  severity: Severity;
  status: AlarmStatus;
  conclusion: string;
  contactPhone: string;
  handler: string;
  createdAt: string;
  updatedAt: string;
  isManualSupplement: boolean;
  originalData?: Record<string, unknown>;
}

export interface OperationHistory {
  id: string;
  alarmId: string;
  operator: string;
  action: ActionType;
  oldReason?: string;
  newRemark?: string;
  operatedAt: string;
}

export interface SupplementNote {
  id: string;
  alarmId: string;
  author: string;
  content: string;
  beforeData: string;
  afterData: string;
  createdAt: string;
}

export interface ExportConfig {
  maskPhone: boolean;
  includeHistory: boolean;
  includeSupplement: boolean;
}

export interface FilterCondition {
  status?: AlarmStatus;
  severity?: Severity;
  siteName?: string;
  handler?: string;
  isManualSupplement?: boolean;
}

export interface DuplicateSiteInfo {
  alarm: Alarm;
  existingAlarm: Alarm;
}
