export type ErrorType =
  | 'format_error'
  | 'invalid_reading'
  | 'invalid_time'
  | 'missing_multiplier'
  | 'late_supplement';

export type RecordStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

export type RecordSource = 'csv' | 'excel' | 'manual';

export type OperatorName = '张调度' | '李运维' | '王班长' | '老周' | '系统';

export type LogAction =
  | 'import'
  | 'validate'
  | 'supplement'
  | 'resolve'
  | 'export'
  | 'refresh'
  | 'status_lost'
  | 'multiplier_update'
  | 'operator_change';

export interface MeterRecord {
  id: string;
  meterNo: string;
  reading: number;
  readingTime: Date;
  multiplier: number;
  calculatedValue: number;
  source: RecordSource;
  importedAt: Date;
  operator: OperatorName;
  rowIndex?: number;
}

export interface ProblemRecord extends MeterRecord {
  errorType: ErrorType;
  errorMessage: string;
  status: RecordStatus;
  reviewedBy?: OperatorName;
  reviewedAt?: Date;
  supplementNote?: string;
  lateSupplementReason?: string;
  originalData: Record<string, unknown>;
}

export interface MultiplierConfig {
  id: string;
  meterNo: string;
  multiplier: number;
  effectiveDate: Date;
  expiryDate?: Date;
  enteredBy: 'zhou' | 'system';
  note: string;
  createdAt: Date;
  version: number;
}

export interface OperationLog {
  id: string;
  timestamp: Date;
  operator: OperatorName;
  action: LogAction;
  targetId?: string;
  description: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ReviewSummary {
  generatedAt: Date;
  operator: OperatorName;
  dateRange: {
    start: Date;
    end: Date;
  };
  statistics: {
    totalRecords: number;
    normalRecords: number;
    problemRecords: number;
    pendingRecords: number;
  };
  errorBreakdown: Record<ErrorType, number>;
  pendingItems: ProblemRecord[];
  multiplierChanges: MultiplierConfig[];
  multiplierDifference: {
    before: number;
    after: number;
    percentage: number;
  };
}

export interface ValidationRule {
  field: string;
  validate: (value: unknown, row?: Record<string, unknown>) => boolean;
  errorType: ErrorType;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorType?: ErrorType;
  errorMessage?: string;
}

export interface ParsedRecord {
  meterNo: string;
  reading: number;
  readingTime: string;
  multiplier: number;
  [key: string]: unknown;
}

export interface ParseResult {
  normalRecords: MeterRecord[];
  problemRecords: ProblemRecord[];
  totalCount: number;
  normalCount: number;
  problemCount: number;
}

export interface AppState {
  normalRecords: MeterRecord[];
  problemRecords: ProblemRecord[];
  multipliers: MultiplierConfig[];
  operationLogs: OperationLog[];
  currentOperator: OperatorName;
  lastSavedAt: Date | null;
  lastRefreshReason: string | null;
  isLoading: boolean;
}

export interface AppActions {
  importRecords: (file: File) => Promise<ParseResult>;
  resolveProblem: (
    recordId: string,
    updates: Partial<MeterRecord>,
    note?: string
  ) => void;
  rejectProblem: (recordId: string, reason: string) => void;
  supplementRecord: (
    recordId: string,
    updates: Partial<MeterRecord>,
    reason: string
  ) => void;
  updateMultiplier: (config: Omit<MultiplierConfig, 'id' | 'createdAt' | 'version'>) => void;
  setOperator: (operator: OperatorName) => void;
  generateSummary: () => ReviewSummary;
  exportSummary: () => string;
  exportExcel: () => void;
  saveState: () => void;
  loadState: () => boolean;
  clearState: () => void;
  addLog: (action: LogAction, description: string, reason?: string, metadata?: Record<string, unknown>) => void;
}

export type StoreType = AppState & AppActions;

export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  format_error: '编号格式错误',
  invalid_reading: '读数异常',
  invalid_time: '时间异常',
  missing_multiplier: '倍率缺失',
  late_supplement: '补录晚到',
};

export const STATUS_LABELS: Record<RecordStatus, string> = {
  pending: '待处理',
  reviewing: '复核中',
  resolved: '已解决',
  rejected: '已驳回',
};

export const OPERATORS: OperatorName[] = ['张调度', '李运维', '王班长', '老周', '系统'];
