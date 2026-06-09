export type ErrorType = 'missing_data' | 'format_error' | 'status_conflict' | 'angle_abnormal';

export type RecordStatus = 'pending' | 'processed' | 'problem' | 'manual';

export type PageStatus =
  | 'normal'
  | 'empty'
  | 'all_problem'
  | 'state_lost'
  | 'only_problem'
  | 'loading';

export interface BracketRecord {
  id: string;
  bracketNo: string;
  installDate: string;
  location: string;
  currentAngle: number;
  targetAngle: number;
  handler: string;
  processDate: string;
  status: RecordStatus;
  version: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemRecord extends BracketRecord {
  errorType: ErrorType;
  errorDetail: string;
  isResolved: boolean;
  resolveNote: string;
}

export interface ManualAngleRecord {
  id: string;
  bracketNo: string;
  originalAngle: number;
  correctedAngle: number;
  difference: number;
  operator: string;
  operateDate: string;
  reason: string;
  version: string;
}

export interface FilterParams {
  bracketId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  handler?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  highlight?: string;
}

export interface ExportConfig {
  format: 'csv' | 'markdown';
  includeNormal: boolean;
  includeProblem: boolean;
  includeManual: boolean;
  filterParams: FilterParams;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  errorType?: ErrorType;
}

export interface ImportResult {
  success: boolean;
  normalCount: number;
  problemCount: number;
  totalCount: number;
  message: string;
}

export interface DiffResult {
  field: string;
  original: number | string;
  corrected: number | string;
  difference: number | string;
}

export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  missing_data: '数据缺失',
  format_error: '格式错误',
  status_conflict: '状态冲突',
  angle_abnormal: '角度异常',
};

export const STATUS_LABELS: Record<RecordStatus, string> = {
  pending: '待处理',
  processed: '已处理',
  problem: '有问题',
  manual: '手工补录',
};
