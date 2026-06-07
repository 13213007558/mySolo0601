export type IdentityStatus = 'verified' | 'pending' | 'rejected' | 'missing';
export type MaterialStatus = 'complete' | 'partial' | 'missing' | 'expired';
export type ScheduleStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'manually_corrected';
export type PhotoStatus = 'present' | 'missing' | 'rejected';
export type AuditAction =
  | 'create'
  | 'update'
  | 'status_change'
  | 'note_add'
  | 'manual_correction'
  | 'export'
  | 'partial_success'
  | 'photo_missing';

export interface NoteEntry {
  id: string;
  timestamp: string;
  author: string;
  content: string;
  isRevision: boolean;
  originalPromise?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  operator: string;
  targetId: string;
  targetType: 'child' | 'schedule' | 'material';
  details: string;
  oldValue?: string;
  newValue?: string;
}

export interface AuthorizedPerson {
  id: string;
  name: string;
  relation: string;
  phone: string;
  idCard: string;
  photoStatus: PhotoStatus;
  photoUrl?: string;
}

export interface ChildIdentity {
  id: string;
  name: string;
  nickname: string;
  birthDate: string;
  gender: 'male' | 'female';
  idCard: string;
  identityStatus: IdentityStatus;
}

export interface MaterialItem {
  id: string;
  type:
    | 'id_card'
    | 'birth_certificate'
    | 'vaccination'
    | 'authorization_letter'
    | 'photo';
  name: string;
  status: MaterialStatus;
  uploadDate?: string;
  expiryDate?: string;
  remark?: string;
}

export interface MaterialBundle {
  id: string;
  childId: string;
  items: MaterialItem[];
  overallStatus: MaterialStatus;
  missingItems: string[];
}

export interface Schedule {
  id: string;
  childId: string;
  childName: string;
  childNickname: string;
  trialCourseName: string;
  scheduledDate: string;
  scheduledTime: string;
  pickUpTime: string;
  dropOffTime: string;
  consultant: string;
  authorizedPersons: AuthorizedPerson[];
  status: ScheduleStatus;
  identityStatus: IdentityStatus;
  materialStatus: MaterialStatus;
  photoStatus: PhotoStatus;
  notes: NoteEntry[];
  auditLogs: AuditLogEntry[];
  failureReason?: string;
  manualCorrection?: {
    correctedBy: string;
    correctedAt: string;
    correctionNote: string;
    originalStatus: ScheduleStatus;
  };
  isPartialSuccess: boolean;
  partialSuccessReason?: string;
}

export interface SummaryStats {
  total: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  failed: number;
  partialSuccess: number;
  pendingIdentity: number;
  missingMaterial: number;
  missingPhoto: number;
  manuallyCorrected: number;
}

export interface ExportOptions {
  format: 'csv' | 'markdown';
  includeAudit: boolean;
  includeNotes: boolean;
  dateRange?: { start: string; end: string };
}
