import { getDb, genId, dbJson, rowsToCamelCase, rowToCamelCase } from '../db/index.js';
import type { AuditAction, AuditTargetType, AuditLog, User, SyncStatus, SyncTarget, CompensationTask, CompensationTaskStatus } from '../../shared/types.js';
import { COMPENSATION_CONFIG } from '../../shared/types.js';
import { sanitizeLogData } from '../../shared/privacy.js';

export function createAuditLog(
  operator: User,
  action: AuditAction,
  targetType: AuditTargetType,
  targetId: string,
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
  syncResults?: Partial<SyncTarget>,
): AuditLog {
  const db = getDb();
  const id = genId('a_');
  const now = new Date().toISOString();

  let syncStatus: SyncStatus = 'success';
  if (syncResults) {
    const values = Object.values(syncResults);
    const failed = values.filter((v) => v === 'failed').length;
    if (failed === values.length) syncStatus = 'failed';
    else if (failed > 0) syncStatus = 'partial';
  }

  const cleanBefore = sanitizeLogData(beforeData);
  const cleanAfter = sanitizeLogData(afterData);

  db.prepare(
    'INSERT INTO audit_logs (id, action, target_type, target_id, operator_id, operator_name, operate_time, before_data, after_data, sync_status, retry_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
  ).run(id, action, targetType, targetId, operator.id, operator.name, now, dbJson(cleanBefore), dbJson(cleanAfter), syncStatus);

  console.log('[AUDIT]', operator.role, operator.name, action, targetType, targetId, 'sync=', syncStatus);

  return {
    id,
    action,
    targetType,
    targetId,
    operatorId: operator.id,
    operatorName: operator.name,
    operateTime: now,
    beforeData: cleanBefore,
    afterData: cleanAfter,
    syncStatus,
    retryCount: 0,
  };
}

export function listAuditLogs(limit = 100): AuditLog[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM audit_logs ORDER BY operate_time DESC LIMIT ?')
    .all(limit) as Record<string, unknown>[];
  return rowsToCamelCase<AuditLog>(rows).map((log) => ({
    ...log,
    retryCount: Number(log.retryCount ?? 0),
  }));
}

export function markReviewed(logId: string, reviewer: User, comment: string): void {
  const db = getDb();
  db.prepare('UPDATE exception_records SET reviewed_by = ?, reviewed_at = ?, review_comment = ? WHERE id = (SELECT target_id FROM audit_logs WHERE id = ?)')
    .run(reviewer.id, new Date().toISOString(), comment, logId);
}

export function enqueueCompensation(auditLogId: string, targetType: AuditTargetType, targetId: string, payload: Record<string, unknown>): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO compensation_tasks (id, audit_log_id, target_type, target_id, payload, status, retry_count, max_retries, next_retry_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
  ).run(
    genId('cmp_'),
    auditLogId,
    targetType,
    targetId,
    JSON.stringify(sanitizeLogData(payload)),
    'pending',
    COMPENSATION_CONFIG.MAX_RETRIES,
    new Date(Date.now() + COMPENSATION_CONFIG.RETRY_INTERVAL_MS).toISOString(),
  );
  console.log('[COMPENSATION] enqueued task for audit', auditLogId);
}

export function listCompensationTasks(status?: CompensationTaskStatus): CompensationTask[] {
  const db = getDb();
  let sql = 'SELECT * FROM compensation_tasks';
  const args: unknown[] = [];
  if (status) {
    sql += ' WHERE status = ?';
    args.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...args) as Record<string, unknown>[];
  return rowsToCamelCase<CompensationTask>(rows).map((t) => ({
    ...t,
    retryCount: Number(t.retryCount ?? 0),
    maxRetries: Number(t.maxRetries ?? COMPENSATION_CONFIG.MAX_RETRIES),
    payload: typeof t.payload === 'string' ? JSON.parse(t.payload || '{}') : t.payload,
  }));
}

export function getNextCompensationTask(): CompensationTask | null {
  const db = getDb();
  const now = new Date().toISOString();
  const row = db.prepare(
    "SELECT * FROM compensation_tasks WHERE status IN ('pending', 'failed') AND retry_count < max_retries AND next_retry_at <= ? ORDER BY created_at ASC LIMIT 1",
  ).get(now) as Record<string, unknown> | undefined;
  if (!row) return null;
  const task = rowToCamelCase<CompensationTask>(row)!;
  return {
    ...task,
    retryCount: Number(task.retryCount ?? 0),
    maxRetries: Number(task.maxRetries ?? COMPENSATION_CONFIG.MAX_RETRIES),
    payload: typeof task.payload === 'string' ? JSON.parse(task.payload || '{}') : task.payload,
  };
}

export function updateCompensationTaskStatus(
  taskId: string,
  status: CompensationTaskStatus,
  options?: { error?: string; incrementRetry?: boolean },
): void {
  const db = getDb();
  const now = new Date().toISOString();

  const current = db.prepare('SELECT * FROM compensation_tasks WHERE id = ?').get(taskId) as Record<string, unknown> | undefined;
  if (!current) return;

  let sql = 'UPDATE compensation_tasks SET status = ?';
  const args: unknown[] = [status];

  if (options?.incrementRetry) {
    sql += ', retry_count = retry_count + 1';
    const currentRetry = Number((current as { retryCount?: number }).retryCount ?? 0) + 1;
    const backoffMs = COMPENSATION_CONFIG.RETRY_INTERVAL_MS * Math.pow(COMPENSATION_CONFIG.BACKOFF_FACTOR, currentRetry);
    sql += ', next_retry_at = ?';
    args.push(new Date(Date.now() + backoffMs).toISOString());
  }

  if (options?.error) {
    sql += ', last_error = ?';
    args.push(options.error);
  }

  if (status === 'success') {
    sql += ', next_retry_at = NULL';
  }

  sql += ' WHERE id = ?';
  args.push(taskId);

  db.prepare(sql).run(...args);
  console.log('[COMPENSATION] task', taskId, '→', status, options?.error ? `(${options.error})` : '');
}

export function getCompensationTaskById(taskId: string): CompensationTask | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM compensation_tasks WHERE id = ?').get(taskId) as Record<string, unknown> | undefined;
  if (!row) return null;
  const task = rowToCamelCase<CompensationTask>(row)!;
  return {
    ...task,
    retryCount: Number(task.retryCount ?? 0),
    maxRetries: Number(task.maxRetries ?? COMPENSATION_CONFIG.MAX_RETRIES),
    payload: typeof task.payload === 'string' ? JSON.parse(task.payload || '{}') : task.payload,
  };
}

export function processCompensationTask(task: CompensationTask, operator: User): { success: boolean; error?: string } {
  const db = getDb();
  const payload = task.payload as {
    exceptionId: string;
    handleMeasure: string;
    handlerId: string;
  };

  try {
    const tx = db.transaction(() => {
      const exRow = db.prepare('SELECT * FROM exception_records WHERE id = ?').get(payload.exceptionId) as Record<string, unknown> | undefined;
      if (exRow) {
        const status = (exRow as { status: string }).status;
        if (status !== 'resolved') {
          db.prepare(
            'UPDATE exception_records SET status = ?, handler_id = ?, handler_name = ?, handle_measure = ?, handle_time = ? WHERE id = ?',
          ).run('resolved', payload.handlerId, operator.name, payload.handleMeasure, new Date().toISOString(), payload.exceptionId);
        }
        const recordId = (exRow as { recordId?: string; record_id?: string }).recordId || (exRow as { record_id: string }).record_id;
        if (recordId) {
          db.prepare("UPDATE disinfection_records SET status = 'recycled' WHERE id = ?").run(recordId);
        }
        const babyId = (exRow as { babyId?: string; baby_id?: string }).babyId || (exRow as { baby_id: string }).baby_id;
        if (babyId) {
          db.prepare("UPDATE babies SET status = 'normal' WHERE id = ?").run(babyId);
        }
      }
    });
    tx();
    console.log('[COMPENSATION] task', task.id, 'processed successfully');
    return { success: true };
  } catch (e) {
    const error = (e as Error).message;
    console.error('[COMPENSATION] task', task.id, 'failed:', error);
    return { success: false, error };
  }
}
