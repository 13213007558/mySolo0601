export type MaterialType = 'photo' | 'consent_form' | 'id_copy' | 'other';
export type MaterialSource = 'original' | 'supplement';

export interface Material {
  id: string;
  type: MaterialType;
  name: string;
  uploadedAt: string;
  order: number;
  source: MaterialSource;
}

export type AuthJudgment = 'authorized' | 'rejected' | 'pending';
export type RecordStatus = 'open' | 'closed' | 'supplemented' | 'corrupted';
export type ChangeType = 'create' | 'update' | 'supplement' | 'close' | 'reopen';
export type AuditNoteType = 'corrupted_data' | 'missing_handler' | 'closed_supplement' | 'manual_entry' | 'data_integrity' | 'other';

export interface AuditNote {
  id: string;
  type: AuditNoteType;
  reason: string;
  createdAt: string;
  notedBy?: string;
}

export interface HistoryVersion {
  id: string;
  version: number;
  snapshot: {
    babyName: string;
    guardianName: string;
    authJudgment: AuthJudgment;
    materials: Material[];
    status: RecordStatus;
  };
  changedBy: string;
  changedAt: string;
  reviewBy?: string;
  reviewAt?: string;
  changeType: ChangeType;
  changeReason?: string;
  diffSummary?: string;
}

export interface AuthRecord {
  id: string;
  babyName: string;
  guardianName: string;
  authJudgment: AuthJudgment;
  materials: Material[];
  status: RecordStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  history: HistoryVersion[];
  auditNotes: AuditNote[];
  isCorrupted: boolean;
  currentVersion: number;
}

export interface AuthRecordStore {
  records: AuthRecord[];
  initialized: boolean;
  seedVersion: number;
}

export interface RecordStats {
  total: number;
  valid: number;
  corrupted: number;
  authorized: number;
  rejected: number;
  pending: number;
  open: number;
  closed: number;
  supplemented: number;
  totalHistoryVersions: number;
  totalSupplementMaterials: number;
}
