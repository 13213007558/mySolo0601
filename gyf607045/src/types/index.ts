export type Role = 'nurse' | 'supervisor';

export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'manual_override'
  | 'partially_verified';

export type RecordSource = 'system_import' | 'manual_entry';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface PackageFlow {
  id: string;
  babyName: string;
  packageName: string;
  packageType: string;
  flowDate: string;
  amount: number;
  remainingSessions: number;
  totalSessions: number;
  source: RecordSource;
  importBatchId?: string;
}

export interface PhotoEvidence {
  id: string;
  url: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface RectificationRecord {
  id: string;
  recordId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: Role;
  action: string;
  remark: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  recordId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: Role;
  action: string;
  oldValue?: string;
  newValue?: string;
  oldStatus?: VerificationStatus;
  newStatus?: VerificationStatus;
  timestamp: string;
  ip?: string;
}

export interface VerificationRecord {
  id: string;
  packageFlowId: string;
  babyName: string;
  packageName: string;
  verifyDate: string;
  actualSessions: number;
  status: VerificationStatus;
  reason: string;
  source: RecordSource;
  photos: PhotoEvidence[];
  rectifications: RectificationRecord[];
  audits: AuditLog[];
  isActive: boolean;
  importBatchId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dateOrderIssue?: boolean;
  partialSuccessNote?: string;
}

export interface AppState {
  currentUser: User | null;
  packageFlows: PackageFlow[];
  verificationRecords: VerificationRecord[];
  lastImportBatchId: string | null;
}

export const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: '待核销',
  verified: '已核销',
  rejected: '已驳回',
  manual_override: '人工改判',
  partially_verified: '部分成功',
};

export const ROLE_LABEL: Record<Role, string> = {
  nurse: '护理员',
  supervisor: '护理主管',
};
