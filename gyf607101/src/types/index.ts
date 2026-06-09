export type InverterStatus = 'normal' | 'warning' | 'error';
export type ConclusionStatus = 'passed' | 'failed' | 'pending';
export type DataSource = 'auto' | 'manual';
export type SupplementStatus = 'pending' | 'completed' | 'delayed';

export interface StringTemperature {
  id: string;
  inverterId: string;
  stringNo: number;
  temperature: number;
  remark: string;
  recorder: string;
  recordTime: string;
  source: DataSource;
  originalTemperature?: number;
  originalRemark?: string;
}

export interface SupplementRecord {
  id: string;
  inverterId: string;
  materialType: string;
  reason: string;
  handler: string;
  submitTime: string;
  status: SupplementStatus;
}

export interface Inverter {
  id: string;
  name: string;
  model: string;
  status: InverterStatus;
  conclusion: ConclusionStatus;
  handler: string;
  isPending: boolean;
  pendingReason?: string;
  stringTemperatures: StringTemperature[];
  supplementRecords: SupplementRecord[];
}

export interface OriginalSnapshot {
  id: string;
  inverterId: string;
  originalData: StringTemperature[];
  snapshotTime: string;
}

export interface ExportSummary {
  totalCount: number;
  abnormalCount: number;
  passedCount: number;
  pendingCount: number;
  reasons: { reason: string; count: number }[];
  handlers: { name: string; count: number }[];
  pendingRecords: { inverterName: string; reason: string; handler: string }[];
  exportTime: string;
}

export interface InverterStore {
  inverters: Inverter[];
  snapshots: OriginalSnapshot[];
  userSupplements: SupplementRecord[];
  closedTips: string[];
  initData: () => void;
  addSupplement: (record: SupplementRecord) => void;
  createSnapshot: (inverterId: string) => void;
  getSnapshot: (inverterId: string) => OriginalSnapshot | undefined;
  closeTip: (tipId: string) => void;
  isTipClosed: (tipId: string) => boolean;
}
