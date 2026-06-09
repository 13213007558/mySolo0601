export type UserRole = 'engineer' | 'admin' | 'supplier';

export type HotSpotLevel = '严重' | '中等' | '轻微';

export type RecordStatus = '待处理' | '处理中' | '已完成' | '已撤回';

export type ImageType = '红外热成像' | '可见光' | '无人机航拍';

export type ChangeType = '撤回原因变更' | '状态变更' | '补录' | '报价版本更新';

export interface SensitiveData {
  componentCost: number;
  repairCost: number;
  supplierContact: string;
  internalComments: string;
}

export interface RecheckImage {
  id: string;
  imageUrl: string;
  imageType: ImageType;
  description: string;
  capturedAt: string;
  capturedBy: string;
  isSupplemental: boolean;
  versionTag: string;
}

export interface VersionHistory {
  id: string;
  versionNumber: string;
  withdrawReason: string;
  previousWithdrawReason: string;
  changedBy: string;
  changedAt: string;
  sourceMaterialReference: string;
  changeType: ChangeType;
}

export interface SupplementalRecord {
  id: string;
  originalRecordId: string;
  supplementalImageUrl: string;
  supplementalNote: string;
  supplementedBy: string;
  supplementedAt: string;
  diffFromOriginal: Record<string, { old: unknown; new: unknown }>;
}

export interface HotSpotRecord {
  id: string;
  componentId: string;
  stationName: string;
  location: string;
  hotSpotLevel: HotSpotLevel;
  status: RecordStatus;
  detectedDate: string;
  processedDate?: string;
  processedBy: string;
  supplierQuoteVersion: string;
  currentWithdrawReason: string;
  originalWithdrawReason: string;
  internalFieldCode: string;
  isManuallySupplemented: boolean;
  supplementedBy?: string;
  supplementedAt?: string;
  sensitiveData: SensitiveData;
  recheckImages: RecheckImage[];
  versionHistory: VersionHistory[];
  supplementalRecord?: SupplementalRecord;
  _consistencyCheckId: string;
}

export interface RoleConfig {
  role: UserRole;
  roleName: string;
  allowedFields: string[];
  allowedOperations: string[];
  canViewSensitiveData: boolean;
  canExport: boolean;
  canSupplement: boolean;
  sensitiveFieldMask: Partial<Record<keyof SensitiveData, boolean>>;
}

export interface FilterState {
  searchText: string;
  stationName: string;
  hotSpotLevel: HotSpotLevel | '';
  status: RecordStatus | '';
  dateRange: {
    start: string;
    end: string;
  };
  isManuallySupplemented: boolean | null;
}

export interface ChartDataPoint {
  date: string;
  严重: number;
  中等: number;
  轻微: number;
  isAnomaly?: boolean;
}

export interface StatusChartData {
  name: string;
  value: number;
}

export type StorageScope = 'public' | 'role-restricted';

export interface ExportOptions {
  format: 'xlsx' | 'csv';
  includeSensitive: boolean;
  role: UserRole;
}
