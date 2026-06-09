export type RecordStatus = 'normal' | 'abnormal' | 'crossday' | 'duplicate' | 'manual';

export type PlugAction = 'insert' | 'remove';

export type DataSource = 'import' | 'sample' | 'manual';

export type SampleType = 'normal' | 'abnormal' | 'empty' | 'linjie';

export interface GunRecord {
  id: string;
  gunCode: string;
  timestamp: string;
  operator: string;
  action: PlugAction;
  remark: string;
  status: RecordStatus;
  originalRecordId?: string;
  originalValue?: Partial<GunRecord>;
  isManualEntry: boolean;
  manualEntryBy?: string;
  createdAt: string;
  updatedAt: string;
  source: DataSource;
}

export interface OperationLog {
  id: string;
  type: 'import' | 'manual' | 'delete' | 'update' | 'sample_load';
  timestamp: string;
  description: string;
  recordsAffected: number;
  user?: string;
  sampleType?: SampleType;
}

export interface AlertMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  plainText?: string;
}

export interface AppFilter {
  status?: RecordStatus;
  gunCode?: string;
  dateRange?: [string, string];
}

export interface DuplicateInfo {
  newRecord: GunRecord;
  existingRecord: GunRecord;
}

export interface ImportResult {
  added: GunRecord[];
  duplicates: DuplicateInfo[];
  errors: string[];
}

export interface ExportData {
  version: string;
  exportedAt: string;
  exportedBy: string;
  records: GunRecord[];
}
