export type RecordStatus = 'pending' | 'approved' | 'rejected' | 'reissued' | 'closed' | 'manual';
export type UserRole = 'admin' | 'supervisor' | 'customer_service' | 'staff';
export type ItemType = 'bottle' | 'towel' | 'clothes' | 'other';
export type OperationType = 'create' | 'update' | 'delete' | 'export';

export interface Class {
  id: string;
  name: string;
  teacherName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Baby {
  id: string;
  name: string;
  age: number;
  classId: string;
  className?: string;
  allergyHistory?: string;
  parentPhone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusChange {
  id: string;
  recordId: string;
  fromStatus: RecordStatus;
  toStatus: RecordStatus;
  reason: string;
  operatorId: string | null;
  operatorName?: string | null;
  createdAt: string;
}

export interface SupplyRecord {
  id: string;
  babyId: string;
  babyName?: string;
  classId: string;
  className?: string;
  itemName: string;
  itemType: ItemType;
  sterilized: boolean;
  status: RecordStatus;
  statusHistory: StatusChange[];
  isManual: boolean;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  operationType: OperationType;
  entityType: string;
  entityId: string;
  operatorId: string | null;
  operatorRole: UserRole | null;
  operatorName?: string | null;
  ipAddress: string;
  requestParams: string;
  responseData: string;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
}

export interface ClassWithStats extends Class {
  babyCount: number;
  pendingCount: number;
  rejectedCount: number;
  exceptionCount: number;
}

export interface HandleExceptionRequest {
  recordId: string;
  action: 'approve' | 'reject' | 'reissue' | 'close';
  reason: string;
  operatorId?: string;
  items?: { itemId: string; action: string }[];
}

export interface PartialSuccessResponse {
  success: boolean;
  partialSuccess: boolean;
  successItems: string[];
  failedItems: { itemId: string; error: string }[];
  message: string;
  data?: SupplyRecord;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CreateManualRecordRequest {
  babyId: string;
  itemName: string;
  itemType: ItemType;
  remark: string;
  operatorId?: string;
}

export interface ExportOptions {
  classId?: string;
  status?: RecordStatus;
  startDate?: string;
  endDate?: string;
  includeStatusHistory?: boolean;
}

export const STATUS_LABELS: Record<RecordStatus, string> = {
  pending: '待处理',
  approved: '已通过',
  rejected: '已拒绝',
  reissued: '已补发',
  closed: '已关闭',
  manual: '手工补录'
};

export const STATUS_COLORS: Record<RecordStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  reissued: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
  manual: 'bg-purple-100 text-purple-800'
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  bottle: '奶瓶',
  towel: '毛巾',
  clothes: '衣物',
  other: '其他'
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '系统管理员',
  supervisor: '主管',
  customer_service: '客服人员',
  staff: '普通员工'
};
