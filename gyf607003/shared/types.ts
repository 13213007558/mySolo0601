export type UserRole = 'disinfector' | 'teacher' | 'supervisor' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Baby {
  id: string;
  name: string;
  classId: string;
  className: string;
  parentPhone: string;
  parentIdCard: string;
  homeAddress: string;
  status: 'normal' | 'exception';
}

export type ItemType = 'bottle' | 'tableware' | 'toy' | 'clothing' | 'other';
export type RecordStatus = 'pending' | 'disinfected' | 'distributed' | 'recycled' | 'exception';

export interface DisinfectionRecord {
  id: string;
  babyId: string;
  babyName: string;
  classId: string;
  itemType: ItemType;
  itemName: string;
  status: RecordStatus;
  operatorId: string;
  operatorName: string;
  operateTime: string;
  isManual: boolean;
  remark?: string;
}

export type ExceptionType = 'unclean_reissue' | 'missing_item' | 'damage' | 'other';
export type ExceptionStatus = 'pending' | 'resolved';

export interface ExceptionRecord {
  id: string;
  recordId: string;
  babyId: string;
  babyName: string;
  classId: string;
  type: ExceptionType;
  reason: string;
  status: ExceptionStatus;
  handlerId?: string;
  handlerName?: string;
  handleMeasure?: string;
  handleTime?: string;
  createTime: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'handle_exception' | 'manual_record' | 'history_lost';
export type AuditTargetType = 'record' | 'exception' | 'baby' | 'export';
export type SyncStatus = 'success' | 'failed' | 'partial';
export type CompensationTaskStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface AuditLog {
  id: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  operatorId: string;
  operatorName: string;
  operateTime: string;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  syncStatus: SyncStatus;
  retryCount: number;
}

export interface CompensationTask {
  id: string;
  auditLogId: string;
  targetType: AuditTargetType;
  targetId: string;
  payload: Record<string, unknown>;
  status: CompensationTaskStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string;
  createdAt: string;
  lastError?: string;
}

export interface FailureSimulationConfig {
  enabled: boolean;
  failureRate: number;
  failTargets?: (keyof SyncTarget)[];
}

export const COMPENSATION_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_INTERVAL_MS: 30 * 1000,
  BACKOFF_FACTOR: 2,
} as const;

export interface HandleExceptionRequest {
  handleMeasure: string;
  handlerId: string;
}

export interface SyncTarget {
  classPage: 'success' | 'failed';
  babyDetail: 'success' | 'failed';
  backendCache: 'success' | 'failed';
  exportData: 'success' | 'failed';
}

export interface HandleExceptionResponse {
  success: boolean;
  exception: ExceptionRecord;
  syncResults: SyncTarget;
  auditLogId: string;
  historyLost?: boolean;
  historyLostItems?: string[];
}

export interface ClassInfo {
  id: string;
  name: string;
  capacity: number;
  babyCount: number;
  exceptionCount: number;
  completedRate: number;
}

export interface TimelineEvent {
  id: string;
  time: string;
  type: 'disinfect' | 'distribute' | 'recycle' | 'exception' | 'manual' | 'resolve';
  title: string;
  description: string;
  operatorName: string;
}

export interface OverviewStats {
  totalToday: number;
  pendingExceptions: number;
  completed: number;
  manualRecords: number;
}

export const EXCEPTION_TYPE_LABEL: Record<ExceptionType, string> = {
  unclean_reissue: '未清洁再次发放',
  missing_item: '用品缺失',
  damage: '用品损坏',
  other: '其他异常',
};

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  bottle: '奶瓶',
  tableware: '餐具',
  toy: '玩具',
  clothing: '衣物',
  other: '其他',
};

export const RECORD_STATUS_LABEL: Record<RecordStatus, string> = {
  pending: '待处理',
  disinfected: '已消毒',
  distributed: '已发放',
  recycled: '已回收',
  exception: '异常',
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  disinfector: '消毒人员',
  teacher: '班级老师',
  supervisor: '后勤主管',
  admin: '系统管理员',
};
