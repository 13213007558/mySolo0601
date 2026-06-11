export enum SaffronGrade {
  GRADE_S = 'S',
  GRADE_A = 'A',
  GRADE_B = 'B',
  GRADE_C = 'C',
  GRADE_D = 'D',
  GRADE_E = 'E',
  GRADE_F = 'F',
}

export interface LAB {
  L: number;
  a: number;
  b: number;
}

export interface ColorCard {
  id: string;
  grade: SaffronGrade;
  labColor: LAB;
  hexColor: string;
  description: string;
  gradeLabel: string;
  maxDeltaE: number;
}

export interface SilkRecord {
  id: string;
  batchId: string;
  serialNumber: number;
  selectedGrade: SaffronGrade;
  actualGrade: SaffronGrade;
  deltaE: number;
  isWithinThreshold: boolean;
  labColor: LAB;
  photoDataUrl?: string;
  supplierLotNo: string;
  inspectorId: string;
  inspectorName: string;
  inspectedAt: string;
  remark?: string;
}

export type BatchStatus =
  | 'PENDING'
  | 'INSPECTING'
  | 'INSPECTED'
  | 'DEGRADED'
  | 'RETURNED';

export interface BatchInfo {
  id: string;
  batchNo: string;
  supplierId: string;
  supplierName: string;
  supplierContact: string;
  arrivalDate: string;
  totalQuantity: number;
  inspectedCount: number;
  expectedGrade: SaffronGrade;
  gradeDistribution: Record<SaffronGrade, number>;
  avgDeltaE: number;
  maxDeltaE: number;
  outOfThresholdCount: number;
  status: BatchStatus;
  createdAt: string;
  createdBy: string;
}

export type ReturnOrderStatus =
  | 'PENDING_APPROVAL'
  | 'FIRST_APPROVED'
  | 'FINAL_APPROVED'
  | 'LOCKED'
  | 'EFFECTIVE'
  | 'REJECTED';

export interface ReturnOrder {
  id: string;
  returnNo: string;
  batchId: string;
  batchNo: string;
  supplierName: string;
  originalGrade: SaffronGrade;
  degradedToGrade: SaffronGrade;
  degradationReason: string;
  avgDeltaE: number;
  maxDeltaE: number;
  outOfThresholdCount: number;
  totalCount: number;
  applicantId: string;
  applicantName: string;
  approverId?: string;
  approverName?: string;
  secondApproverId?: string;
  secondApproverName?: string;
  applicantSignDataUrl?: string;
  approverSignDataUrl?: string;
  secondApproverSignDataUrl?: string;
  status: ReturnOrderStatus;
  rejectReason?: string;
  createdAt: string;
  firstApprovedAt?: string;
  finalApprovedAt?: string;
  irrevocableUntil: string;
  effectiveAt?: string;
}

export type UserRole = 'INSPECTOR' | 'SUPERVISOR' | 'MANAGER';

export interface User {
  id: string;
  employeeNo: string;
  name: string;
  role: UserRole;
  signDataUrl?: string;
}

export type Language = 'zh' | 'en' | 'hi';

export interface AppSettings {
  darkboxMode: boolean;
  language: Language;
  screenBrightness: number;
  ambientLightAlertThreshold: number;
  requireDualApproval: boolean;
  lockHours: number;
}
