export type AcceptanceStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING_EVIDENCE' | 'REJECTED' | 'ARCHIVABLE';

export type UserRole = 'PROJECT_MANAGER' | 'SUPERVISOR' | 'DOCUMENT_CONTROLLER';

export type EvidenceType = 'ACCEPTANCE_FORM' | 'SITE_PHOTO' | 'SUPPLEMENT_NOTE';

export interface Evidence {
  id: string;
  type: EvidenceType;
  name: string;
  dataUrl: string;
  uploadTime: string;
  uploadedBy: string;
}

export interface StatusHistory {
  id: string;
  recordId: string;
  fromStatus: AcceptanceStatus | null;
  toStatus: AcceptanceStatus;
  reason?: string;
  operator: string;
  operatorRole: UserRole;
  timestamp: string;
}

export interface AcceptanceRecord {
  id: string;
  projectName: string;
  axis: string;
  location: string;
  workType: string;
  acceptanceDate: string;
  formworkDate: string;
  description: string;
  status: AcceptanceStatus;
  rejectReason?: string;
  evidence: Evidence[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  status: AcceptanceStatus[];
  workType: string[];
  keyword: string;
  dateRange: [string, string] | null;
  onlyMyRecords: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export const ACCEPTANCE_STATUS_LABELS: Record<AcceptanceStatus, string> = {
  DRAFT: '草稿',
  SUBMITTED: '待审核',
  PENDING_EVIDENCE: '待补证',
  REJECTED: '退回',
  ARCHIVABLE: '可归档'
};

export const ACCEPTANCE_STATUS_COLORS: Record<AcceptanceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  PENDING_EVIDENCE: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  ARCHIVABLE: 'bg-green-100 text-green-700'
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  PROJECT_MANAGER: '项目经理',
  SUPERVISOR: '监理工程师',
  DOCUMENT_CONTROLLER: '资料员'
};

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  ACCEPTANCE_FORM: '验收单',
  SITE_PHOTO: '现场照片',
  SUPPLEMENT_NOTE: '补签说明'
};

export const WORK_TYPES = [
  '地下室墙筋',
  '梁板钢筋',
  '柱筋绑扎',
  '剪力墙钢筋',
  '后浇带',
  '预埋管线',
  '止水钢板',
  '其他隐蔽工程'
] as const;

export const STORAGE_KEYS = {
  RECORDS: 'concealed-acceptance-records',
  HISTORY: 'concealed-acceptance-history',
  CURRENT_USER: 'concealed-acceptance-user'
} as const;

export const STATUS_TRANSITIONS: Record<AcceptanceStatus, AcceptanceStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['PENDING_EVIDENCE', 'REJECTED', 'ARCHIVABLE'],
  PENDING_EVIDENCE: ['SUBMITTED', 'REJECTED', 'ARCHIVABLE'],
  REJECTED: ['SUBMITTED'],
  ARCHIVABLE: []
};

export const REQUIRED_EVIDENCE_TYPES: EvidenceType[] = ['ACCEPTANCE_FORM', 'SITE_PHOTO'];
