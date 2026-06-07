export type UserRole = 'consultant' | 'store_staff' | 'supervisor' | 'admin';

export type RecordStatus = 'pending' | 'abnormal' | 'processing' | 'processed' | 'reverted';

export type DisinfectionItemType = 'bottle' | 'toy' | 'towel' | 'blanket' | 'tableware' | 'other';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface Baby {
  id: string;
  name: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  guardianIdNo?: string;
  dateOfBirth?: string;
  allergies?: string;
}

export interface RemarkHistory {
  id: string;
  timestamp: number;
  operatorId: string;
  operatorName: string;
  content: string;
  source: 'original_commitment' | 'supplement' | 'status_change';
}

export interface AuditLog {
  id: string;
  timestamp: number;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  action: string;
  recordId: string;
  oldStatus?: RecordStatus;
  newStatus?: RecordStatus;
  diff?: Record<string, { old: any; new: any }>;
  clientIp?: string;
}

export interface DisinfectionRecord {
  id: string;
  babyId: string;
  babyName: string;
  className: string;
  itemType: DisinfectionItemType;
  itemName: string;
  borrowScanId?: string;
  returnScanId?: string;
  borrowTime?: number;
  returnTime?: number;
  disinfectionTime?: number;
  expectedReturnTime: number;
  status: RecordStatus;
  processorId?: string;
  processorName?: string;
  processTime?: number;
  abnormalReason?: string;
  handleResult?: string;
  remarks: RemarkHistory[];
  createdAt: number;
  updatedAt: number;
  isManualEntry: boolean;
}

export interface ScanRecord {
  id: string;
  recordId: string;
  type: 'borrow' | 'return';
  timestamp: number;
  operatorId?: string;
  operatorName?: string;
  deviceCode: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  partialSuccess?: {
    succeeded: string[];
    failed: { id: string; reason: string }[];
  };
}

export const PRIVATE_FIELDS: Record<string, UserRole[]> = {
  guardianPhone: ['consultant', 'supervisor', 'admin'],
  guardianIdNo: ['admin'],
  allergies: ['consultant', 'supervisor', 'admin'],
  dateOfBirth: ['consultant', 'supervisor', 'admin']
};

export const STATUS_LABELS: Record<RecordStatus, string> = {
  pending: '待处理',
  abnormal: '异常',
  processing: '处理中',
  processed: '已处理',
  reverted: '已回退'
};

export const ITEM_TYPE_LABELS: Record<DisinfectionItemType, string> = {
  bottle: '奶瓶',
  toy: '玩具',
  towel: '毛巾',
  blanket: '被褥',
  tableware: '餐具',
  other: '其他'
};
