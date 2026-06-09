export interface ValveRecord {
  id: string;
  recordDate: string;
  valveNo: string;
  opening: number;
  temperature: number;
  pressure: number;
  status: 'normal' | 'abnormal' | 'manual';
  operator: string;
  contractId?: string;
  remarks?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  contractNo: string;
  contractDate: string;
  fileName: string;
  fileUrl: string;
  uploader: string;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  recordId: string;
  operationType: 'create' | 'update' | 'delete' | 'undo' | 'manual';
  operator: string;
  operationTime: string;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  undoReason?: string;
  previousUndoReason?: string;
}

export type ViewMode = 'duty' | 'review';
export type UserRole = 'operator' | 'supervisor';
export type AnomalyType = 'all_bad_rows' | 'empty_table' | 'chart_not_sync' | 'undo_reason_override';
export type ChartSyncState = 'synced' | 'pending' | 'outdated';

export interface FilterParams {
  dateRange?: [string, string];
  status?: ValveRecord['status'][];
  valveNo?: string;
  operator?: string;
}

export interface DiffField {
  field: string;
  oldValue: any;
  newValue: any;
  changed: boolean;
}

export const STATUS_LABELS: Record<ValveRecord['status'], string> = {
  normal: '正常',
  abnormal: '异常',
  manual: '手工补录',
};

export const STATUS_COLORS: Record<ValveRecord['status'], string> = {
  normal: 'bg-industrial-green/10 text-industrial-green border-industrial-green/30',
  abnormal: 'bg-industrial-red/10 text-industrial-red border-industrial-red/30',
  manual: 'bg-industrial-orange/10 text-industrial-orange border-industrial-orange/30',
};

export const OPERATION_LABELS: Record<AuditLog['operationType'], string> = {
  create: '新增记录',
  update: '修改记录',
  delete: '删除记录',
  undo: '撤回操作',
  manual: '手工补录',
};

export const FIELD_LABELS: Record<string, string> = {
  recordDate: '记录日期',
  valveNo: '阀门编号',
  opening: '开度(%)',
  temperature: '温度(°C)',
  pressure: '压力(MPa)',
  status: '状态',
  operator: '操作人',
  contractId: '关联合同',
  remarks: '备注',
};
