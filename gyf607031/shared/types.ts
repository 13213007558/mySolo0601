export type DataStatus = 'empty' | 'dirty' | 'normal';

export interface TemperatureRecord {
  id: string;
  babyId: string;
  temperature: number;
  measureTime: string;
  deviceId: string;
  operator: string;
  source: 'gun' | 'manual';
}

export interface LeaveRecord {
  id: string;
  babyId: string;
  leaveDate: string;
  reason: string;
  photoUrl: string;
  operator: string;
  createdAt: string;
}

export interface NoteHistoryItem {
  id: string;
  content: string;
  operator: string;
  createdAt: string;
  source: 'original' | 'advisor';
}

export interface Baby {
  id: string;
  name: string;
  phone: string;
  phoneValid: boolean;
  room: string;
  className: string;
  checkStatus: 'pending' | 'reviewed' | 'confirmed';
  temperatures: TemperatureRecord[];
  leaves: LeaveRecord[];
  notes: NoteHistoryItem[];
  isManual: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: 'export' | 'view' | 'edit' | 'create' | 'import';
  targetType: 'baby' | 'temperature' | 'note' | 'leave';
  targetId: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  operator: string;
  timestamp: string;
  privacyLeak?: boolean;
  reason?: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  status: DataStatus;
  items: {
    row: number;
    name: string;
    phone: string;
    success: boolean;
    reason?: string;
  }[];
}
