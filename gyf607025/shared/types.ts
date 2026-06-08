export type UserRole = "staff" | "supervisor";
export type VerifyStatus = "pending" | "verified" | "exception" | "partial_success";

export interface CourseTransaction {
  id: string;
  transactionId: string;
  phone: string;
  babyName: string;
  courseName: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  amount: number;
  purchaseDate: string;
  source: "normal" | "manual";
  operator?: string;
  createdAt: string;
}

export interface VerificationRecord {
  id: string;
  transactionId: string;
  phone: string;
  verifyDate: string;
  sessionsUsed: number;
  operator: string;
  status: VerifyStatus;
  result: string;
  remark: string;
  manualEntry?: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  role: UserRole;
  action: string;
  targetId: string;
  targetType: "transaction" | "verification" | "manual_entry" | "import";
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string;
  partialSuccess?: boolean;
  dataRecovered?: boolean;
  note?: string;
}

export interface Stats { pending: number; verified: number; exception: number; total: number; }
export interface TransactionFilter { phone?: string; status?: VerifyStatus | "all"; }
export interface Paged<T> { items: T[]; total: number; }
export interface IdempotentResult { inserted: number; skipped: number; totalSample: number; }
