export interface Baby {
  id: string;
  name: string;
  className: string;
  photoUrl?: string;
  createdAt: number;
}

export type AuthStatus = 'authorized' | 'revoked' | 'pending' | 'missing';

export type RecordSource = 'original' | 'supplement' | 'manual' | 'revocation_notice';

export interface AuthRecord {
  id: string;
  babyId: string;
  version: number;
  status: AuthStatus;
  source: RecordSource;
  operatorName: string;
  remark?: string;
  photoPresent: boolean;
  anomalyReason?: string;
  affectsSummary: boolean;
  recordedAt: number;
  createdAt: number;
}

export interface BabySummary {
  baby: Baby;
  latestRecord: AuthRecord | null;
  versionCount: number;
  hasAnomaly: boolean;
}

export interface Stats {
  total: number;
  normal: number;
  anomaly: number;
  missing: number;
  byClass: Array<{ className: string; total: number; normal: number }>;
}

export interface CreateRecordBody {
  babyId: string;
  status: AuthStatus;
  source: RecordSource;
  operatorName: string;
  remark?: string;
  photoPresent: boolean;
  anomalyReason?: string;
  recordedAt?: number;
}
