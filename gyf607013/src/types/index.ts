export type UserRole = 'staff' | 'nurse' | 'supervisor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export type DisinfectionStatus = 'pending' | 'processing' | 'completed' | 'exception';

export type RecordSource = 'scan' | 'manual';

export interface DisinfectionRecord {
  id: string;
  babyId: string;
  classId: string;
  itemName: string;
  scheduledTime: string;
  actualTime?: string;
  status: DisinfectionStatus;
  temperature: number;
  duration: number;
  operatorId?: string;
  operatorName?: string;
  handlerId?: string;
  handlerName?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  exceptionNote?: string;
  source: RecordSource;
  isBoundaryAudit?: boolean;
  boundaryReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Baby {
  id: string;
  name: string;
  classId: string;
  birthday: string;
  allergies?: string;
  guardianPhone?: string;
  guardianName?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  babyCount: number;
  completionRate: number;
  exceptionCount: number;
}

export interface AuditLog {
  id: string;
  recordId: string;
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  operatorId: string;
  operatorName: string;
  operatedAt: string;
  isBoundaryAudit?: boolean;
}

export interface ExportResult {
  success: boolean;
  totalCount: number;
  successCount: number;
  failedCount: number;
  failedItems: Array<{ rowIndex: number; reason: string }>;
  dataUrl?: string;
  data?: unknown[];
  format: 'csv' | 'json';
}

export interface ScanRecord {
  id: string;
  recordId: string;
  action: 'borrow' | 'return' | 'process';
  operatorId: string;
  operatorName: string;
  timestamp: string;
  itemName: string;
  status?: string;
  handlerName?: string;
}

export interface FollowUpNote {
  id: string;
  babyId: string;
  content: string;
  nextFollowUp?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}
