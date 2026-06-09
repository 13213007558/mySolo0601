export type CircuitStatus = 'normal' | 'fault' | 'pending' | 'unknown';

export type RecordSource = 'sticker' | 'handwritten' | 'manual';

export type EmptyStateType = 'no-import' | 'filter-too-narrow' | 'all-bad' | 'none';

export interface CircuitRecord {
  id: string;
  circuitName: string;
  circuitCode: string;
  location: string;
  status: CircuitStatus;
  voltage: number;
  current: number;
  power: number;
  illumination: number;
  inspectionDate: string;
  inspector: string;
  source: RecordSource;
  remark?: string;
  faultReason?: string;
  isBad?: boolean;
  badReason?: string;
  originalValues?: Partial<CircuitRecord>;
  manualEdited?: boolean;
  editedBy?: string;
  editedAt?: string;
}

export interface ProblemRecord extends CircuitRecord {
  badReason: string;
  problemType: 'format' | 'logic' | 'missing' | 'range';
  suggestedFix?: string;
}

export interface StickerRecord {
  id: string;
  circuitName: string;
  circuitCode: string;
  location: string;
  stickerDate: string;
  operator: string;
  remark?: string;
}

export interface StatisticsData {
  totalRecords: number;
  normalCount: number;
  faultCount: number;
  pendingCount: number;
  problemCount: number;
  totalPower: number;
  avgIllumination: number;
  passRate: number;
}

export interface ThresholdConfig {
  voltageMin: number;
  voltageMax: number;
  currentMin: number;
  currentMax: number;
  powerMin: number;
  powerMax: number;
  illuminationMin: number;
  illuminationMax: number;
}

export interface ComparisonResult {
  field: string;
  before: string | number;
  after: string | number;
  changed: boolean;
}

export interface ExportRecord {
  id: string;
  exportTime: string;
  exportType: 'sticker' | 'handwritten' | 'all';
  cardValue: number;
  exportedValue: number;
  matched: boolean;
  originalRecords: CircuitRecord[];
}

export interface AppState {
  circuitRecords: CircuitRecord[];
  problemRecords: ProblemRecord[];
  stickerRecords: StickerRecord[];
  manualStickers: StickerRecord[];
  exportRecords: ExportRecord[];
  hasImported: boolean;
  filters: {
    status?: CircuitStatus;
    dateRange?: [string, string];
    location?: string;
    searchText?: string;
  };
  thresholds: ThresholdConfig;
}
