export type BabyGender = 'male' | 'female';

export type CheckStatus =
  | 'pending'
  | 'confirmed'
  | 'recheck_required'
  | 'leave'
  | 'absent'
  | 'withdrawn';

export type RecordSource = 'thermometer' | 'manual' | 'import';

export type DataQuality = 'empty' | 'dirty' | 'normal';

export interface Baby {
  id: string;
  name: string;
  nickname?: string;
  gender: BabyGender;
  ageMonths: number;
  className: string;
  parentName: string;
  parentPhone: string;
  avatarColor: string;
  joinDate: string;
  allergies?: string[];
}

export interface ThermometerRawRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  babyId: string;
  temperature: number;
  measuredAt: string;
  operatorName?: string;
  rawRemark?: string;
  photoUrl?: string;
}

export interface LeaveRequest {
  id: string;
  babyId: string;
  leaveType: 'sick' | 'personal' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
  photoUrls: string[];
  submittedBy: string;
  submittedAt: string;
  approved: boolean;
}

export interface Appointment {
  id: string;
  babyId: string;
  scheduledAt: string;
  type: 'morning_check' | 'review' | 'vaccination';
  status: 'booked' | 'done' | 'cancelled' | 'conflicted';
  conflictWith?: string;
  createdBy: string;
  createdAt: string;
}

export interface MorningCheckRecord {
  id: string;
  babyId: string;
  checkDate: string;
  temperature?: number;
  status: CheckStatus;
  remark?: string;
  quickNote?: string;
  source: RecordSource;
  thermometerRecordIds: string[];
  leaveRequestId?: string;
  appointmentId?: string;
  operator: string;
  confirmedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isManualSupplement?: boolean;
  supplementBeforeSnapshot?: Partial<MorningCheckRecord>;
  dataQuality: DataQuality;
  dirtyReason?: string;
}

export interface AuditLog {
  id: string;
  action:
    | 'create'
    | 'update'
    | 'confirm'
    | 'withdraw'
    | 'supplement'
    | 'export'
    | 'review';
  targetType: 'morning_check' | 'appointment' | 'baby';
  targetId: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  operator: string;
  operatedAt: string;
  reason?: string;
}

export interface BatchOperationResult {
  success: number;
  failed: number;
  total: number;
  details: Array<{
    id: string;
    babyName: string;
    ok: boolean;
    reason?: string;
  }>;
}
