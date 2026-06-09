export type RecordStatus = 'normal' | 'abnormal' | 'pending' | 'unmarked';

export type ConflictResolution = 'keep_old' | 'use_new' | 'merge';

export interface OilTempRecord {
  id: string;
  deviceName: string;
  measurePoint: string;
  timestamp: string;
  temperature: number;
  status: RecordStatus;
  attachmentUrl?: string;
  attachmentMissing?: boolean;
  remark?: string;
  modifiedBy?: string;
  modifiedAt: number;
  version: number;
}

export interface SupplementPoint {
  time: string;
  temperature: number;
}

export interface SupplementRecord {
  id: string;
  deviceName: string;
  operator: string;
  recordDate: string;
  points: SupplementPoint[];
  originalDataHash: string;
  createdAt: number;
  remark?: string;
}

export interface ConflictRecord {
  id: string;
  recordId: string;
  oldValue: OilTempRecord;
  newValue: OilTempRecord;
  operator1: string;
  operator2: string;
  timestamp: number;
  resolved: boolean;
}

export interface ChartRange {
  start: string;
  end: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AppState {
  records: OilTempRecord[];
  supplementRecords: SupplementRecord[];
  conflicts: ConflictRecord[];
  selectedIds: string[];
  chartRange: ChartRange;
  editingCell: { recordId: string; field: string } | null;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  showSupplementPanel: boolean;
  selectedDevice: string;
}

export interface EditableField {
  key: keyof OilTempRecord;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
}
