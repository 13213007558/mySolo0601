import { getHistoryDB } from '../db/index.js';
import type { ChangeHistory, User } from '../../shared/types/index.js';

function genId(prefix = 'his'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function appendHistory(input: {
  recordId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  action: ChangeHistory['action'];
  operator: User;
  reviewedAt?: string;
  reason?: string;
}): Promise<ChangeHistory> {
  const db = await getHistoryDB();
  const item: ChangeHistory = {
    id: genId('his'),
    recordId: input.recordId,
    field: input.field,
    oldValue: input.oldValue,
    newValue: input.newValue,
    operatedBy: input.operator.id,
    operatedByName: input.operator.name,
    operatedAt: new Date().toISOString(),
    reviewedAt: input.reviewedAt,
    action: input.action,
    reason: input.reason,
  };
  db.data.history.push(item);
  await db.write();
  return item;
}

export async function listHistoryByRecordId(recordId: string): Promise<ChangeHistory[]> {
  const db = await getHistoryDB();
  return db.data.history
    .filter((h) => h.recordId === recordId)
    .sort((a, b) => b.operatedAt.localeCompare(a.operatedAt));
}
