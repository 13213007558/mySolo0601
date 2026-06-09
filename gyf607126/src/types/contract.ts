export type ContractStatus = '待审核' | '审核通过' | '异常' | '已退回' | '草稿';

export type AnomalyType = '附件缺失' | '状态冲突' | '金额异常' | '日期错误' | '设备重复' | '其他';

export interface Contract {
  id: string;
  contractNo: string;
  customerName: string;
  customerManager: string;
  deviceId: string;
  deviceName: string;
  contractAmount: number;
  electricityPrice: number;
  contractDate: string;
  effectiveDate: string;
  expiryDate: string;
  status: ContractStatus;
  hasAttachment: boolean;
  attachmentName?: string;
  anomalies: AnomalyType[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  isSupplement: boolean;
  supplementFrom?: string;
  notes?: string;
}

export interface ContractHistory {
  contractId: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface FilterState {
  status: ContractStatus | '';
  customerManager: string;
  hasAnomaly: boolean | null;
  dateRange: DateRange | null;
  searchKeyword: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type EmptyStateType = 'no_data' | 'filtered_empty' | 'corrupted' | 'no_import';
