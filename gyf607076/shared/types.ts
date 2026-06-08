export type UserRole = 'elder' | 'parent';

export type AuthorizationStatus =
  | 'pending'
  | 'authorized'
  | 'denied'
  | 'conflicted'
  | 'revoked'
  | 'supplemented';

export type ChangeReason =
  | 'initial_create'
  | 'manual_supplement'
  | 'status_update'
  | 'booking_conflict'
  | 'confirmation_revoked'
  | 'data_correction'
  | 'other';

export interface PhotoContext {
  activityName: string;
  activityDate: string;
  location?: string;
  photographer?: string;
  description?: string;
}

export interface AuthorizationRecord {
  id: string;
  childName: string;
  childId: string;
  photoContext: PhotoContext;
  status: AuthorizationStatus;
  authorizedScopes: string[];
  guardianName: string;
  guardianContact?: string;
  createdAt: string;
  updatedAt: string;
  isSupplement: boolean;
  supplementOf?: string;
  version: number;
  changeReason?: ChangeReason;
  changeReasonNote?: string;
  conflictInfo?: {
    conflictingRecordId?: string;
    conflictDescription: string;
  };
  revocationInfo?: {
    revokedBy: string;
    revocationReason: string;
    revokedAt: string;
  };
  dataValid: boolean;
  invalidationReason?: string;
}

export interface VersionHistoryEntry {
  version: number;
  timestamp: string;
  snapshot: AuthorizationRecord;
  changeReason: ChangeReason;
  changeReasonNote?: string;
  operatorRole: UserRole;
  operatorName: string;
}

export interface AuthorizationRecordWithHistory {
  current: AuthorizationRecord;
  history: VersionHistoryEntry[];
}

export interface CreateRecordInput {
  childName: string;
  childId: string;
  photoContext: PhotoContext;
  authorizedScopes: string[];
  guardianName: string;
  guardianContact?: string;
  status?: AuthorizationStatus;
  changeReason?: ChangeReason;
  changeReasonNote?: string;
  isSupplement?: boolean;
  supplementOf?: string;
}

export interface UpdateRecordInput {
  id: string;
  status?: AuthorizationStatus;
  authorizedScopes?: string[];
  changeReason?: ChangeReason;
  changeReasonNote?: string;
  conflictInfo?: AuthorizationRecord['conflictInfo'];
  revocationInfo?: AuthorizationRecord['revocationInfo'];
  dataValid?: boolean;
  invalidationReason?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SummaryStats {
  total: number;
  authorized: number;
  pending: number;
  denied: number;
  conflicted: number;
  revoked: number;
  supplemented: number;
  invalid: number;
}

export const CHANGE_REASON_LABELS: Record<ChangeReason, string> = {
  initial_create: '初始创建',
  manual_supplement: '手工补录',
  status_update: '状态更新',
  booking_conflict: '预约冲突',
  confirmation_revoked: '确认被撤回',
  data_correction: '数据修正',
  other: '其他原因',
};

export const STATUS_LABELS: Record<AuthorizationStatus, string> = {
  pending: '待确认',
  authorized: '已授权',
  denied: '已拒绝',
  conflicted: '存在冲突',
  revoked: '已撤回',
  supplemented: '已补录',
};

export const SCOPE_OPTIONS = [
  '课堂内部展示',
  '幼儿园公众号',
  '宣传册印刷',
  '校园视频制作',
  '社交媒体发布',
  '对外活动展示',
];
