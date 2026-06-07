import { db } from '@/db';
import { RescheduleRecord, RecordStatus, User } from '@/types';
import { ValidationService } from '@/services/ValidationService';
import { AuditService } from '@/services/AuditService';
import { AuthService } from '@/services/AuthService';

function generateId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const RecordService = {
  async getAll(filters?: {
    status?: RecordStatus;
    search?: string;
    includeIsolated?: boolean;
    handlerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<RescheduleRecord[]> {
    let records = await db.reschedule_records.toArray();

    if (!filters?.includeIsolated) {
      records = records.filter((r) => !r.isIsolated);
    }
    if (filters?.status) {
      records = records.filter((r) => r.status === filters.status);
    }
    if (filters?.handlerId) {
      records = records.filter((r) => r.handlerId === filters.handlerId);
    }
    if (filters?.startDate) {
      records = records.filter((r) => r.targetDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      records = records.filter((r) => r.targetDate <= filters.endDate!);
    }
    if (filters?.search) {
      const kw = filters.search.toLowerCase().trim();
      records = records.filter(
        (r) =>
          r.babyName.toLowerCase().includes(kw) ||
          r.babyId.toLowerCase().includes(kw) ||
          r.handlerName.toLowerCase().includes(kw) ||
          r.reason.toLowerCase().includes(kw)
      );
    }

    records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return records;
  },

  async getById(id: string): Promise<RescheduleRecord | undefined> {
    return db.reschedule_records.get(id);
  },

  async create(
    data: Partial<RescheduleRecord>,
    operator: User
  ): Promise<RescheduleRecord> {
    const existingRecords = await db.reschedule_records.toArray();
    const { valid, errors, anomaly } = ValidationService.validateRecord(
      data,
      existingRecords
    );

    if (!AuthService.canEditRecord(operator, { ...data } as RescheduleRecord)) {
      if (operator.role !== 'supervisor') {
        throw new Error('当前用户无权创建记录');
      }
    }

    const now = new Date().toISOString();
    const record: RescheduleRecord = {
      id: generateId(),
      babyName: data.babyName || '',
      babyId: data.babyId || '',
      originalShift: data.originalShift || '',
      originalDate: data.originalDate || '',
      targetShift: data.targetShift || '',
      targetDate: data.targetDate || '',
      reason: data.reason || '',
      sourceFileName: data.sourceFileName || '手动录入',
      sourceUploadedAt: data.sourceUploadedAt || now,
      handlerId: data.handlerId || operator.id,
      handlerName: data.handlerName || operator.name,
      status: valid
        ? 'pending'
        : anomaly?.type === 'cross_shift_conflict' || anomaly?.type === 'duplicate_baby'
        ? 'cross_shift'
        : 'bad_data',
      anomaly: anomaly || { type: 'none', message: '无异常' },
      isIsolated: !valid && anomaly?.type === 'missing_required' ? true : false,
      createdAt: now,
      updatedAt: now,
    };

    if (!valid && errors.length > 0) {
      record.latestNote = errors.join('；');
      record.latestNoteAt = now;
      record.latestNoteBy = '系统';
    }

    await db.transaction(
      'rw',
      [db.reschedule_records, db.audit_logs],
      async () => {
        await db.reschedule_records.add(record);
        await AuditService.logAction({
          recordId: record.id,
          action: 'create',
          operatorId: operator.id,
          operatorName: operator.name,
          note: !valid ? errors.join('；') : undefined,
        });
      }
    );

    return record;
  },

  async updateStatus(
    id: string,
    newStatus: RecordStatus,
    operator: User,
    note?: string
  ): Promise<void> {
    const record = await db.reschedule_records.get(id);
    if (!record) throw new Error('记录不存在');

    if (!AuthService.canApprove(operator)) {
      throw new Error('当前用户无权修改状态');
    }

    const oldStatus = record.status;
    const now = new Date().toISOString();

    await db.transaction(
      'rw',
      [db.reschedule_records, db.audit_logs],
      async () => {
        await db.reschedule_records.update(id, {
          status: newStatus,
          updatedAt: now,
          ...(note
            ? { latestNote: note, latestNoteAt: now, latestNoteBy: operator.name }
            : {}),
        });
        await AuditService.logAction({
          recordId: id,
          action: 'update_status',
          operatorId: operator.id,
          operatorName: operator.name,
          note,
          oldStatus,
          newStatus,
        });
      }
    );
  },

  async addNote(
    id: string,
    note: string,
    operator: User
  ): Promise<void> {
    const record = await db.reschedule_records.get(id);
    if (!record) throw new Error('记录不存在');

    const viewPermission = AuthService.canViewRecord(operator, record);
    if (!viewPermission.allowed) {
      await AuthService.logAccessDenied(
        operator,
        record.id,
        record.babyName,
        viewPermission.reason || '无权添加备注'
      );
      throw new Error(viewPermission.reason || '无权添加备注');
    }

    const now = new Date().toISOString();

    await db.transaction(
      'rw',
      [db.reschedule_records, db.audit_logs],
      async () => {
        await db.reschedule_records.update(id, {
          latestNote: note,
          latestNoteAt: now,
          latestNoteBy: operator.name,
          updatedAt: now,
        });
        await AuditService.logAction({
          recordId: id,
          action: 'add_note',
          operatorId: operator.id,
          operatorName: operator.name,
          note,
        });
      }
    );
  },

  async approve(
    id: string,
    operator: User,
    note?: string
  ): Promise<void> {
    if (!AuthService.canApprove(operator)) {
      throw new Error('当前用户无权审批');
    }
    const record = await db.reschedule_records.get(id);
    if (!record) throw new Error('记录不存在');
    if (record.status !== 'pending') {
      throw new Error('仅待审批状态的记录可以通过');
    }

    const oldStatus = record.status;
    const now = new Date().toISOString();

    await db.transaction(
      'rw',
      [db.reschedule_records, db.audit_logs],
      async () => {
        await db.reschedule_records.update(id, {
          status: 'approved',
          updatedAt: now,
          ...(note
            ? { latestNote: note, latestNoteAt: now, latestNoteBy: operator.name }
            : {}),
        });
        await AuditService.logAction({
          recordId: id,
          action: 'approve',
          operatorId: operator.id,
          operatorName: operator.name,
          note,
          oldStatus,
          newStatus: 'approved',
        });
      }
    );
  },

  async reject(
    id: string,
    operator: User,
    reason: string
  ): Promise<void> {
    if (!AuthService.canApprove(operator)) {
      throw new Error('当前用户无权驳回');
    }
    const record = await db.reschedule_records.get(id);
    if (!record) throw new Error('记录不存在');

    const oldStatus = record.status;
    const now = new Date().toISOString();

    await db.transaction(
      'rw',
      [db.reschedule_records, db.audit_logs],
      async () => {
        await db.reschedule_records.update(id, {
          status: 'rejected',
          latestNote: reason,
          latestNoteAt: now,
          latestNoteBy: operator.name,
          updatedAt: now,
        });
        await AuditService.logAction({
          recordId: id,
          action: 'reject',
          operatorId: operator.id,
          operatorName: operator.name,
          note: reason,
          oldStatus,
          newStatus: 'rejected',
        });
      }
    );
  },

  async isolate(
    id: string,
    operator: User,
    reason: string
  ): Promise<void> {
    if (!AuthService.canApprove(operator)) {
      throw new Error('当前用户无权隔离');
    }
    const record = await db.reschedule_records.get(id);
    if (!record) throw new Error('记录不存在');

    const oldStatus = record.status;
    const now = new Date().toISOString();

    await db.transaction(
      'rw',
      [db.reschedule_records, db.audit_logs],
      async () => {
        await db.reschedule_records.update(id, {
          status: 'bad_data',
          isIsolated: true,
          latestNote: reason,
          latestNoteAt: now,
          latestNoteBy: operator.name,
          updatedAt: now,
          anomaly: {
            type: record.anomaly?.type === 'none' ? 'invalid_data' : record.anomaly.type,
            message: reason,
          },
        });
        await AuditService.logAction({
          recordId: id,
          action: 'isolate',
          operatorId: operator.id,
          operatorName: operator.name,
          note: reason,
          oldStatus,
          newStatus: 'bad_data',
        });
      }
    );
  },

  async batchCreate(
    records: Partial<RescheduleRecord>[],
    operator: User
  ): Promise<{
    success: RescheduleRecord[];
    failed: Array<{ data: Partial<RescheduleRecord>; errors: string[] }>;
  }> {
    if (!AuthService.canImport(operator)) {
      throw new Error('当前用户无权批量导入');
    }

    const existingRecords = await db.reschedule_records.toArray();
    const success: RescheduleRecord[] = [];
    const failed: Array<{ data: Partial<RescheduleRecord>; errors: string[] }> = [];
    const now = new Date().toISOString();
    const allExistingForValidation = [...existingRecords];

    for (const data of records) {
      const { valid, errors, anomaly } = ValidationService.validateRecord(
        data,
        allExistingForValidation
      );

      if (!valid) {
        failed.push({ data, errors });
        continue;
      }

      const record: RescheduleRecord = {
        id: generateId(),
        babyName: data.babyName || '',
        babyId: data.babyId || '',
        originalShift: data.originalShift || '',
        originalDate: data.originalDate || '',
        targetShift: data.targetShift || '',
        targetDate: data.targetDate || '',
        reason: data.reason || '',
        sourceFileName: data.sourceFileName || '批量导入',
        sourceUploadedAt: data.sourceUploadedAt || now,
        handlerId: data.handlerId || operator.id,
        handlerName: data.handlerName || operator.name,
        status: anomaly ? 'cross_shift' : 'pending',
        anomaly: anomaly || { type: 'none', message: '无异常' },
        isIsolated: false,
        createdAt: now,
        updatedAt: now,
      };

      success.push(record);
      allExistingForValidation.push(record);
    }

    if (success.length > 0) {
      await db.transaction(
        'rw',
        [db.reschedule_records, db.audit_logs],
        async () => {
          await db.reschedule_records.bulkAdd(success);
          for (const rec of success) {
            await AuditService.logAction({
              recordId: rec.id,
              action: 'create',
              operatorId: operator.id,
              operatorName: operator.name,
            });
          }
        }
      );
    }

    return { success, failed };
  },
};
