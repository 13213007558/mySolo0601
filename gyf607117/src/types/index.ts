export type SpotStatus = 'available' | 'occupied' | 'charging' | 'offline' | 'mismatch';
export type AlertType = 'export_mismatch' | 'long_occupation' | 'offline' | null;
export type OperationType = 'status_update' | 'screenshot_upload' | 'export_correction' | 'manual_entry';
export type UserRole = 'staff' | 'admin';

export interface Screenshot {
  id: string;
  url: string;
  timestamp: string;
  source: 'system' | 'manual';
  uploadedBy?: string;
  remark?: string;
}

export interface ParkingSpot {
  id: string;
  spotNumber: string;
  status: SpotStatus;
  occupiedSince: string | null;
  exportValue: number;
  actualValue: number;
  screenshots: Screenshot[];
  lastUpdated: string;
  hasAlert: boolean;
  alertType: AlertType;
  vehiclePlate?: string;
  chargePower?: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  employeeId: string;
  avatar?: string;
}

export interface OperationHistory {
  id: string;
  spotId: string;
  spotNumber: string;
  operator: string;
  operatorRole: UserRole;
  operationType: OperationType;
  timestamp: string;
  reason: string;
  beforeData: Partial<ParkingSpot>;
  afterData: Partial<ParkingSpot>;
  screenshotBefore?: string;
  screenshotAfter?: string;
}

export interface ParkingStore {
  spots: ParkingSpot[];
  history: OperationHistory[];
  currentUser: User;
  expandedSpotId: string | null;
  filterStatus: SpotStatus | 'all';
  setExpandedSpotId: (id: string | null) => void;
  setFilterStatus: (status: SpotStatus | 'all') => void;
  addScreenshot: (spotId: string, screenshot: Omit<Screenshot, 'id' | 'timestamp'>) => void;
  updateSpotValues: (spotId: string, exportValue: number, actualValue: number, reason: string) => void;
  manualEntry: (spotId: string, data: Partial<ParkingSpot>, screenshot: string, reason: string) => void;
  getAlertCount: () => number;
  getMismatchCount: () => number;
}

export const STATUS_LABELS: Record<SpotStatus, string> = {
  available: '空闲',
  occupied: '占用',
  charging: '充电中',
  offline: '离线',
  mismatch: '数据不一致',
};

export const STATUS_COLORS: Record<SpotStatus, string> = {
  available: 'bg-green-500',
  occupied: 'bg-orange-500',
  charging: 'bg-blue-500',
  offline: 'bg-gray-500',
  mismatch: 'bg-red-500',
};

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  status_update: '状态更新',
  screenshot_upload: '截图上传',
  export_correction: '导出修正',
  manual_entry: '手工补录',
};
