export type DataStatus = 'normal' | 'dirty' | 'empty' | 'missing_material' | 'pending_review';

export type RectificationStatus = 'pending' | 'in_progress' | 'completed';

export interface Baby {
  id: string;
  name: string;
  gender: 'male' | 'female';
  ageMonths: number;
  roomNumber: string;
  nurseInCharge: string;
  admissionDate: string;
  status: DataStatus;
  latestTemperature: number | null;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemperatureRecord {
  id: string;
  babyId: string;
  temperature: number;
  measureTime: string;
  measuredBy: string;
  deviceId: string;
  isAbnormal: boolean;
  source: 'gun' | 'manual';
  remark: string;
}

export interface LeavePhoto {
  id: string;
  babyId: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  description: string;
  uploadedAt: string;
  uploadedBy: string;
  isMissingPage: boolean;
  missingPageNote: string;
}

export interface RectificationRecord {
  id: string;
  babyId: string;
  problemDescription: string;
  rectificationMeasure: string;
  rectifiedBy: string;
  rectifiedAt: string;
  status: RectificationStatus;
}

export interface ImportAudit {
  id: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  pageCount: number | null;
  actualRecordCount: number | null;
  hasDiscrepancy: boolean;
  discrepancyNote: string;
  failedRecords: Array<{ row: number; reason: string; data: any }>;
}

export interface OperationLog {
  id: string;
  operator: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeChange: any;
  afterChange: any;
  timestamp: string;
}

export interface BabyDetail extends Baby {
  temperatures: TemperatureRecord[];
  photos: LeavePhoto[];
  rectifications: RectificationRecord[];
}

export interface ImportResult {
  auditId: string;
  success: boolean;
  partialSuccess: boolean;
  totalCount: number;
  successCount: number;
  failedCount: number;
  message: string;
  failedRecords: Array<{ row: number; reason: string; data: any }>;
  hasDiscrepancy: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
