export type RecordStatus = 'pending' | 'approved' | 'rejected' | 'bad_data';

export type DataIssueType =
  | 'phone_format'
  | 'privacy_leak'
  | 'data_inconsistency'
  | 'duplicate';

export interface DataIssue {
  type: DataIssueType;
  field: string;
  reason: string;
  originalValue?: string;
  expectedFormat?: string;
}

export interface MilkRecord {
  id: string;
  babyName: string;
  babyBirthday: string;
  parentName: string;
  parentPhone: string;
  parentIdCard?: string;
  milkQuantity: number;
  milkUnit: 'ml' | 'bottle';
  authorizationNo: string;
  status: RecordStatus;
  reviewReason?: string;
  handlerName?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  isBadData: boolean;
  dataIssues: DataIssue[];
}

export interface ReviewLog {
  id: string;
  recordId: string;
  fromStatus: RecordStatus;
  toStatus: RecordStatus;
  reason: string;
  handlerName: string;
  createdAt: string;
}

export interface ListFilters {
  phone?: string;
  status?: RecordStatus;
  includeBadData?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ListResponse {
  data: MilkRecord[];
  total: number;
  normalCount: number;
  badCount: number;
}

export interface ReviewPayload {
  status: 'approved' | 'rejected';
  reviewReason: string;
  handlerName: string;
}

export interface MarkBadPayload {
  reason: string;
  handlerName: string;
}

export interface ExportRow {
  序号: number;
  婴儿姓名: string;
  家长手机号: string;
  奶量数量: string;
  状态: string;
  原因: string;
  处理人: string;
}
