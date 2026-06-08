import { User, WriteOffRecord, ReceptionView, SupervisorView, SettlementSummary, ReceptionStep, AuditLog } from '../types';
export declare class PermissionService {
    hasPermission(user: User, resource: string, action: string): boolean;
    filterRecordsByRole(user: User, records: WriteOffRecord[]): WriteOffRecord[];
    calculateSettlementSummary(records: WriteOffRecord[]): SettlementSummary;
    getReceptionView(user: User, pendingRecords: WriteOffRecord[], steps: ReceptionStep[]): ReceptionView;
    getSupervisorView(user: User, allRecords: WriteOffRecord[], auditTrail: AuditLog[]): SupervisorView;
    assertPermission(user: User, resource: string, action: string): void;
}
export declare const permissionService: PermissionService;
