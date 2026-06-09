export type CylinderStatus =
  | 'normal'
  | 'processing'
  | 'completed'
  | 'inspecting'
  | 'overdue'
  | 'repaired';

export type ApprovalStatus =
  | 'submitted'
  | 'withdrawn'
  | 'resubmitted';

export type AnomalyType =
  | 'photo_missing_direction'
  | 'permission_phone_leak';

export type SupplementType =
  | 'pressure_sticker'
  | 'manual';

export interface Cylinder {
  id: string;
  code: string;
  location: string;
  type: string;
  currentStatus: CylinderStatus;
  pressure: string;
  inspector: string;
  phone: string;
  lastCheckDate: string;
  nextCheckDate: string;
  supplementId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  cylinderId: string;
  oldStatus: CylinderStatus;
  newStatus: CylinderStatus;
  operator: string;
  reason: string;
  timestamp: string;
  remark?: string;
}

export interface Photo {
  id: string;
  cylinderId: string;
  url: string;
  direction?: string;
  hasDirection: boolean;
  missingReason?: string;
  uploadTime: string;
}

export interface Approval {
  id: string;
  cylinderId: string;
  conclusion: string;
  reason: string;
  remark?: string;
  operator: string;
  role: string;
  timestamp: string;
  status: ApprovalStatus;
  parentApprovalId?: string;
}

export interface SupplementRecord {
  id: string;
  cylinderId: string;
  type: SupplementType;
  beforeData: Record<string, any>;
  afterData: Record<string, any>;
  operator: string;
  timestamp: string;
  exportChecksum?: string;
}

export interface Anomaly {
  id: string;
  type: AnomalyType;
  cylinderId: string;
  readableReason: string;
  technicalDetails: string;
  detectedAt: string;
  resolved: boolean;
}

export interface ExportData {
  cylinders: Cylinder[];
  statusHistories: StatusHistory[];
  photos: Photo[];
  approvals: Approval[];
  supplements: SupplementRecord[];
  anomalies: Anomaly[];
  exportedAt: string;
  checksum: string;
}

export const statusLabels: Record<CylinderStatus, string> = {
  normal: '正常',
  processing: '处理中',
  completed: '已处理',
  inspecting: '巡检中',
  overdue: '逾期',
  repaired: '已维修',
};

export const statusColors: Record<CylinderStatus, string> = {
  normal: 'bg-emerald-500',
  processing: 'bg-amber-500',
  completed: 'bg-blue-500',
  inspecting: 'bg-purple-500',
  overdue: 'bg-red-500',
  repaired: 'bg-teal-500',
};

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  submitted: '已提交',
  withdrawn: '已撤回',
  resubmitted: '重新提交',
};
