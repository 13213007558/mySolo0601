import { db } from '@/db';
import { AuditAction, AuditLog, RecordStatus } from '@/types';

export const AuditService = {
  async logAction(params: {
    recordId: string;
    action: AuditAction;
    operatorId: string;
    operatorName: string;
    note?: string;
    oldStatus?: RecordStatus;
    newStatus?: RecordStatus;
  }): Promise<string> {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const log: AuditLog = {
      id,
      recordId: params.recordId,
      action: params.action,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      note: params.note,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      createdAt: new Date().toISOString(),
    };
    await db.audit_logs.add(log);
    return id;
  },

  async getLogsByRecord(recordId: string): Promise<AuditLog[]> {
    const logs = await db.audit_logs
      .where('recordId')
      .equals(recordId)
      .reverse()
      .sortBy('createdAt');
    return logs;
  },

  async getLogsByOperator(operatorId: string): Promise<AuditLog[]> {
    const logs = await db.audit_logs
      .where('operatorId')
      .equals(operatorId)
      .reverse()
      .sortBy('createdAt');
    return logs;
  },
};
