export type RecordStatus = 'pending' | 'reviewed' | 'exception' | 'supplemented';

export type DataSource = 'normal' | 'supplement' | 'corrupted';

export type ExceptionType = 'service_restart' | 'data_loss' | 'bad_data' | 'system_error';

export type UserRole = 'nurse' | 'director';

export interface ChangeHistory {
  id: string;
  recordId: string;
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  operator: string;
  operatorRole: UserRole;
  reviewedAt: string;
  note: string;
  createdAt: string;
}

export interface ExceptionEvent {
  id: string;
  recordId: string;
  type: ExceptionType;
  title: string;
  reason: string;
  recoveryNote?: string;
  createdAt: string;
  operator?: string;
}

export interface CourseRescheduleRecord {
  id: string;
  infantName: string;
  infantAge: number;
  guardianName: string;
  guardianPhone: string;
  courseName: string;
  originalDate: string;
  newDate: string;
  sourceFile: string;
  sourceFileUrl?: string;
  operator: string;
  operatorRole: UserRole;
  status: RecordStatus;
  dataSource: DataSource;
  latestNote: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  changeHistory: ChangeHistory[];
  exceptions: ExceptionEvent[];
}

export interface ExportLog {
  id: string;
  operator: string;
  filters: Record<string, any>;
  format: 'csv' | 'xlsx';
  recordCount: number;
  downloadUrl: string;
  createdAt: string;
}

export interface StatsSummary {
  pending: number;
  reviewed: number;
  exception: number;
  supplemented: number;
  total: number;
}

export interface RecordFilters {
  status?: RecordStatus;
  dataSource?: DataSource;
  operator?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
