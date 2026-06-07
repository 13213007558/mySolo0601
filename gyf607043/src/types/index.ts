export type Role = 'nurse' | 'supervisor' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  employeeNo: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  babyCount: number;
  todayAnomalyCount: number;
  lastUpdatedAt: string;
}

export interface Baby {
  id: string;
  classId: string;
  name: string;
  bedNo: string;
  motherName?: string;
  allergies: string[];
  avatar: string;
  admissionDate: string;
}

export type RecordStatus =
  | 'confirmed'
  | 'withdrawn'
  | 'pending_review'
  | 'anomaly_resolved';

export type ItemType =
  | 'feeding_bottle'
  | 'pacifier'
  | 'toy'
  | 'clothing'
  | 'bedding';

export type DisinfectionMethod = 'high_temp' | 'uv' | 'chemical' | 'steam';

export interface Correction {
  id: string;
  recordId: string;
  description: string;
  photos: string[];
  correctedBy: string;
  correctedAt: string;
}

export interface DisinfectionRecord {
  id: string;
  babyId: string;
  itemType: ItemType;
  disinfectionMethod: DisinfectionMethod;
  operatorId: string;
  operatedAt: string;
  photoUrl?: string;
  photoRemark?: string;
  status: RecordStatus;
  isManual: boolean;
  manualCreatedBy?: string;
  manualCreatedAt?: string;
  originalRecordId?: string;
  correction?: Correction;
  anomalyId?: string;
}

export type AnomalyType =
  | 'reissue_unclean'
  | 'missing_photo'
  | 'appointment_conflict'
  | 'wrong_item';

export type AnomalySeverity = 'high' | 'medium' | 'low';

export type AnomalyStatus = 'pending' | 'resolved' | 'partial_resolved';

export interface Anomaly {
  id: string;
  recordId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  status: AnomalyStatus;
  createdAt: string;
  resolvedAt?: string;
  resolverId?: string;
  resolutionNote?: string;
  conflictedRecordIds?: string[];
}

export type AuditAction =
  | 'create'
  | 'confirm'
  | 'withdraw'
  | 'correct'
  | 'manual_create'
  | 'anomaly_resolve';

export interface AuditLog {
  id: string;
  recordId: string;
  action: AuditAction;
  operatorId: string;
  operatorRole: Role;
  timestamp: string;
  reason?: string;
  beforeSnapshot?: Partial<DisinfectionRecord>;
  afterSnapshot?: Partial<DisinfectionRecord>;
}

export interface ResolveAnomalyResult {
  success: boolean;
  resolvedIds: string[];
  conflictedIds: string[];
  message: string;
}
