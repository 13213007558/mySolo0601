export type PumpStatus = 'normal' | 'abnormal' | 'warning' | 'empty';

export interface PumpRecord {
  id: string;
  pumpCode: string;
  pumpName: string;
  location: string;
  status: PumpStatus;
  temperature: number | null;
  pressure: number | null;
  flowRate: number | null;
  vibration: number | null;
  runningHours: number | null;
  lastMaintenance: string | null;
  inspector: string | null;
  inspectionTime: string;
  remarks: string | null;
  source: 'system' | 'manual' | 'import';
  manualEntry?: boolean;
  startStopLogs?: StartStopLog[];
}

export interface StartStopLog {
  timestamp: string;
  action: 'start' | 'stop';
  operator: string;
  reason?: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  type: 'inspection' | 'status_change' | 'maintenance' | 'manual_entry' | 'start_stop';
  title: string;
  description: string;
  pumpCode: string;
  operator?: string;
}

export interface ImportResult {
  success: number;
  skipped: number;
  errors: ImportError[];
  totalProcessed: number;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  originalValue: unknown;
}

export type DataMode = 'normal' | 'abnormal' | 'empty';
