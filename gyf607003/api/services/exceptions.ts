import { getDb, genId } from '../db/index.js';
import { createAuditLog, enqueueCompensation } from './audit.js';
import type {
  ExceptionRecord,
  HandleExceptionRequest,
  HandleExceptionResponse,
  User,
  SyncTarget,
  FailureSimulationConfig,
} from '../../shared/types.js';

let failureSimulationConfig: FailureSimulationConfig = {
  enabled: process.env.SIMULATE_FAILURES === '1',
  failureRate: Number(process.env.FAILURE_RATE || '0.05'),
  failTargets: undefined,
};

export function setFailureSimulation(config: Partial<FailureSimulationConfig>): void {
  failureSimulationConfig = { ...failureSimulationConfig, ...config };
  console.log('[FAILURE-SIM] config updated:', failureSimulationConfig);
}

export function getFailureSimulation(): FailureSimulationConfig {
  return { ...failureSimulationConfig };
}

function shouldSimulateFailure(targetName: keyof SyncTarget): boolean {
  if (!failureSimulationConfig.enabled) return false;
  if (failureSimulationConfig.failTargets && !failureSimulationConfig.failTargets.includes(targetName)) {
    return false;
  }
  return Math.random() < failureSimulationConfig.failureRate;
}

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

function trySyncStep(name: keyof SyncTarget, fn: () => void): 'success' | 'failed' {
  try {
    if (shouldSimulateFailure(name)) {
      throw new Error(`${name} simulated failure (configurable)`);
    }
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
  const now = new Date().toISOString();
  const before = getExceptionById(id);

  if (!before) {
    const audit = createAuditLog(
      handler,
      'history_lost',
      'exception',
      id,
      { exceptionId: id, handleMeasure: req.handleMeasure },
      { status: 'resolved', handlerName: handler.name, historyLost: true, note: '异常记录已丢失，仅记录审计确保可追溯' },
    );
    console.warn('[HISTORY-LOST] exception', id, 'not found, audit log created:', audit.id);
    return {
      success: true,
      exception: {
        id,
        recordId: '',
        babyId: '',
        babyName: '未知',
        classId: '',
        type: 'other',
        reason: '历史记录丢失',
        status: 'resolved',
        handlerId: req.handlerId,
        handlerName: handler.name,
        handleMeasure: req.handleMeasure,
        handleTime: now,
        createTime: now,
      },
      syncResults: { classPage: 'success', babyDetail: 'success', backendCache: 'success', exportData: 'success' },
      auditLogId: audit.id,
      historyLost: true,
    };
  }

  const syncResults: SyncTarget = { classPage: 'failed', babyDetail: 'failed', backendCache: 'failed', exportData: 'failed' };
  const historyLostItems: string[] = [];

  const tx = db.transaction(() => {
    const exResult = db.prepare(
      'UPDATE exception_records SET status = ?, handler_id = ?, handler_name = ?, handle_measure = ?, handle_time = ? WHERE id = ?',
    ).run('resolved', req.handlerId, handler.name, req.handleMeasure, now, id);

    if (exResult.changes === 0) {
      historyLostItems.push('exception_record_update_failed');
    }

    const recordResult = db.prepare('UPDATE disinfection_records SET status = ? WHERE id = ?').run('recycled', before.recordId);
    if (recordResult.changes === 0) {
      historyLostItems.push(`disinfection_record:${before.recordId}`);
    }

    const babyResult = db.prepare('UPDATE babies SET status = ? WHERE id = ?').run('normal', before.babyId);
    if (babyResult.changes === 0) {
      historyLostItems.push(`baby:${before.babyId}`);
    }

    syncResults.backendCache = trySyncStep('backendCache', () => { /* cache invalidated by DB write */ });
    syncResults.classPage = trySyncStep('classPage', () => { /* class state derived via SQL */ });
    syncResults.babyDetail = trySyncStep('babyDetail', () => { /* baby state derived via SQL */ });
    syncResults.exportData = trySyncStep('exportData', () => { /* export reads live DB */ });
  });

  tx();

  const after = getExceptionById(id)!;

  const afterAuditData: Record<string, unknown> = {
    ...after,
    syncResults,
  };

  if (historyLostItems.length > 0) {
    afterAuditData.historyLost = true;
    afterAuditData.historyLostItems = historyLostItems;
    console.warn('[HISTORY-LOST] some records missing during handle:', historyLostItems);
  }

  const audit = createAuditLog(
    handler,
    historyLostItems.length > 0 ? 'history_lost' : 'handle_exception',
    'exception',
    id,
    before as unknown as Record<string, unknown>,
    afterAuditData,
    syncResults,
  );

  const hasFailed = Object.values(syncResults).some((v) => v === 'failed');
  if (hasFailed) {
    enqueueCompensation(audit.id, 'exception', id, {
      exceptionId: id,
      handleMeasure: req.handleMeasure,
      handlerId: req.handlerId,
      historyLostItems,
    });
  }

  return {
    success: true,
    exception: after,
    syncResults,
    auditLogId: audit.id,
    historyLost: historyLostItems.length > 0,
    historyLostItems: historyLostItems.length > 0 ? historyLostItems : undefined,
  };
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
