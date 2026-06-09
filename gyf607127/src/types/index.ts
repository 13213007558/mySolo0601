export type DataScene = 'normal' | 'abnormal' | 'empty';

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface DiffItem {
  name: string;
  cardValue: number;
  exportValue: number;
}

export interface DuplicateStation {
  id: string;
  projectName: string;
  address: string;
  certCount: number;
}

export interface Certificate {
  id: string;
  certNo: string;
  power: number;
  scanUrl?: string;
  isManualSupply: boolean;
  suppliedBy?: string;
  supplyTime?: string;
}

export interface MismatchDetail {
  diffItems: DiffItem[];
  reason: string;
}

export interface BatchData {
  id: string;
  batchNo: string;
  stationName: string;
  projectName: string;
  cardCount: number;
  exportCount: number;
  amount: number;
  status: BatchStatus;
  operator: string;
  submitTime: string;
  hasMismatch: boolean;
  hasDuplicateStation: boolean;
  mismatchDetail?: MismatchDetail;
  duplicateStations?: DuplicateStation[];
  certificates: Certificate[];
  consultantNote?: string;
  phone?: string;
  hiddenPhone?: boolean;
}

export interface StatsData {
  total: number;
  abnormal: number;
  pending: number;
  completed: number;
}

export interface SupplyRecord {
  batchId: string;
  beforeData: BatchData;
  afterData: BatchData;
  exportedData: BatchData;
  supplyTime: string;
  suppliedBy: string;
}
