import { User, WriteOffRecord, BalanceTransaction, Child, Photo, VerificationStatus, WriteOffStatus } from '../types';
import { db } from '../models/database';
import { generateId, now } from '../utils';
import { permissionService } from './permissionService';
import { auditService } from './auditService';

export class WriteOffService {
  private checkBalanceSafety(child: Child, deductionAmount: number): void {
    if (child.balance - deductionAmount < 0) {
      throw new Error(`余额不足！当前余额: ¥${child.balance.toFixed(2)}，需扣款: ¥${deductionAmount.toFixed(2)}。月底前请充值，避免余额变负！`);
    }
  }

  private createBalanceTransaction(
    child: Child,
    amount: number,
    type: 'deduct' | 'refund' | 'adjust',
    writeOffRecordId: string,
    operator: User,
    note?: string
  ): BalanceTransaction {
    const balanceBefore = child.balance;
    const balanceAfter = child.balance + (type === 'deduct' ? -amount : amount);

    const transaction: BalanceTransaction = {
      id: generateId('tx'),
      childId: child.id,
      writeOffRecordId,
      amount: type === 'deduct' ? amount : -amount,
      balanceBefore,
      balanceAfter,
      type,
      operatorId: operator.id,
      note,
      createdAt: now(),
      isInvalid: false
    };

    db.balanceTransactions.set(transaction.id, transaction);
    child.balance = balanceAfter;
    db.children.set(child.id, child);

    if (type === 'deduct') {
      auditService.logBalanceDeduction(operator, child.id, amount, balanceBefore, balanceAfter);
    }

    return transaction;
  }

  private verifyPhotos(scheduleId: string): { hasPhoto: boolean; missingPhotoIds: string[]; allPhotos: Photo[] } {
    const allPhotos = Array.from(db.photos.values()).filter(p => p.scheduleId === scheduleId);
    const missingPhotos = allPhotos.filter(p => p.isMissing);
    const hasPhoto = missingPhotos.length === 0 && allPhotos.length > 0;

    return {
      hasPhoto,
      missingPhotoIds: missingPhotos.map(p => p.id),
      allPhotos
    };
  }

  public createWriteOffRecord(
    operator: User,
    scheduleId: string,
    batchId: string
  ): WriteOffRecord {
    permissionService.assertPermission(operator, 'writeOff', 'create');

    const schedule = db.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`课程记录不存在: ${scheduleId}`);
    }

    const child = db.children.get(schedule.childId);
    if (!child) {
      throw new Error(`儿童档案不存在: ${schedule.childId}`);
    }

    const course = db.courses.get(schedule.courseId);
    if (!course) {
      throw new Error(`课程类型不存在: ${schedule.courseId}`);
    }

    const existingRecord = Array.from(db.writeOffRecords.values())
      .find(r => r.scheduleId === scheduleId && !r.isInvalid);
    if (existingRecord) {
      throw new Error(`该课程已有有效核销记录，请勿重复操作: ${existingRecord.id}`);
    }

    const { hasPhoto, missingPhotoIds } = this.verifyPhotos(scheduleId);
    const amount = course.price;
    const deductionAmount = course.price;

    const record: WriteOffRecord = {
      id: generateId('wo'),
      scheduleId,
      childId: schedule.childId,
      courseId: schedule.courseId,
      amount,
      deductionAmount,
      status: 'pending',
      verificationStatus: 'pending',
      hasPhoto,
      missingPhotoIds,
      operatorId: operator.id,
      createdAt: now(),
      isAudited: false,
      isInvalid: false,
      batchId
    };

    db.writeOffRecords.set(record.id, record);
    auditService.logWriteOffCreation(operator, record);

    return record;
  }

  public verifyWriteOff(operator: User, recordId: string): WriteOffRecord {
    permissionService.assertPermission(operator, 'writeOff', 'verify');

    const record = db.writeOffRecords.get(recordId);
    if (!record) {
      throw new Error(`核销记录不存在: ${recordId}`);
    }

    if (record.isInvalid) {
      throw new Error('该记录已作废，无法验证');
    }

    if (record.status !== 'pending') {
      throw new Error(`当前状态 ${record.status} 无法验证`);
    }

    const child = db.children.get(record.childId);
    if (!child) {
      throw new Error(`儿童档案不存在: ${record.childId}`);
    }

    const oldStatus = record.status;
    const { hasPhoto, missingPhotoIds } = this.verifyPhotos(record.scheduleId);

    record.hasPhoto = hasPhoto;
    record.missingPhotoIds = missingPhotoIds;
    record.verifiedBy = operator.id;
    record.verifiedAt = now();

    if (hasPhoto) {
      record.verificationStatus = 'success';
      record.status = 'verified';
    } else if (missingPhotoIds.length > 0 && missingPhotoIds.length < 3) {
      record.verificationStatus = 'partial';
      record.status = 'verified';
      auditService.logWriteOffPartialSuccess(operator, record, missingPhotoIds);
    } else if (missingPhotoIds.length >= 3) {
      record.verificationStatus = 'failed';
      record.status = 'exception';
      record.exceptionReason = `缺失照片过多(${missingPhotoIds.length}张)，请补充后重试`;
      auditService.logWriteOffException(operator, record, record.exceptionReason);
    } else {
      record.verificationStatus = 'failed';
      record.status = 'exception';
      record.exceptionReason = '未找到任何照片记录';
      auditService.logWriteOffException(operator, record, record.exceptionReason);
    }

    db.writeOffRecords.set(record.id, record);
    auditService.logWriteOffVerification(operator, record, oldStatus);

    return record;
  }

  public completeWriteOff(operator: User, recordId: string): WriteOffRecord {
    permissionService.assertPermission(operator, 'settlement', 'process');

    const record = db.writeOffRecords.get(recordId);
    if (!record) {
      throw new Error(`核销记录不存在: ${recordId}`);
    }

    if (record.isInvalid) {
      throw new Error('该记录已作废，无法完成核销');
    }

    if (record.status !== 'verified') {
      throw new Error(`当前状态 ${record.status} 无法完成核销，请先验证`);
    }

    if (record.verificationStatus === 'failed') {
      throw new Error('验证失败的记录无法完成核销，请先处理异常');
    }

    const child = db.children.get(record.childId);
    if (!child) {
      throw new Error(`儿童档案不存在: ${record.childId}`);
    }

    const deductionAmount = record.verificationStatus === 'partial' 
      ? Math.ceil(record.deductionAmount * 0.5) 
      : record.deductionAmount;

    record.deductionAmount = deductionAmount;

    this.checkBalanceSafety(child, deductionAmount);
    this.createBalanceTransaction(child, deductionAmount, 'deduct', record.id, operator, 
      `核销扣费 - ${record.verificationStatus === 'partial' ? '部分成功(50%)' : '全部成功'}`);

    record.status = 'completed';
    record.completedAt = now();

    db.writeOffRecords.set(record.id, record);

    auditService.logAction(
      operator,
      'COMPLETE_WRITEOFF',
      'WriteOffRecord',
      record.id,
      `完成核销，扣款: ¥${deductionAmount.toFixed(2)}${record.verificationStatus === 'partial' ? ' (部分成功减半)' : ''}`,
      { status: 'verified' },
      { status: 'completed', deductionAmount, completedAt: record.completedAt }
    );

    return record;
  }

  public auditRecord(operator: User, recordId: string, auditNote: string): WriteOffRecord {
    permissionService.assertPermission(operator, 'writeOff', 'audit');

    const record = db.writeOffRecords.get(recordId);
    if (!record) {
      throw new Error(`核销记录不存在: ${recordId}`);
    }

    if (record.isAudited) {
      throw new Error('该记录已审计，请勿重复操作');
    }

    record.isAudited = true;
    record.auditNote = auditNote;
    record.auditBy = operator.name;
    record.auditAt = now();

    db.writeOffRecords.set(record.id, record);
    auditService.logWriteOffAudit(operator, record, auditNote);

    return record;
  }

  public invalidateRecord(operator: User, recordId: string, reason: string): WriteOffRecord {
    permissionService.assertPermission(operator, 'writeOff', 'invalidate');

    const record = db.writeOffRecords.get(recordId);
    if (!record) {
      throw new Error(`核销记录不存在: ${recordId}`);
    }

    if (record.isInvalid) {
      throw new Error('该记录已作废');
    }

    record.isInvalid = true;
    record.invalidReason = reason;
    record.invalidAt = now();

    db.writeOffRecords.set(record.id, record);
    auditService.logInvalidateRecord(operator, record, reason);

    if (record.status === 'completed') {
      const child = db.children.get(record.childId);
      if (child) {
        const refundAmount = record.deductionAmount;
        this.createBalanceTransaction(child, refundAmount, 'refund', record.id, operator, `作废记录退款: ${reason}`);
      }
    }

    return record;
  }

  public processBatch(operator: User, scheduleIds: string[], batchId: string): {
    created: WriteOffRecord[];
    verificationResults: WriteOffRecord[];
    completed: WriteOffRecord[];
    failed: WriteOffRecord[];
  } {
    const created: WriteOffRecord[] = [];
    const verificationResults: WriteOffRecord[] = [];
    const completed: WriteOffRecord[] = [];
    const failed: WriteOffRecord[] = [];

    for (const scheduleId of scheduleIds) {
      try {
        const record = this.createWriteOffRecord(operator, scheduleId, batchId);
        created.push(record);

        const verified = this.verifyWriteOff(operator, record.id);
        verificationResults.push(verified);

        if (verified.status === 'verified' && verified.verificationStatus !== 'failed') {
          const completedRecord = this.completeWriteOff(operator, record.id);
          completed.push(completedRecord);
        } else {
          failed.push(verified);
        }
      } catch (error) {
        const lastRecord = created[created.length - 1];
        if (lastRecord) {
          lastRecord.status = 'exception';
          lastRecord.exceptionReason = error instanceof Error ? error.message : '未知错误';
          failed.push(lastRecord);
        }
      }
    }

    return { created, verificationResults, completed, failed };
  }

  public getWriteOffRecords(childId?: string, includeInvalid: boolean = false): WriteOffRecord[] {
    let records = Array.from(db.writeOffRecords.values());
    if (childId) {
      records = records.filter(r => r.childId === childId);
    }
    if (!includeInvalid) {
      records = records.filter(r => !r.isInvalid);
    }
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPendingRecords(operator: User): WriteOffRecord[] {
    permissionService.assertPermission(operator, 'writeOff', 'view');
    const allRecords = this.getWriteOffRecords();
    return permissionService.filterRecordsByRole(operator, allRecords)
      .filter(r => r.status === 'pending' || r.status === 'verified');
  }
}

export const writeOffService = new WriteOffService();
