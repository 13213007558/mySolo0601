export type RecordStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type SourceType = 'parent_submit' | 'manual_entry' | 'file_import';

export type SlotStatus = 'available' | 'verbal_hold' | 'confirmed';

export type CorruptionType =
  | 'duplicate_submit'
  | 'status_rollback'
  | 'data_integrity';

export interface StatusLog {
  id: string;
  recordId: string;
  fromStatus: RecordStatus;
  toStatus: RecordStatus;
  operator: string;
  reason: string;
  createdAt: string;
  isRollback: boolean;
}

export interface PhotoItem {
  id: string;
  recordId: string;
  dataUrl: string;
  description: string;
  uploadedAt: string;
}

export interface Rectification {
  id: string;
  recordId: string;
  problem: string;
  measure: string;
  operator: string;
  reviewer?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface CorruptionLog {
  id: string;
  recordId: string;
  type: CorruptionType;
  reason: string;
  detectedBy: 'system' | 'manual';
  createdAt: string;
}

export interface RescheduleRecord {
  id: string;
  babyName: string;
  courseName: string;
  originalTime: string;
  expectedTime: string;
  reason: string;
  sourceFile?: string;
  submitter: string;
  handler?: string;
  currentStatus: RecordStatus;
  latestNote?: string;
  createdAt: string;
  updatedAt: string;
  isCorrupted: boolean;
  corruptionReason?: string;
  sourceType: SourceType;
  statusLogs: StatusLog[];
  photos: PhotoItem[];
  rectifications: Rectification[];
  corruptionLogs: CorruptionLog[];
}

export interface FreezerLogEntry {
  id: string;
  slotId: string;
  action: 'hold' | 'confirm' | 'release';
  operator: string;
  remark?: string;
  createdAt: string;
}

export interface FreezerSlot {
  id: string;
  date: string;
  period: 'morning' | 'afternoon' | 'evening';
  status: SlotStatus;
  occupiedBy?: string;
  occupantType?: 'normal' | 'shift_transfer';
  markedAt?: string;
  logs: FreezerLogEntry[];
}

export interface ExportLog {
  id: string;
  operator: string;
  filters: Record<string, unknown>;
  format: 'xlsx' | 'pdf';
  count: number;
  createdAt: string;
}

export interface DraftForm {
  babyName?: string;
  courseName?: string;
  originalTime?: string;
  expectedTime?: string;
  reason?: string;
  photos: { dataUrl: string; description: string }[];
  savedAt?: string;
}

export const STATUS_LABEL: Record<RecordStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已驳回',
};

export const STATUS_COLOR: Record<RecordStatus, string> = {
  pending: 'bg-warn/30 text-amber-800',
  processing: 'bg-primary/30 text-pink-700',
  completed: 'bg-secondary/20 text-secondary-dark',
  cancelled: 'bg-gray-200 text-gray-600',
  rejected: 'bg-red-100 text-red-700',
};

export const SOURCE_LABEL: Record<SourceType, string> = {
  parent_submit: '家长录入',
  manual_entry: '手工补录',
  file_import: '文件导入',
};

export const PERIOD_LABEL = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚间',
} as const;
