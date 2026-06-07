export type RecordStatus = 'draft' | 'pending_review' | 'reviewed' | 'rejected';
export type DataQuality = 'normal' | 'corrupted' | 'missing_pages';
export type VaccineType = 'hepatitis_b' | 'bcg' | 'diphtheria' | 'mmr' | 'polio' | 'je' | 'hib';

export interface ParentVisibleInfo {
  infantName: string;
  gender: 'male' | 'female';
  birthDate: string;
  guardianName: string;
  guardianPhone: string;
  vaccineName: string;
  vaccineBatch: string;
  vaccinationDate: string;
  vaccinationSite: string;
  nextFollowUpDate: string;
  publicRemarks: string;
}

export interface InternalInfo {
  medicalRecordNo: string;
  nurseId: string;
  nurseName: string;
  internalNotes: string;
  abnormalSymptoms: string[];
  contraindications: string[];
}

export interface AuditChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface AuditLog {
  id: string;
  recordId: string;
  operatorId: string;
  operatorName: string;
  action: 'create' | 'update' | 'review' | 'reject' | 'manual_entry' | 'export';
  changes: AuditChange[];
  timestamp: string;
}

export interface AnomalyReason {
  type: 'missing_pages' | 'export_mismatch' | 'data_corruption' | 'other';
  description: string;
  detail: string;
  reportedAt: string;
  reportedBy: string;
}

export interface FollowUpRecord {
  id: string;
  parentVisible: ParentVisibleInfo;
  internal: InternalInfo;
  status: RecordStatus;
  dataQuality: DataQuality;
  isManualEntry: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewResult: 'pass' | 'fail' | null;
  reviewComments: string;
  anomalies: AnomalyReason[];
  auditLogIds: string[];
}

export interface FilterParams {
  keyword: string;
  status: RecordStatus | 'all';
  dataQuality: DataQuality | 'all';
  startDate: string;
  endDate: string;
  isManualEntry: boolean | null;
  reviewed: boolean | null;
}

export interface ExportMeta {
  exportId: string;
  exportedAt: string;
  exportedBy: string;
  recordCountInPage: number;
  recordCountExported: number;
  filtersApplied: FilterParams;
}
