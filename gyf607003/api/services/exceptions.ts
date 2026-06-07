import { getDb, genId } from '../db/index.js';
import { createAuditLog, enqueueCompensation } from './audit.js';
import type {
  ExceptionRecord,
  HandleExceptionRequest,
  HandleExceptionResponse,
  User,
  SyncTarget,
} from '../../shared/types.js';

function getExceptionById(id: string): ExceptionRecord | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM exception_records WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    recordId: row.record_id as string,
    babyId: row.baby_id as string,
    babyName: row.baby_name as string,
    classId: row.class_id as string,
    type: row.type as ExceptionRecord['type'],
    reason: row.reason as string,
    status: row.status as ExceptionRecord['status'],
    handlerId: row.handler_id as string | undefined,
    handlerName: row.handler_name as string | undefined,
    handleMeasure: row.handle_measure as string | undefined,
    handleTime: row.handle_time as string | undefined,
    createTime: row.create_time as string,
    reviewedBy: row.reviewed_by as string | undefined,
    reviewedAt: row.reviewed_at as string | undefined,
    reviewComment: row.review_comment as string | undefined,
  } as ExceptionRecord;
}

export function listExceptions(status?: string): ExceptionRecord[] {
  const db = getDb();
  let sql = 'SELECT * FROM exception_records';
  const args: unknown[] = [];
  if (status) {
    sql += ' WHERE status = ?';
    args.push(status);
  }
  sql += ' ORDER BY create_time DESC';
  const rows = db.prepare(sql).all(...args) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    recordId: row.record_id as string,
    babyId: row.baby_id as string,
    babyName: row.baby_name as string,
    classId: row.class_id as string,
    type: row.type as ExceptionRecord['type'],
    reason: row.reason as string,
    status: row.status as ExceptionRecord['status'],
    handlerId: row.handler_id as string | undefined,
    handlerName: row.handler_name as string | undefined,
    handleMeasure: row.handle_measure as string | undefined,
    handleTime: row.handle_time as string | undefined,
    createTime: row.create_time as string,
    reviewedBy: row.reviewed_by as string | undefined,
    reviewedAt: row.reviewed_at as string | undefined,
    reviewComment: row.review_comment as string | undefined,
  }));
}

function trySyncStep(name: string, fn: () => void): 'success' | 'failed' {
  try {
    if (Math.random() < 0.05) throw new Error(name + ' simulated failure');
    fn();
    return 'success';
  } catch (e) {
    console.warn('[SYNC] failed:', name, (e as Error).message);
    return 'failed';
  }
}

export function handleException(
  id: string,
  req: HandleExceptionRequest,
  handler: User,
): HandleExceptionResponse {
  const db = getDb();
  const before = getExceptionById(id);
  if (!before) {
    return { success: false, exception: null as unknown as ExceptionRecord, syncResults: {} as SyncTarget, auditLogId: '' };
  }

  const now = new Date().toISOString();
  const syncResults: SyncTarget = { classPage: 'failed', babyDetail: 'failed', backendCache: 'failed', exportData: 'failed' };

  const tx = db.transaction(() => {
    db.prepare(
      'UPDATE exception_records SET status = ?, handler_id = ?, handler_name = ?, handle_measure = ?, handle_time = ? WHERE id = ?',
    ).run('resolved', req.handlerId, handler.name, req.handleMeasure, now, id);

    db.prepare('UPDATE disinfection_records SET status = ? WHERE id = ?').run('recycled', before.recordId);
    db.prepare('UPDATE babies SET status = ? WHERE id = ?').run('normal', before.babyId);

    syncResults.backendCache = trySyncStep('backendCache', () => { /* cache invalidated by DB write */ });
    syncResults.classPage = trySyncStep('classPage', () => { /* class state derived via SQL */ });
    syncResults.babyDetail = trySyncStep('babyDetail', () => { /* baby state derived via SQL */ });
    syncResults.exportData = trySyncStep('exportData', () => { /* export reads live DB */ });
  });

  tx();

  const after = getExceptionById(id)!;

  const audit = createAuditLog(
    handler,
    'handle_exception',
    'exception',
    id,
    before as unknown as Record<string, unknown>,
    after as unknown as Record<string, unknown>,
    syncResults,
  );

  const hasFailed = Object.values(syncResults).some((v) => v === 'failed');
  if (hasFailed) {
    enqueueCompensation(audit.id, 'exception', id, {
      exceptionId: id,
      handleMeasure: req.handleMeasure,
      handlerId: req.handlerId,
    });
  }

  return { success: true, exception: after, syncResults, auditLogId: audit.id };
}

export function createManualRecord(payload: {
  babyId: string; babyName: string; classId: string; itemType: string; itemName: string;
  status: string; operatorId: string; operatorName: string; remark?: string;
}, operator: User): { id: string } {
  const db = getDb();
  const id = genId('r_');
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO disinfection_records (id, baby_id, baby_name, class_id, item_type, item_name, status, operator_id, operator_name, operate_time, is_manual, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
  ).run(id, payload.babyId, payload.babyName, payload.classId, payload.itemType, payload.itemName, payload.status, payload.operatorId, payload.operatorName, now, payload.remark || null);

  createAuditLog(
    operator,
    'manual_record',
    'record',
    id,
    null,
    { babyName: payload.babyName, itemName: payload.itemName, isManual: true },
  );

  return { id };
}
