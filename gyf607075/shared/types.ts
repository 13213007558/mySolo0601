export type UserRole = 'elder' | 'parent' | 'nanny' | 'admin';

export type ExpenseCategory = '奶粉' | '尿不湿' | '医疗' | '辅食' | '其他';

export type RecordStatus = 'pending' | 'verified' | 'rejected' | 'supplemented';

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amount: number;
  phone?: string;
  merchant: string;
  dueDate: string;
  status: RecordStatus;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  isSupplement?: boolean;
  supplementFromId?: string;
  supplementRemark?: string;
  beforeSnapshot?: Partial<ExpenseRecord>;
  importBatchId?: string;
  sampleKey?: string;
  isDeleted?: boolean;
}

export type AuditLogType =
  | 'export_privacy'
  | 'import'
  | 'update'
  | 'supplement'
  | 'delete'
  | 'verify'
  | 'reject';

export interface AuditLog {
  id: string;
  type: AuditLogType;
  operatorRole: UserRole;
  operatorName: string;
  targetRecordId?: string;
  details: string;
  fieldsExposed?: string[];
  timestamp: string;
}

export interface ImportBatch {
  id: string;
  importedAt: string;
  recordsCount: number;
  duplicatesCount: number;
  skippedCount: number;
}

export interface RoleInfo {
  role: UserRole;
  name: string;
  avatar: string;
  description: string;
  color: string;
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  elder: {
    role: 'elder',
    name: '爷爷奶奶',
    avatar: '👴',
    description: '查看费用摘要和余额概况',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  parent: {
    role: 'parent',
    name: '爸爸妈妈',
    avatar: '👨‍👩‍👧',
    description: '查看完整明细和核销记录',
    color: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  nanny: {
    role: 'nanny',
    name: '育儿嫂',
    avatar: '👩‍🍼',
    description: '按步骤录入费用、处理提醒',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  admin: {
    role: 'admin',
    name: '主管',
    avatar: '👩‍💼',
    description: '查看审计日志、全量数据管理',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
  },
};

export const STATUS_LABEL: Record<RecordStatus, string> = {
  pending: '待核销',
  verified: '已核销',
  rejected: '已驳回',
  supplemented: '已补录',
};

export const STATUS_COLOR: Record<RecordStatus, string> = {
  pending: 'bg-amber-500',
  verified: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  supplemented: 'bg-violet-500',
};

export const CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  奶粉: '🍼',
  尿不湿: '🧷',
  医疗: '💊',
  辅食: '🥣',
  其他: '📦',
};

export const AUDIT_TYPE_LABEL: Record<AuditLogType, string> = {
  export_privacy: '导出隐私数据',
  import: '导入数据',
  update: '修改记录',
  supplement: '手工补录',
  delete: '删除记录',
  verify: '核销确认',
  reject: '驳回记录',
};

export const AUDIT_TYPE_COLOR: Record<AuditLogType, string> = {
  export_privacy: 'text-rose-600 bg-rose-50 border-rose-200',
  import: 'text-sky-600 bg-sky-50 border-sky-200',
  update: 'text-amber-600 bg-amber-50 border-amber-200',
  supplement: 'text-violet-600 bg-violet-50 border-violet-200',
  delete: 'text-red-600 bg-red-50 border-red-200',
  verify: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  reject: 'text-orange-600 bg-orange-50 border-orange-200',
};
