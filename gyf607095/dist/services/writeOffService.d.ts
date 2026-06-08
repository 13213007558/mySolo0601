import { User, WriteOffRecord } from '../types';
export declare class WriteOffService {
    private checkBalanceSafety;
    private createBalanceTransaction;
    private verifyPhotos;
    createWriteOffRecord(operator: User, scheduleId: string, batchId: string): WriteOffRecord;
    verifyWriteOff(operator: User, recordId: string): WriteOffRecord;
    completeWriteOff(operator: User, recordId: string): WriteOffRecord;
    auditRecord(operator: User, recordId: string, auditNote: string): WriteOffRecord;
    invalidateRecord(operator: User, recordId: string, reason: string): WriteOffRecord;
    processBatch(operator: User, scheduleIds: string[], batchId: string): {
        created: WriteOffRecord[];
        verificationResults: WriteOffRecord[];
        completed: WriteOffRecord[];
        failed: WriteOffRecord[];
    };
    getWriteOffRecords(childId?: string, includeInvalid?: boolean): WriteOffRecord[];
    getPendingRecords(operator: User): WriteOffRecord[];
}
export declare const writeOffService: WriteOffService;
