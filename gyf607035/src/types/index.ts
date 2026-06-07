export type UserRole = "consultant" | "supervisor";

export type FeeUnit = "class_hour" | "yuan" | "section";

export type VerifyStatus =
  | "pending"
  | "processing"
  | "verified"
  | "partially_verified"
  | "rejected";

export type AuditAction =
  | "create"
  | "verify"
  | "update_remark"
  | "mark_boundary"
  | "invalidate"
  | "import"
  | "supplement"
  | "audit_boundary";

export interface RemarkEntry {
  id: string;
  content: string;
  operator: string;
  operatorRole: UserRole;
  timestamp: string;
  previousContent?: string;
}

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  recordId?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  operator: string;
  operatorRole: UserRole;
  timestamp: string;
  note?: string;
}

export interface VerifyRecord {
  id: string;
  parentName: string;
  childName: string;
  childAge: string;
  courseName: string;
  quantity: number;
  unit: FeeUnit;
  originalUnit?: FeeUnit;
  unitMixed: boolean;
  isBoundaryValue: boolean;
  boundaryAudited?: boolean;
  boundaryAuditedBy?: string;
  boundaryAuditedAt?: string;
  unitPrice: number;
  amount: number;
  status: VerifyStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  verifiedBy?: string;
  verifiedAt?: string;
  isImported: boolean;
  importBatchId?: string;
  isInvalid: boolean;
  invalidReason?: string;
  invalidatedAt?: string;
  isSupplemented: boolean;
  remarkHistory: RemarkEntry[];
  auditLogs: AuditLogEntry[];
}

export interface BalanceSnapshot {
  month: string;
  initialBalance: number;
  verifiedAmount: number;
  remainingBalance: number;
  updatedAt: string;
}

export interface VerifyRecordInput {
  parentName: string;
  childName: string;
  childAge: string;
  courseName: string;
  quantity: number;
  unit: FeeUnit;
  unitPrice: number;
  initialRemark?: string;
}

export const UNIT_LABELS: Record<FeeUnit, string> = {
  class_hour: "课时",
  yuan: "元",
  section: "节",
};

export const STATUS_LABELS: Record<VerifyStatus, string> = {
  pending: "待核销",
  processing: "核销中",
  verified: "已核销",
  partially_verified: "部分核销",
  rejected: "已驳回",
};

export const STATUS_COLORS: Record<VerifyStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  verified: "bg-brand-100 text-brand-700 border-brand-200",
  partially_verified: "bg-accent-100 text-accent-700 border-accent-200",
  rejected: "bg-danger-100 text-danger-600 border-danger-200",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  consultant: "试听顾问",
  supervisor: "主管",
};

export const STEPS = [
  { id: 1, title: "核对基本信息", desc: "确认家长与课程信息" },
  { id: 2, title: "确认数量单位", desc: "检查课时/金额/节数" },
  { id: 3, title: "检查边界标记", desc: "留意临界值与单位混用" },
  { id: 4, title: "录入备注说明", desc: "记录家长改口等特殊情况" },
  { id: 5, title: "提交核销确认", desc: "最终确认并扣减余额" },
];
