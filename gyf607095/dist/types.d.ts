export type Role = 'reception' | 'therapist' | 'supervisor';
export interface User {
    id: string;
    name: string;
    role: Role;
    username: string;
}
export interface Child {
    id: string;
    name: string;
    birthDate: string;
    guardianName: string;
    guardianPhone: string;
    balance: number;
    createdAt: string;
    isDeleted: boolean;
}
export interface Course {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    type: 'rehabilitation' | 'cleaning' | 'evaluation';
    isActive: boolean;
}
export interface CourseSchedule {
    id: string;
    childId: string;
    courseId: string;
    therapistId: string;
    scheduledAt: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    feedback?: string;
    feedbackUpdatedAt?: string;
    feedbackVersion?: number;
    isManualEntry: boolean;
    manualEntryReason?: string;
    createdAt: string;
}
export interface Photo {
    id: string;
    scheduleId: string;
    uploadedAt: string;
    uploadedBy: string;
    url: string;
    isMissing: boolean;
}
export type VerificationStatus = 'pending' | 'success' | 'partial' | 'failed';
export type WriteOffStatus = 'pending' | 'verified' | 'completed' | 'exception';
export interface WriteOffRecord {
    id: string;
    scheduleId: string;
    childId: string;
    courseId: string;
    amount: number;
    deductionAmount: number;
    status: WriteOffStatus;
    verificationStatus: VerificationStatus;
    hasPhoto: boolean;
    missingPhotoIds: string[];
    exceptionReason?: string;
    operatorId: string;
    verifiedBy?: string;
    verifiedAt?: string;
    createdAt: string;
    completedAt?: string;
    isAudited: boolean;
    auditNote?: string;
    auditBy?: string;
    auditAt?: string;
    isInvalid: boolean;
    invalidReason?: string;
    invalidAt?: string;
    batchId: string;
}
export interface AuditLog {
    id: string;
    operatorId: string;
    operatorName: string;
    operatorRole: Role;
    action: string;
    targetType: string;
    targetId: string;
    oldValue?: any;
    newValue?: any;
    note?: string;
    createdAt: string;
    ipAddress?: string;
}
export interface BalanceTransaction {
    id: string;
    childId: string;
    writeOffRecordId?: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    type: 'recharge' | 'deduct' | 'refund' | 'adjust';
    operatorId: string;
    note?: string;
    createdAt: string;
    isInvalid: boolean;
}
export interface ImportBatch {
    id: string;
    importedAt: string;
    importedBy: string;
    recordCount: number;
    sourceFile: string;
    isReimport: boolean;
    previousBatchId?: string;
    invalidatedOldRecords: string[];
}
export interface ReceptionStep {
    id: string;
    order: number;
    title: string;
    description: string;
    keyActions: string[];
    checks: string[];
    commonMistakes: string[];
}
export interface SettlementSummary {
    totalCount: number;
    successCount: number;
    partialSuccessCount: number;
    exceptionCount: number;
    totalAmount: number;
    deductedAmount: number;
    pendingAuditCount: number;
}
export interface SupervisorView extends SettlementSummary {
    auditTrail: AuditLog[];
    exceptionDetails: WriteOffRecord[];
    manualEntryRecords: WriteOffRecord[];
}
export interface ReceptionView {
    summary: SettlementSummary;
    pendingRecords: WriteOffRecord[];
    steps: ReceptionStep[];
}
