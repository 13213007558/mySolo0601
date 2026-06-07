export type RecordStatus = 'pending' | 'reviewed' | 'closed' | 'invalid';

export type AuditAction = 'create' | 'update' | 'review' | 'append' | 'export';

export type UserRole = 'consultant' | 'principal';

export interface InfantRecord {
  id: string;
  infantName: string;
  batchNo: string;
  gender: 'male' | 'female';
  birthDate: string;
  parentName: string;
  phone: string;
  status: RecordStatus;
  parentVisibleContent: string;
  internalNotes: string;
  originalPromise: string;
  isBadData: boolean;
  badDataReason?: string;
  noHandlerReason?: string;
  appendedMaterials?: AppendedMaterial[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastUpdatedBy?: string;
}

export interface AppendedMaterial {
  id: string;
  content: string;
  operator: string;
  appendedAt: string;
}

export interface HistoryVersion {
  id: string;
  recordId: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  operator: string;
  changedAt: string;
  changeReason?: string;
}

export interface AuditLog {
  id: string;
  recordId?: string;
  action: AuditAction;
  operator: string;
  operatorRole: UserRole;
  summary: string;
  createdAt: string;
  detailSnapshot?: string;
}

export interface RecordFilters {
  keyword?: string;
  status?: RecordStatus | '';
  batchNo?: string;
  phone?: string;
}

export interface AuditFilters {
  keyword?: string;
  action?: AuditAction | '';
  operator?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface NewRecordInput {
  infantName: string;
  batchNo: string;
  gender: 'male' | 'female';
  birthDate: string;
  parentName: string;
  phone: string;
  parentVisibleContent: string;
  internalNotes: string;
  originalPromise: string;
}

export const STATUS_LABEL: Record<RecordStatus, string> = {
  pending: '待复核',
  reviewed: '已复核',
  closed: '已关闭',
  invalid: '无效数据',
};

export const STATUS_COLOR: Record<RecordStatus, string> = {
  pending: 'bg-warn-100 text-warn-700',
  reviewed: 'bg-brand-100 text-brand-800',
  closed: 'bg-slate-100 text-slate-600',
  invalid: 'bg-red-100 text-red-700',
};

export const ACTION_LABEL: Record<AuditAction, string> = {
  create: '新增',
  update: '修改',
  review: '复核',
  append: '追加材料',
  export: '导出',
};

export const ACTION_COLOR: Record<AuditAction, string> = {
  create: 'bg-blue-100 text-blue-700',
  update: 'bg-amber-100 text-amber-700',
  review: 'bg-brand-100 text-brand-800',
  append: 'bg-purple-100 text-purple-700',
  export: 'bg-slate-100 text-slate-700',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  consultant: '课程顾问',
  principal: '园长',
};

export const FIELD_LABEL: Record<string, string> = {
  infantName: '婴幼儿姓名',
  batchNo: '批次号',
  gender: '性别',
  birthDate: '出生日期',
  parentName: '家长姓名',
  phone: '联系电话',
  status: '状态',
  parentVisibleContent: '家长可见内容',
  internalNotes: '内部备注',
  originalPromise: '原始承诺',
  badDataReason: '坏数据原因',
  noHandlerReason: '无处理人原因',
};
