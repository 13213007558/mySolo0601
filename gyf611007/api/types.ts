export type UserRole = "chief" | "assistant" | "admin";

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  display_name: string;
  created_at: string;
}

export type BatchStatus = "pending" | "in_progress" | "locked" | "downgraded";

export interface Batch {
  id: number;
  batch_code: string;
  tea_name: string;
  origin: string;
  standard_sample_id: number | null;
  status: BatchStatus;
  re_eval_count: number;
  locked_at: string | null;
  created_by: number;
  created_at: string;
}

export type SampleStatus = "pending" | "sipping" | "scored" | "invalid";

export interface Sample {
  id: number;
  batch_id: number;
  sample_code: string;
  spoon_verified: boolean;
  sip_duration_ms: number | null;
  avg_volume_db: number | null;
  volume_threshold_db: number;
  sip_valid: boolean | null;
  invalidate_count: number;
  status: SampleStatus;
  order_index: number;
}

export interface Score {
  id: number;
  sample_id: number;
  scorer_id: number;
  appearance: number;
  aroma: number;
  taste: number;
  leaf: number;
  total: number;
  deviation: number;
  created_at: string;
}

export interface Certificate {
  id: number;
  batch_id: number;
  content_json: string;
  signed_by: number | null;
  signed_at: string | null;
  created_at: string;
}

export interface SipResult {
  duration_ms: number;
  avg_volume_db: number;
  peak_volume_db: number;
  min_volume_db: number;
  samples_above_threshold: number;
  total_samples: number;
}

export interface StandardScores {
  appearance: number;
  aroma: number;
  taste: number;
  leaf: number;
}

export interface SessionUser {
  id: number;
  username: string;
  role: UserRole;
  display_name: string;
}

export const SIP_DURATION_THRESHOLD_MS = 8000;
export const VOLUME_THRESHOLD_DB = 35;
export const MAX_INVALIDATE_COUNT = 2;
export const STANDARD_SCORES: StandardScores = {
  appearance: 85,
  aroma: 88,
  taste: 90,
  leaf: 86,
};
export const DEVIATION_TOLERANCE = 5;
