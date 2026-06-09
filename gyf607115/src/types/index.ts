export type AlarmLevel = 'critical' | 'warning' | 'info';

export type AlarmStatus = 'pending' | 'processing' | 'resolved' | 'ignored';

export type DataSource = 'auto' | 'manual';

export interface Alarm {
  id: string;
  alarmCode: string;
  siteName: string;
  deviceName: string;
  level: AlarmLevel;
  description: string;
  amount: number;
  amountDisplay: string;
  phone: string;
  phoneMasked: string;
  status: AlarmStatus;
  source: DataSource;
  bmsPhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  alarmId: string;
  fromStatus: AlarmStatus;
  toStatus: AlarmStatus;
  operator: string;
  reason: string;
  createdAt: string;
}

export interface OperationHistory {
  id: string;
  alarmId: string;
  operationType: 'create' | 'update' | 'status_change' | 'export' | 'manual_entry';
  operator: string;
  detail: string;
  createdAt: string;
}

export type ValidationType = 'readme_inconsistency' | 'decimal_precision' | 'phone_leak';

export interface ValidationIssue {
  type: ValidationType;
  severity: 'error' | 'warning';
  message: string;
  details: string;
  affectedIds: string[];
  expectedValue?: string;
  actualValue?: string;
}

export interface ManualEntry {
  id: string;
  alarmId?: string;
  photoUrl: string;
  enteredBy: string;
  entryNote: string;
  alarmData: Partial<Alarm>;
  diffData: Record<string, { old: unknown; new: unknown }>;
  createdAt: string;
}

export interface FilterOptions {
  level: AlarmLevel | 'all';
  status: AlarmStatus | 'all';
  siteName: string;
  dateRange: {
    start: string;
    end: string;
  };
  keyword: string;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  includePhotos: boolean;
  includeHistory: boolean;
}

export interface StatsData {
  totalAlarms: number;
  pendingAlarms: number;
  resolvedAlarms: number;
  totalAmount: number;
  totalAmountDisplay: string;
  readmeInconsistencyCount: number;
  precisionIssueCount: number;
  phoneLeakCount: number;
}

export const ALARM_STATUS_LABELS: Record<AlarmStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  ignored: '已忽略',
};

export const ALARM_LEVEL_LABELS: Record<AlarmLevel, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
};

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  auto: '自动导入',
  manual: '手工补录',
};
