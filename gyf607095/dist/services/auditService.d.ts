import { User, AuditLog, WriteOffRecord } from '../types';
export declare class AuditService {
    logAction(operator: User, action: string, targetType: string, targetId: string, note?: string, oldValue?: any, newValue?: any): AuditLog;
    logWriteOffCreation(operator: User, record: WriteOffRecord): void;
    logWriteOffVerification(operator: User, record: WriteOffRecord, oldStatus: string): void;
    logWriteOffPartialSuccess(operator: User, record: WriteOffRecord, missingPhotos: string[]): void;
    logWriteOffException(operator: User, record: WriteOffRecord, reason: string): void;
    logWriteOffAudit(operator: User, record: WriteOffRecord, auditNote: string): void;
    logBalanceDeduction(operator: User, childId: string, amount: number, balanceBefore: number, balanceAfter: number): void;
    logInvalidateRecord(operator: User, record: WriteOffRecord, reason: string): void;
    logImport(operator: User, batchId: string, recordCount: number, isReimport: boolean): void;
    logFeedbackUpdate(operator: User, scheduleId: string, version: number, feedback: string): void;
    logManualEntry(operator: User, scheduleId: string, reason: string): void;
    getAuditTrail(targetId?: string, targetType?: string): AuditLog[];
    getWriteOffAuditInfo(recordId: string): {
        hasAuditTrail: boolean;
        auditLogs: AuditLog[];
    };
}
export declare const auditService: AuditService;
