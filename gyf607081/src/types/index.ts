export enum DataStatus {
  EMPTY = 'empty',
  DIRTY = 'dirty',
  NORMAL = 'normal'
}

export enum RecordStatus {
  PENDING = 'pending',
  REJECTED = 'rejected',
  REISSUED = 'reissued',
  MANUAL = 'manual'
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  REJECT = 'reject',
  REISSUE = 'reissue',
  MANUAL_ADD = 'manual_add',
  EXPORT = 'export',
  SERVICE_RESTART = 'service_restart',
  DATA_RESTORE = 'data_restore'
}

export interface Baby {
  id: string;
  name: string;
  age: number;
  className: string;
  guardian: string;
  phone: string;
  avatar: string;
  createdAt: string;
}

export interface TemperatureRecord {
  id: string;
  babyId: string;
  temperature: number;
  measureTime: string;
  measureDevice: string;
  operator: string;
  remark: string;
  photoUrl: string;
  isDirty: boolean;
  dirtyReason?: string;
}

export interface LeaveNote {
  id: string;
  babyId: string;
  leaveDate: string;
  reason: string;
  photoUrls: string[];
  operator: string;
  createdAt: string;
}

export interface CheckRecord {
  id: string;
  babyId: string;
  temperatureRecordId?: string;
  leaveNoteId?: string;
  status: RecordStatus;
  dataStatus: DataStatus;
  currentRemark: string;
  isManual: boolean;
  manualAddInfo?: {
    beforeData: Partial<CheckRecord>;
    afterData: Partial<CheckRecord>;
    addTime: string;
    operator: string;
    reason: string;
  };
  createdAt: string;
  updatedAt: string;
  operator: string;
}

export interface AuditLog {
  id: string;
  recordId?: string;
  babyId?: string;
  action: AuditAction;
  oldValue?: unknown;
  newValue?: unknown;
  snapshot?: unknown;
  operator: string;
  timestamp: string;
  serviceRestartId?: string;
  success: boolean;
  errorMessage?: string;
}

export interface ServiceRestart {
  id: string;
  startTime: string;
  endTime?: string;
  totalRecords: number;
  successCount: number;
  failCount: number;
  failRecordIds: string[];
  failDetails?: Array<{ recordId: string; reason: string; data: unknown }>;
  operator: string;
  status: 'processing' | 'partial_success' | 'completed' | 'failed';
}

export interface StatusChangeTrace {
  recordId: string;
  oldStatus: RecordStatus;
  newStatus: RecordStatus;
  changeTime: string;
  operator: string;
  remark: string;
}

export interface ExportRecord {
  id: string;
  exportTime: string;
  operator: string;
  recordIds: string[];
  statusChanges: StatusChangeTrace[];
  downloadUrl: string;
}

export interface RestartResult {
  success: string[];
  failed: Array<{
    recordId: string;
    reason: string;
    data: unknown;
  }>;
  auditSnapshot: AuditLog[];
}
