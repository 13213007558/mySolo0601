export interface AmountIssue {
  rawValue: number;
  displayValue: number;
  deviation: number;
  reason: string;
}

export interface ThresholdIssue {
  currentValue: number;
  threshold: number;
  unit: string;
  reason: string;
  historicalRef: string;
}

export type GateStatus = 'normal' | 'abnormal' | 'pending';

export type EmptyStateType = 'no-import' | 'filter-narrow' | 'all-damaged';

export interface GateInspection {
  id: string;
  gateNo: string;
  location: string;
  status: GateStatus;
  inspectionTime: string;
  amount: number;
  amountIssue?: AmountIssue;
  thresholdIssue?: ThresholdIssue;
  passDescription?: string;
  operator?: string;
  isManualEntry?: boolean;
  manualEntryTime?: string;
  originalPassDescription?: string;
}

export type FilterType = 'all' | 'normal' | 'abnormal' | 'pending';

export interface GateStore {
  gates: GateInspection[];
  filter: FilterType;
  emptyStateType: EmptyStateType | null;
  showEmptyState: boolean;
  activeTab: 'dashboard' | 'pass-info';
  selectedGateId: string | null;
  showAmountIssuePanel: boolean;
  showThresholdIssuePanel: boolean;
  showDiffViewer: boolean;
  
  setFilter: (filter: FilterType) => void;
  setActiveTab: (tab: 'dashboard' | 'pass-info') => void;
  setSelectedGateId: (id: string | null) => void;
  setShowAmountIssuePanel: (show: boolean) => void;
  setShowThresholdIssuePanel: (show: boolean) => void;
  setShowDiffViewer: (show: boolean) => void;
  setShowEmptyState: (show: boolean, type?: EmptyStateType) => void;
  updatePassDescription: (gateId: string, description: string, operator: string) => void;
  exportData: () => string;
  importData: (jsonString: string) => { success: boolean; message: string };
  resetData: () => void;
}

export const STORAGE_KEY = 'gate-inspection-data';
