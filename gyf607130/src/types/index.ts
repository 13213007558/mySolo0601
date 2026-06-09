export interface Remark {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  type: 'original' | 'new';
}

export interface ForecastRecord {
  id: string;
  deviceNo: string;
  deviceName: string;
  forecastDate: string;
  forecastValue: number;
  revisedValue?: number;
  actualValue: number;
  deviationRate: number;
  status: 'pending' | 'reviewed' | 'withdrawn' | 'approved';
  isAbnormal: boolean;
  hasStatusConflict: boolean;
  createdBy: string;
  updatedBy?: string;
  updatedAt: string;
  remarks: Remark[];
  sourceMaterial?: string;
  isManualEntry?: boolean;
}

export interface ForecastVersion {
  id: string;
  name: string;
  date: string;
  isCurrent: boolean;
}

export interface FilterParams {
  dateRange: [string, string] | null;
  deviceNo: string;
  status: string;
  isAbnormal: boolean | null;
  hasStatusConflict: boolean | null;
  deviationSort: 'asc' | 'desc' | null;
}

export interface ChartDataPoint {
  hour: number;
  forecast: number;
  revised: number;
  actual: number;
  deviation: number;
}

export interface ModalState {
  detail: { open: boolean; record: ForecastRecord | null };
  withdraw: { open: boolean; record: ForecastRecord | null };
  revise: { open: boolean; record: ForecastRecord | null };
}
