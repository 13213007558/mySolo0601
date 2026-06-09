export type RecordStatus = 'pending' | 'normal' | 'anomaly';

export type OperationType = 'import' | 'update' | 'review' | 'undo' | 'delete' | 'supplement';

export interface BatteryRecord {
  id: string;
  batteryNo: string;
  originalBatteryNo: string;
  status: RecordStatus;
  originalStatus: RecordStatus;
  exchangeDate: string;
  location: string;
  operator: string;
  voltage: number;
  temperature: number;
  remark: string;
  formatIssue: string | null;
  isAnomaly: boolean;
  anomalyReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: string;
  type: OperationType;
  operator: string;
  description: string;
  snapshot: BatteryRecord[];
  timestamp: string;
}

export interface SupplementRecord {
  id: string;
  batteryNo: string;
  boxNo: string;
  transferDate: string;
  fromLocation: string;
  toLocation: string;
  operator: string;
  remark: string;
  isManual: boolean;
  beforeData: SupplementRecord | null;
  afterData: SupplementRecord | null;
  createdAt: string;
}

export interface FilterState {
  batteryNo: string;
  status: RecordStatus | '';
  dateRange: { start: string; end: string };
  isAnomaly: boolean | null;
  hasFormatIssue: boolean | null;
}

export interface AppState {
  records: BatteryRecord[];
  operationLogs: OperationLog[];
  supplementRecords: SupplementRecord[];
  historyStack: BatteryRecord[][];
  selectedIds: string[];
  filters: FilterState;
  version: string;
}

export interface AppActions {
  importRecords: (records: Omit<BatteryRecord, 'id' | 'originalBatteryNo' | 'originalStatus' | 'createdAt' | 'updatedAt'>[]) => void;
  updateRecord: (id: string, updates: Partial<BatteryRecord>) => void;
  deleteRecords: (ids: string[]) => void;
  reviewRecords: (ids: string[], status: RecordStatus, reviewer: string) => void;
  undo: () => void;
  selectRecord: (id: string, selected: boolean) => void;
  selectAll: (selected: boolean) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  exportRecords: (type: 'normal' | 'all' | 'full') => string;
  loadSampleData: () => void;
  clearAllData: () => void;
  addSupplementRecord: (record: Omit<SupplementRecord, 'id' | 'createdAt' | 'beforeData' | 'afterData'>) => void;
  updateSupplementRecord: (id: string, updates: Partial<SupplementRecord>) => void;
  deleteSupplementRecord: (id: string) => void;
}

export type BatteryStore = AppState & AppActions;

export interface FormatIssue {
  hasIssue: boolean;
  detectedFormat: 'old' | 'new' | 'unknown';
  suggestedFormat: string;
  message: string;
}

export interface AnomalyCheck {
  isAnomaly: boolean;
  reasons: string[];
}

export interface DiffItem {
  field: string;
  before: string | number | null;
  after: string | number | null;
  isDifferent: boolean;
}
