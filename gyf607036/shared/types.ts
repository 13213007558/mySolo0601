export type AuthStatus =
  | 'pending'
  | 'authorized'
  | 'partial'
  | 'revoked'
  | 'expired'
  | 'bad_data';

export type PhotoAuthType =
  | 'class_activity'
  | 'promotion'
  | 'social_media'
  | 'print_material'
  | 'other';

export type PhotoScope = 'class_only' | 'store_wide' | 'chain_wide' | 'public';

export type RemarkSource =
  | 'original_commitment'
  | 'supplement'
  | 'status_change'
  | 'parent_revision';

export type SystemEventType =
  | 'service_start'
  | 'service_restart'
  | 'data_recovery'
  | 'history_loss_detected'
  | 'bad_data_isolated'
  | 'db_migrated';

export type AuditAction =
  | 'create'
  | 'update'
  | 'status_change'
  | 'supplement_remark'
  | 'manual_entry'
  | 'mark_bad'
  | 'restore'
  | 'export';

export interface PhotoMaterial {
  id: string;
  authId: string;
  name: string;
  url?: string;
  uploadTime: string;
  uploader: string;
  note?: string;
}

export interface RemarkHistory {
  id: string;
  authId: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  content: string;
  source: RemarkSource;
}

export interface PhotoAuthorization {
  id: string;
  babyName: string;
  babyBirthday?: string;
  className: string;
  parentName: string;
  parentPhone: string;
  authType: PhotoAuthType;
  photoScope: PhotoScope;
  status: AuthStatus;
  validStart?: string;
  validEnd?: string;
  originalCommitment: string;
  isManualEntry: boolean;
  isBadData: boolean;
  badDataReason?: string;
  handlerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoAuthVersion {
  id: string;
  authId: string;
  version: number;
  snapshot: string;
  operatorName: string;
  changeReason: string;
  createdAt: string;
}

export interface SystemEvent {
  id: string;
  authId?: string;
  eventType: SystemEventType;
  title: string;
  detail: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  authId: string;
  action: AuditAction;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
  ip?: string;
}

export interface StatsSummary {
  total: number;
  pending: number;
  authorized: number;
  partial: number;
  revoked: number;
  expired: number;
  badData: number;
  manualEntry: number;
}

export interface ListFilters {
  status?: AuthStatus;
  className?: string;
  babyName?: string;
  parentPhone?: string;
  includeBadData?: boolean;
}

export interface ListResponse {
  data: PhotoAuthorization[];
  total: number;
  stats: StatsSummary;
}

export interface DetailResponse {
  record: PhotoAuthorization;
  remarks: RemarkHistory[];
  versions: PhotoAuthVersion[];
  audits: AuditLog[];
  relatedEvents: SystemEvent[];
  materials: PhotoMaterial[];
}

export interface SupplementPayload {
  content: string;
  operatorName: string;
  operatorId?: string;
  source?: Exclude<RemarkSource, 'original_commitment'>;
}

export interface StatusChangePayload {
  status: AuthStatus;
  operatorName: string;
  operatorId?: string;
  reason?: string;
  supplementRemark?: string;
}

export interface ManualEntryPayload {
  babyName: string;
  babyBirthday?: string;
  className: string;
  parentName: string;
  parentPhone: string;
  authType: PhotoAuthType;
  photoScope: PhotoScope;
  validStart?: string;
  validEnd?: string;
  originalCommitment: string;
  operatorName: string;
  operatorId?: string;
}

export const AUTH_STATUS_LABEL: Record<AuthStatus, string> = {
  pending: '待确认',
  authorized: '已授权',
  partial: '部分授权',
  revoked: '已撤销',
  expired: '已过期',
  bad_data: '已隔离',
};

export const AUTH_STATUS_COLOR: Record<AuthStatus, string> = {
  pending: 'bg-warning-100 text-warning-600 border-warning-200',
  authorized: 'bg-safety-100 text-safety-600 border-safety-200',
  partial: 'bg-medical-100 text-medical-600 border-medical-200',
  revoked: 'bg-danger-100 text-danger-600 border-danger-200',
  expired: 'bg-cream-200 text-gray-600 border-cream-300',
  bad_data: 'bg-red-100 text-red-700 border-red-200',
};

export const AUTH_TYPE_LABEL: Record<PhotoAuthType, string> = {
  class_activity: '课堂活动',
  promotion: '招生宣传',
  social_media: '社交媒体',
  print_material: '印刷物料',
  other: '其他',
};

export const PHOTO_SCOPE_LABEL: Record<PhotoScope, string> = {
  class_only: '仅本班',
  store_wide: '本门店',
  chain_wide: '全连锁',
  public: '公开网络',
};

export const REMARK_SOURCE_LABEL: Record<RemarkSource, string> = {
  original_commitment: '原始承诺',
  supplement: '顾问补录',
  status_change: '状态变更',
  parent_revision: '家长改口',
};

export const SYSTEM_EVENT_LABEL: Record<SystemEventType, string> = {
  service_start: '服务启动',
  service_restart: '服务重启',
  data_recovery: '数据恢复',
  history_loss_detected: '历史丢失检测',
  bad_data_isolated: '坏数据隔离',
  db_migrated: '数据迁移',
};
