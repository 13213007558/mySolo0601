import { User, AuditLog, WriteOffRecord } from '../types';
import { db } from '../models/database';
import { generateId, now } from '../utils';

export class AuditService {
  public logAction(
    operator: User,
    action: string,
    targetType: string,
    targetId: string,
    note?: string,
    oldValue?: any,
    newValue?: any
  ): AuditLog {
    const log: AuditLog = {
      id: generateId('audit'),
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      action,
      targetType,
      targetId,
      oldValue,
      newValue,
      note,
      createdAt: now(),
      ipAddress: '127.0.0.1'
    };
    db.auditLogs.push(log);
    return log;
  }

  public logWriteOffCreation(operator: User, record: WriteOffRecord): void {
    this.logAction(
      operator,
      'CREATE_WRITEOFF',
      'WriteOffRecord',
      record.id,
      `创建核销记录，金额: ¥${record.amount}`,
      undefined,
      record
    );
  }

  public logWriteOffVerification(operator: User, record: WriteOffRecord, oldStatus: string): void {
    this.logAction(
      operator,
      'VERIFY_WRITEOFF',
      'WriteOffRecord',
      record.id,
      `核销记录状态从 ${oldStatus} 变更为 ${record.status}`,
      { status: oldStatus },
      { status: record.status, verificationStatus: record.verificationStatus }
    );
  }

  public logWriteOffPartialSuccess(operator: User, record: WriteOffRecord, missingPhotos: string[]): void {
    this.logAction(
      operator,
      'PARTIAL_SUCCESS',
      'WriteOffRecord',
      record.id,
      `部分成功，缺失照片: ${missingPhotos.join(', ')}。异常纳入汇总但保留审计痕迹。`,
      { hasPhoto: true, verificationStatus: 'success' },
      { hasPhoto: false, verificationStatus: 'partial', missingPhotoIds: missingPhotos }
    );
  }

  public logWriteOffException(operator: User, record: WriteOffRecord, reason: string): void {
    this.logAction(
      operator,
      'MARK_EXCEPTION',
      'WriteOffRecord',
      record.id,
      `标记异常: ${reason}`,
      { status: record.status },
      { status: 'exception', exceptionReason: reason }
    );
  }

  public logWriteOffAudit(operator: User, record: WriteOffRecord, auditNote: string): void {
    this.logAction(
      operator,
      'AUDIT_WRITEOFF',
      'WriteOffRecord',
      record.id,
      `主管审计: ${auditNote}`,
      { isAudited: false },
      { isAudited: true, auditNote, auditBy: operator.name, auditAt: now() }
    );
  }

  public logBalanceDeduction(operator: User, childId: string, amount: number, balanceBefore: number, balanceAfter: number): void {
    this.logAction(
      operator,
      'BALANCE_DEDUCT',
      'Child',
      childId,
      `余额扣款 ¥${amount}，扣款前: ¥${balanceBefore}，扣款后: ¥${balanceAfter}`,
      { balance: balanceBefore },
      { balance: balanceAfter }
    );
  }

  public logInvalidateRecord(operator: User, record: WriteOffRecord, reason: string): void {
    this.logAction(
      operator,
      'INVALIDATE_RECORD',
      'WriteOffRecord',
      record.id,
      `作废记录: ${reason}`,
      { isInvalid: false },
      { isInvalid: true, invalidReason: reason, invalidAt: now() }
    );
  }

  public logImport(operator: User, batchId: string, recordCount: number, isReimport: boolean): void {
    const action = isReimport ? 'REIMPORT_DATA' : 'IMPORT_DATA';
    this.logAction(
      operator,
      action,
      'ImportBatch',
      batchId,
      isReimport ? `重新导入样例数据，共 ${recordCount} 条，旧记录已作废` : `导入样例数据，共 ${recordCount} 条`
    );
  }

  public logFeedbackUpdate(operator: User, scheduleId: string, version: number, feedback: string): void {
    this.logAction(
      operator,
      'UPDATE_FEEDBACK',
      'CourseSchedule',
      scheduleId,
      `更新课后反馈，版本 v${version}`,
      undefined,
      { feedback, feedbackVersion: version, feedbackUpdatedAt: now() }
    );
  }

  public logManualEntry(operator: User, scheduleId: string, reason: string): void {
    this.logAction(
      operator,
      'MANUAL_ENTRY',
      'CourseSchedule',
      scheduleId,
      `手工补录课程记录，原因: ${reason}`
    );
  }

  public getAuditTrail(targetId?: string, targetType?: string): AuditLog[] {
    let logs = [...db.auditLogs];
    if (targetId) {
      logs = logs.filter(l => l.targetId === targetId);
    }
    if (targetType) {
      logs = logs.filter(l => l.targetType === targetType);
    }
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getWriteOffAuditInfo(recordId: string): { hasAuditTrail: boolean; auditLogs: AuditLog[] } {
    const logs = this.getAuditTrail(recordId, 'WriteOffRecord');
    return {
      hasAuditTrail: logs.length > 0,
      auditLogs: logs
    };
  }
}

export const auditService = new AuditService();
