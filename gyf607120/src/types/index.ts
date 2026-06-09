export interface PaymentFlow {
  id: string;
  plateNumber: string;
  gunNo: string;
  amount: number;
  transactionTime: string;
  remark: string;
  paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded';
  hasRefundMark: boolean;
  trialReportDate: string | null;
  paymentRemarkDate: string | null;
  status: 'normal' | 'anomaly' | 'pending';
  anomalyType: string | null;
  driverName: string;
  chargeDuration: number;
  startSoc: number;
  endSoc: number;
}

export interface GunInfo {
  gunNo: string;
  stationId: string;
  status: 'available' | 'occupied' | 'maintenance';
  power: number;
  lastUsedTime: string;
  todayUsageCount: number;
}

export interface RefundRecord {
  id: string;
  paymentFlowId: string;
  refundAmount: number;
  refundReason: string;
  refundTime: string;
  operator: string;
  recalculationNote: string;
}

export interface DriverQueue {
  id: string;
  plateNumber: string;
  driverName: string;
  queuePosition: number;
  joinTime: string;
  expectedGunNo: string;
  status: 'waiting' | 'charging' | 'completed' | 'cancelled';
  waitDuration: number;
}

export interface SupplementRecord {
  id: string;
  paymentFlowId: string;
  operatorName: string;
  beforeRemark: string;
  afterRemark: string;
  operateTime: string;
  reason: string;
}

export interface ImportHistory {
  id: string;
  fileName: string;
  importTime: string;
  operator: string;
  totalRecords: number;
  duplicateRecords: number;
  validNewRecords: number;
  returnedRecords: number;
  status: 'completed' | 'partial' | 'returned';
  returnedReasons: string[];
}

export interface FilterConditions {
  plateNumber: string[];
  paymentRemark: string;
  hasRefundMark: boolean | null;
  gunNo: string[];
  dateRange: [string, string] | null;
  status: string[];
}

export interface ReconciliationState {
  currentSample: 'normal' | 'anomaly' | 'empty';
  paymentFlows: PaymentFlow[];
  filteredFlows: PaymentFlow[];
  gunInfos: GunInfo[];
  refundRecords: RefundRecord[];
  driverQueues: DriverQueue[];
  supplementRecords: SupplementRecord[];
  importHistories: ImportHistory[];
  filters: FilterConditions;
  chartFiltersApplied: boolean;
  unappliedFilterReasons: string[];
  selectedFlowId: string | null;
  showSupplementDiff: boolean;
}

export interface SampleDataset {
  paymentFlows: PaymentFlow[];
  gunInfos: GunInfo[];
  refundRecords: RefundRecord[];
  driverQueues: DriverQueue[];
}

export interface ImportCheckResult {
  duplicates: PaymentFlow[];
  validNew: PaymentFlow[];
  needReturn: PaymentFlow[];
  returnReasons: string[];
}

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}
