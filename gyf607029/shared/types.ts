export type AuthType = 'primary' | 'temporary' | 'phone';

export type AuthStatus = 'active' | 'revoked' | 'expired' | 'pending' | 'failed' | 'corrected';

export type ExportStatus = 'success' | 'partial' | 'failed' | 'rejected';

export type MaterialStatus = 'ok' | 'missing' | 'damaged';

export type MaterialType = 'auth_letter' | 'id_card' | 'other';

export type AuditAction = 'create' | 'update' | 'revoke' | 'correct' | 'export' | 'phone_auth';

export interface PickupPerson {
  id: string;
  authId: string;
  name: string;
  relation: string;
  phone: string;
  idCard?: string;
  isPhoneAuth: boolean;
  authStart?: string;
  authEnd?: string;
  remark?: string;
}

export interface MaterialAttachment {
  id: string;
  authId: string;
  name: string;
  type: MaterialType;
  status: MaterialStatus;
  uploadedAt: string;
  uploader: string;
}

export interface Authorization {
  id: string;
  babyName: string;
  babyBirth?: string;
  parentPhone: string;
  parentName: string;
  storeName: string;
  authType: AuthType;
  authStatus: AuthStatus;
  pickups: PickupPerson[];
  materials: MaterialAttachment[];
  createdAt: string;
  updatedAt: string;
  lastOperator: string;
}

export interface AuditLog {
  id: string;
  authId: string;
  operator: string;
  operatorRole: string;
  action: AuditAction;
  field?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
  ip?: string;
}

export interface ExportRecord {
  id: string;
  operator: string;
  format: 'csv' | 'markdown';
  filterCriteria: string;
  pageCount: number;
  exportCount: number;
  diffCount: number;
  status: ExportStatus;
  missingIds: string;
  createdAt: string;
  remark?: string;
}

export interface CorrectionRecord {
  id: string;
  authId: string;
  beforeData: string;
  afterData: string;
  reason: string;
  operator: string;
  reviewedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface SummaryStats {
  total: number;
  active: number;
  temporary: number;
  phoneAuth: number;
  failed: number;
  pendingCorrection: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExportDiffItem {
  authId: string;
  babyName: string;
  parentPhone: string;
  reason: string;
}

export interface ExportResult {
  status: 'success' | 'partial' | 'failed' | 'rejected';
  content?: string;
  filename: string;
  pageCount: number;
  exportCount: number;
  diffCount: number;
  missingIds: string[];
  exportRecordId: string;
  remark?: string;
}
