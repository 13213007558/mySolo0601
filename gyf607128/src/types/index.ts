export type LedgerStatus = 'normal' | 'withdrawn' | 'pending';

export type OperationType = 'batch_withdraw' | 'batch_modify' | 'single_edit';

export interface CarbonLedger {
  id: string;
  date: string;
  building: string;
  electricity: number;
  gas: number;
  carbonEmission: number;
  emissionFactor: string;
  status: LedgerStatus;
  withdrawReason: string;
  handler: string;
  plainTip: string;
  selected: boolean;
  isManualEntry: boolean;
  originalCarbonEmission: number;
  originalEmissionFactor: string;
  manualEntryNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmissionFactorNote {
  id: string;
  factorName: string;
  oldValue: number;
  newValue: number;
  operator: string;
  reason: string;
  entryTime: string;
  source: string;
}

export interface OperationHistory {
  id: string;
  operationType: OperationType;
  affectedIds: string[];
  operator: string;
  operationTime: string;
  reason: string;
  originalValues: Record<string, Partial<CarbonLedger>>;
  newValues: Record<string, Partial<CarbonLedger>>;
  canRollback: false;
}

export interface ExportSummary {
  totalCount: number;
  withdrawnCount: number;
  pendingCount: number;
  normalCount: number;
  reasons: { reason: string; count: number }[];
  handlers: { name: string; count: number }[];
  pendingRecords: CarbonLedger[];
  emissionFactorNote: EmissionFactorNote | null;
  exportTime: string;
  exportBy: string;
}

export interface LedgerStore {
  ledgers: CarbonLedger[];
  operationHistories: OperationHistory[];
  emissionFactorNote: EmissionFactorNote | null;
  highlightedRowId: string | null;
  currentUser: string;
  setLedgers: (ledgers: CarbonLedger[]) => void;
  toggleSelected: (id: string) => void;
  selectAll: (selected: boolean) => void;
  updateWithdrawReason: (id: string, reason: string) => void;
  updateStatus: (id: string, status: LedgerStatus) => void;
  batchWithdraw: (ids: string[], reason: string) => void;
  batchModifyEmission: (ids: string[], factor: string, emission: number) => void;
  setHighlightedRowId: (id: string | null) => void;
  addOperationHistory: (history: OperationHistory) => void;
  importLedgers: (ledgers: CarbonLedger[]) => void;
}

export const WITHDRAW_REASON_TIP_MAP: Record<string, string> = {
  '数据异常': '该记录数据超出正常波动范围，已撤回等待核实',
  '仪表故障': '计量仪表出现故障，读数不准确，已撤回',
  '抄表错误': '人工抄录时出现错误，已撤回更正',
  '排放因子变更': '排放因子更新，重新计算排放量',
  '重复录入': '该记录重复录入，已撤回删除',
  '待核实': '数据存在疑问，待进一步核实后确认',
  '领导要求': '根据领导指示临时撤回',
  '系统问题': '系统计算异常，已撤回重新处理',
  '韩工补录修正': '韩工手工补录排放因子后修正的记录',
  '默认': '该记录已被撤回，请联系处理人了解详情',
};

export const STATUS_TEXT_MAP: Record<LedgerStatus, string> = {
  normal: '正常',
  withdrawn: '已撤回',
  pending: '待拍板',
};

export const OPERATION_TYPE_TEXT_MAP: Record<OperationType, string> = {
  batch_withdraw: '批量撤回',
  batch_modify: '批量修改',
  single_edit: '单个编辑',
};
