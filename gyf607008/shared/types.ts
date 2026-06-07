export type RecordStatus = 'normal' | 'pending' | 'abnormal';
export type RecordSource = 'batch' | 'supplement';
export type IssueType = 'phone_format' | 'privacy_leak' | 'required_missing' | 'invalid_data';
export type IssueSeverity = 'warning' | 'error';
export type AuditAction = 'create' | 'update' | 'review' | 'export';

export interface DataIssue {
  id: string;
  field: string;
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  reason: string;
}

export interface FieldChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface InfantRecord {
  id: string;
  batchNo: string;
  babyName: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  parentPhone: string;
  source: RecordSource;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  parentVisible: {
    feeding: string;
    temperature: string;
    sleep: string;
  };
  internalNotes: string;
  issues: DataIssue[];
}

export interface AuditLog {
  id: string;
  recordId: string;
  babyName: string;
  operator: string;
  action: AuditAction;
  timestamp: string;
  fieldChanges: FieldChange[];
}

export interface RecordFilters {
  batchNo?: string;
  babyName?: string;
  status?: RecordStatus | '';
  source?: RecordSource | '';
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditFilters {
  operator?: string;
  action?: AuditAction | '';
  dateFrom?: string;
  dateTo?: string;
  recordId?: string;
}

export interface ExportReport {
  totalCount: number;
  normalCount: number;
  abnormalCount: number;
  warningCount: number;
  issues: { recordId: string; babyName: string; issues: DataIssue[] }[];
  csvContent: string;
}

export interface ExportOptions {
  recordIds: string[];
  maskPhone: boolean;
  excludeInternal: boolean;
  excludeAbnormal: boolean;
  operator?: string;
}
