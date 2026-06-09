export type UserRole = 'operator' | 'engineer' | 'admin' | 'master_ye';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: UserRole;
  permissions: string[];
}

export type AlarmStatus = 'pending' | 'processing' | 'completed' | 'abnormal';

export type AlarmLevel = 'critical' | 'warning' | 'info';

export interface AlarmRecord {
  id: string;
  hostId: string;
  hostName: string;
  alarmType: string;
  alarmLevel: AlarmLevel;
  alarmTime: string;
  status: AlarmStatus;
  processor?: string;
  processorName?: string;
  processTime?: string;
  remark?: string;
  location: {
    area: string;
    detail?: string;
  };
  params: {
    temperature?: number;
    pressure?: number;
    voltage?: number;
  };
  attachments?: string[];
  dataFingerprint: string;
  createdAt: string;
  history?: StatusHistory[];
}

export interface StatusHistory {
  id: string;
  status: AlarmStatus;
  operator: string;
  operatorName: string;
  time: string;
  remark: string;
}

export interface HostInfo {
  id: string;
  name: string;
  model: string;
  location: {
    area: string;
    detail?: string;
    coordinates?: { lat: number; lng: number };
  };
  status: 'running' | 'stopped' | 'error';
  params: {
    ratedPower: number;
    currentPower?: number;
    supplyTemp?: number;
    returnTemp?: number;
    pressure?: number;
  };
  lastMaintenance: string;
}

export interface SupplementRecord {
  id: string;
  hostId: string;
  hostName: string;
  startTime: string;
  endTime: string;
  operationType: 'start' | 'stop';
  reason: string;
  operator: string;
  operatorName: string;
  createTime: string;
  originalData?: Partial<SupplementRecord>;
  diffFields?: string[];
}

export interface ImportResult {
  total: number;
  success: number;
  duplicate: number;
  abnormal: number;
  missingAttachments: number;
  records: ImportRecord[];
}

export interface ImportRecord {
  rowIndex: number;
  data: Partial<AlarmRecord>;
  status: 'valid' | 'duplicate' | 'abnormal' | 'missing_attachment';
  errorMessage?: string;
}

export interface DiffResult {
  field: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
  changeType: 'add' | 'modify' | 'delete';
}

export interface FilterParams {
  keyword?: string;
  status?: AlarmStatus;
  level?: AlarmLevel;
  hostId?: string;
  startTime?: string;
  endTime?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export const statusTextMap: Record<AlarmStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  abnormal: '异常',
};

export const levelTextMap: Record<AlarmLevel, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
};

export const roleTextMap: Record<UserRole, string> = {
  operator: '值班人员',
  engineer: '运维工程师',
  admin: '管理员',
  master_ye: '叶师傅',
};

export const hostStatusTextMap: Record<'running' | 'stopped' | 'error', string> = {
  running: '运行中',
  stopped: '已停止',
  error: '故障',
};
