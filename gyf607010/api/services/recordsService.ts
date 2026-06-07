import { getRecordsDB } from '../db/index.js';
import { appendHistory, listHistoryByRecordId } from './historyService.js';
import type {
  MilkRecord,
  ChangeHistory,
  CreateRecordInput,
  UpdateRecordInput,
  RecordFilter,
  ReviewPayload,
  WithdrawPayload,
  RecordStatus,
  RecordWithHistory,
} from '../../shared/types/index.js';

function genId(prefix = 'rec'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isoToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function validateRecordInput(input: Partial<CreateRecordInput>): string[] {
  const errors: string[] = [];
  if (!input.babyName || !input.babyName.trim()) {
    errors.push('婴儿姓名不能为空');
  }
  if (!input.recordDate) {
    errors.push('记录日期不能为空');
  } else if (input.recordDate > isoToday()) {
    errors.push('记录日期不能晚于今天');
  }
  if (typeof input.milkAmountMl !== 'number' || Number.isNaN(input.milkAmountMl)) {
    errors.push('奶量必须为数字');
  } else if (input.milkAmountMl < 1 || input.milkAmountMl > 300) {
    errors.push('奶量必须在 1-300 ml 之间');
  }
  if (!input.shift) {
    errors.push('请选择班次');
  }
  if (!input.feedingMethod) {
    errors.push('请选择喂养方式');
  }
  return errors;
}

export async function listRecords(filter: RecordFilter = {}): Promise<MilkRecord[]> {
  const db = await getRecordsDB();
  let list = db.data.records.slice();
  if (filter.dateFrom) {
    list = list.filter((r) => r.recordDate >= filter.dateFrom!);
  }
  if (filter.dateTo) {
    list = list.filter((r) => r.recordDate <= filter.dateTo!);
  }
  if (filter.babyName) {
    const kw = filter.babyName.trim().toLowerCase();
    list = list.filter((r) => r.babyName.toLowerCase().includes(kw));
  }
  if (filter.status) {
    list = list.filter((r) => r.status === filter.status);
  }
  if (filter.operatorName) {
    const kw = filter.operatorName.trim().toLowerCase();
    list = list.filter(
      (r) =>
        r.createdByName.toLowerCase().includes(kw) ||
        (r.reviewedByName && r.reviewedByName.toLowerCase().includes(kw)),
    );
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRecordById(id: string): Promise<MilkRecord | null> {
  const db = await getRecordsDB();
  return db.data.records.find((r) => r.id === id) ?? null;
}

export async function getRecordWithHistory(id: string): Promise<RecordWithHistory | null> {
  const record = await getRecordById(id);
  if (!record) return null;
  const history = await listHistoryByRecordId(id);
  return { record, history };
}

export async function createRecord(input: CreateRecordInput): Promise<MilkRecord> {
  const db = await getRecordsDB();
  const now = new Date().toISOString();

  const conflict = db.data.records.find(
    (r) =>
      r.babyName === input.babyName.trim() &&
      r.recordDate === input.recordDate &&
      r.shift === input.shift &&
      r.status !== 'withdrawn',
  );

  let status: RecordStatus = 'pending';
  let conflictReason: string | undefined;
  if (conflict) {
    status = 'conflict';
    conflictReason = `同一婴儿 ${input.babyName} 在 ${input.recordDate} ${input.shift} 已存在记录 ${conflict.id}，疑似重复录入`;
  }

  const record: MilkRecord = {
    id: genId('rec'),
    babyName: input.babyName.trim(),
    recordDate: input.recordDate,
    shift: input.shift,
    milkAmountMl: input.milkAmountMl,
    feedingMethod: input.feedingMethod,
    remark: input.remark ?? '',
    status,
    conflictReason,
    createdBy: input.operator.id,
    createdByName: input.operator.name,
    createdAt: now,
    updatedAt: now,
  };

  db.data.records.push(record);
  await db.write();

  await appendHistory({
    recordId: record.id,
    field: 'record',
    oldValue: null,
    newValue: record,
    action: 'create',
    operator: input.operator,
  });

  if (conflict) {
    await appendHistory({
      recordId: record.id,
      field: 'status',
      oldValue: 'pending',
      newValue: 'conflict',
      action: 'update',
      operator: input.operator,
      reason: conflictReason,
    });
  }

  return record;
}

export async function updateRecord(id: string, input: UpdateRecordInput): Promise<MilkRecord | null> {
  const db = await getRecordsDB();
  const idx = db.data.records.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const original = { ...db.data.records[idx] };
  const now = new Date().toISOString();
  const next = { ...original, updatedAt: now };

  const fields: Array<keyof Omit<UpdateRecordInput, 'operator'>> = [
    'babyName',
    'recordDate',
    'shift',
    'milkAmountMl',
    'feedingMethod',
    'remark',
  ];

  for (const field of fields) {
    const value = input[field];
    if (value !== undefined && value !== (original as any)[field]) {
      (next as any)[field] = typeof value === 'string' ? value.trim() : value;
      await appendHistory({
        recordId: id,
        field,
        oldValue: (original as any)[field],
        newValue: typeof value === 'string' ? value.trim() : value,
        action: 'update',
        operator: input.operator,
      });
    }
  }

  db.data.records[idx] = next;
  await db.write();
  return next;
}

export async function reviewRecord(
  id: string,
  payload: ReviewPayload,
): Promise<MilkRecord | null> {
  const db = await getRecordsDB();
  const idx = db.data.records.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const original = { ...db.data.records[idx] };
  const now = new Date().toISOString();

  if (payload.pass) {
    db.data.records[idx] = {
      ...original,
      status: 'confirmed',
      reviewedBy: payload.operator.id,
      reviewedByName: payload.operator.name,
      reviewedAt: now,
      updatedAt: now,
    };
    await db.write();
    await appendHistory({
      recordId: id,
      field: 'status',
      oldValue: original.status,
      newValue: 'confirmed',
      action: 'review',
      operator: payload.operator,
      reviewedAt: now,
    });
  } else {
    db.data.records[idx] = {
      ...original,
      status: 'withdrawn',
      withdrawReason: payload.reason ?? '复核退回',
      reviewedBy: payload.operator.id,
      reviewedByName: payload.operator.name,
      reviewedAt: now,
      updatedAt: now,
    };
    await db.write();
    await appendHistory({
      recordId: id,
      field: 'status',
      oldValue: original.status,
      newValue: 'withdrawn',
      action: 'review',
      operator: payload.operator,
      reviewedAt: now,
      reason: payload.reason,
    });
  }

  return db.data.records[idx];
}

export async function withdrawRecord(
  id: string,
  payload: WithdrawPayload,
): Promise<MilkRecord | null> {
  const db = await getRecordsDB();
  const idx = db.data.records.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const original = { ...db.data.records[idx] };
  const now = new Date().toISOString();

  db.data.records[idx] = {
    ...original,
    status: 'withdrawn',
    withdrawReason: payload.reason,
    updatedAt: now,
  };
  await db.write();

  await appendHistory({
    recordId: id,
    field: 'status',
    oldValue: original.status,
    newValue: 'withdrawn',
    action: 'withdraw',
    operator: payload.operator,
    reviewedAt: original.status === 'confirmed' ? original.reviewedAt : undefined,
    reason: payload.reason,
  });

  return db.data.records[idx];
}
