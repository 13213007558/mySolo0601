export type RecordStatus =
  | 'pending'
  | 'promised'
  | 'rescheduled'
  | 'completed'
  | 'cancelled'
  | 'bad_data';

export type ChangeType =
  | 'original'
  | 'note'
  | 'reschedule'
  | 'rejudge'
  | 'bad_data';

export interface ChangeLog {
  id: string;
  recordId: string;
  status: RecordStatus;
  note: string;
  operator: string;
  timestamp: string;
  isOriginal: boolean;
  changeType: ChangeType;
  previousStatus?: RecordStatus;
}

export interface RescheduleRecord {
  id: string;
  childName: string;
  parentName: string;
  parentPhone: string;
  sourceFile: string;
  handler: string;
  currentStatus: RecordStatus;
  originalPromiseDate: string;
  latestNote: string;
  createdAt: string;
  updatedAt: string;
  isBadData: boolean;
  badDataReason?: string;
  sourceType: 'import' | 'manual';
  changeLogs: ChangeLog[];
}

export interface FilterOptions {
  status: RecordStatus | 'all' | 'exclude_bad';
  handler: string;
  keyword: string;
  dateFrom: string;
  dateTo: string;
  showBadData: boolean;
}

export type UserRole = 'consultant' | 'supervisor';
