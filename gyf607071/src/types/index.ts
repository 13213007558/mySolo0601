export type UserRole = 'elder' | 'parent' | 'manager' | 'supervisor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  familyBabyIds?: string[];
}

export type BabyStatus = 'normal' | 'warning' | 'absent' | 'cross';

export type DataQuality = 'normal' | 'empty' | 'dirty';

export interface Baby {
  id: string;
  name: string;
  avatar?: string;
  className: string;
  status: BabyStatus;
  date: string;
  temperatureSummary?: string;
  checkInTime?: string;
  dataQuality: DataQuality;
  crossClassInfo?: CrossClassRecord;
  supplementRecords?: SupplementRecord[];
}

export interface TemperatureRecord {
  id: string;
  babyId: string;
  value: number;
  time: string;
  source: 'thermometer' | 'manual' | 'unknown';
  deviceId?: string;
}

export interface LeaveRecord {
  id: string;
  babyId: string;
  date: string;
  reason: string;
  photoUrl: string;
  submitTime: string;
  submitter: string;
}

export interface CrossClassRecord {
  id: string;
  babyId: string;
  fromClass: string;
  toClass: string;
  status: 'partial_success' | 'success' | 'failed';
  transferTime: string;
  message?: string;
}

export interface SupplementRecord {
  id: string;
  babyId: string;
  field: string;
  beforeValue: string;
  afterValue: string;
  operator: string;
  operatorRole: UserRole;
  time: string;
  reason: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'view_detail' | 'view_photo' | 'export' | 'supplement' | 'unauthorized_access';
  targetId?: string;
  targetName?: string;
  time: string;
  result: 'success' | 'denied' | 'partial';
  detail?: string;
}

export interface ExportTableRow {
  babyName: string;
  className: string;
  status: string;
  temperature: string;
  date: string;
}
