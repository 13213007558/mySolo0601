import { getDb, genId, dbJson, rowsToCamelCase } from '../db/index.js';
import type { AuditAction, AuditTargetType, AuditLog, User, SyncStatus, SyncTarget } from '../../shared/types.js';
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
    'INSERT INTO compensation_tasks (id, audit_log_id, target_type, target_id, payload, status, retry_count, next_retry_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
  ).run(
    genId('cmp_'),
    auditLogId,
    targetType,
    targetId,
    JSON.stringify(sanitizeLogData(payload)),
    'pending',
    new Date(Date.now() + 30 * 1000).toISOString(),
  );
}
