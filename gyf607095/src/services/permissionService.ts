import { User, Role, WriteOffRecord, ReceptionView, SupervisorView, SettlementSummary, ReceptionStep, AuditLog } from '../types';
import { db } from '../models/database';

export class PermissionService {
  public hasPermission(user: User, resource: string, action: string): boolean {
    const permissions: Record<Role, Record<string, string[]>> = {
      reception: {
        writeOff: ['create', 'view', 'verify'],
        child: ['view', 'search'],
        schedule: ['view'],
        settlement: ['view', 'process'],
        step: ['view'],
        audit: ['view_summary']
      },
      therapist: {
        schedule: ['view', 'complete', 'addFeedback'],
        child: ['view'],
        writeOff: ['view']
      },
      supervisor: {
        writeOff: ['view', 'audit', 'invalidate', 'view_all'],
        audit: ['view', 'view_all'],
        child: ['view', 'edit', 'create'],
        course: ['view', 'edit', 'create'],
        settlement: ['view', 'view_all', 'audit'],
        import: ['import', 'reimport'],
        manual: ['create', 'view']
      }
    };

    const rolePermissions = permissions[user.role];
    if (!rolePermissions) return false;

    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action);
  }

  public filterRecordsByRole(user: User, records: WriteOffRecord[]): WriteOffRecord[] {
    if (user.role === 'supervisor') {
      return records;
    }
    return records.filter(r => !r.isInvalid);
  }

  public calculateSettlementSummary(records: WriteOffRecord[]): SettlementSummary {
    const validRecords = records.filter(r => !r.isInvalid);
    const successCount = validRecords.filter(r => r.verificationStatus === 'success' && r.status === 'completed').length;
    const partialSuccessCount = validRecords.filter(r => r.verificationStatus === 'partial' && r.status === 'completed').length;
    const exceptionCount = validRecords.filter(r => r.status === 'exception').length;
    
    const totalAmount = validRecords.reduce((sum, r) => sum + r.amount, 0);
    const deductedAmount = validRecords.reduce((sum, r) => sum + r.deductionAmount, 0);
    const pendingAuditCount = validRecords.filter(r => r.status !== 'completed' && !r.isAudited).length;

    return {
      totalCount: validRecords.length,
      successCount,
      partialSuccessCount,
      exceptionCount,
      totalAmount,
      deductedAmount,
      pendingAuditCount
    };
  }

  public getReceptionView(user: User, pendingRecords: WriteOffRecord[], steps: ReceptionStep[]): ReceptionView {
    if (user.role !== 'reception' && user.role !== 'supervisor') {
      throw new Error('无权限访问前台视图');
    }

    const viewableRecords = this.filterRecordsByRole(user, pendingRecords);
    const summary = this.calculateSettlementSummary(viewableRecords);

    return {
      summary,
      pendingRecords: viewableRecords.filter(r => r.status === 'pending' || r.status === 'verified'),
      steps
    };
  }

  public getSupervisorView(user: User, allRecords: WriteOffRecord[], auditTrail: AuditLog[]): SupervisorView {
    if (user.role !== 'supervisor') {
      throw new Error('无权限访问主管视图');
    }

    const validRecords = this.filterRecordsByRole(user, allRecords);
    const summary = this.calculateSettlementSummary(validRecords);

    return {
      ...summary,
      auditTrail: auditTrail.slice(-50),
      exceptionDetails: validRecords.filter(r => r.status === 'exception' || r.verificationStatus === 'partial'),
      manualEntryRecords: validRecords.filter(r => {
        const schedule = db.schedules.get(r.scheduleId);
        return schedule?.isManualEntry;
      })
    };
  }

  public assertPermission(user: User, resource: string, action: string): void {
    if (!this.hasPermission(user, resource, action)) {
      throw new Error(`用户 ${user.name} (${user.role}) 无权限执行 ${action} 操作于 ${resource}`);
    }
  }
}

export const permissionService = new PermissionService();
