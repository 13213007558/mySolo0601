import {
  CheckRecord,
  AuditLog,
  AuditAction,
  RestartResult,
  ServiceRestart,
  DataStatus
} from '../types';
import { mockAuditLogs, mockCurrentOperator, mockServiceRestarts } from '../data/mockData';

const AUDIT_LOGS_KEY = 'check_record_audit_logs';
const SERVICE_RESTARTS_KEY = 'service_restarts';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function loadAuditLogs(): AuditLog[] {
  const stored = localStorage.getItem(AUDIT_LOGS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(mockAuditLogs));
  return mockAuditLogs;
}

function saveAuditLogs(logs: AuditLog[]): void {
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
}

function loadServiceRestarts(): ServiceRestart[] {
  const stored = localStorage.getItem(SERVICE_RESTARTS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(SERVICE_RESTARTS_KEY, JSON.stringify(mockServiceRestarts));
  return mockServiceRestarts;
}

function saveServiceRestarts(restarts: ServiceRestart[]): void {
  localStorage.setItem(SERVICE_RESTARTS_KEY, JSON.stringify(restarts));
}

export async function persistAuditLog(log: AuditLog): Promise<void> {
  const logs = loadAuditLogs();
  logs.push(log);
  saveAuditLogs(logs);
}

export async function updateAuditLog(log: AuditLog): Promise<void> {
  const logs = loadAuditLogs();
  const index = logs.findIndex(l => l.id === log.id);
  if (index !== -1) {
    logs[index] = log;
    saveAuditLogs(logs);
  }
}

export async function persistAuditLogs(logs: AuditLog[]): Promise<void> {
  const existing = loadAuditLogs();
  existing.push(...logs);
  saveAuditLogs(existing);
}

export function createAuditSnapshot(
  record: CheckRecord,
  action: AuditAction,
  serviceRestartId?: string
): AuditLog {
  return {
    id: generateId('audit'),
    recordId: record.id,
    babyId: record.babyId,
    action,
    snapshot: deepClone(record),
    operator: mockCurrentOperator,
    timestamp: new Date().toISOString(),
    serviceRestartId,
    success: true
  };
}

export async function saveWithAudit<T extends { id: string }>(
  record: T,
  action: AuditAction,
  operator: string,
  updateFn: (r: T) => Promise<T>
): Promise<T> {
  const auditLog: AuditLog = {
    id: generateId('audit'),
    recordId: record.id,
    action,
    oldValue: deepClone(record),
    operator,
    timestamp: new Date().toISOString(),
    success: true
  };

  await persistAuditLog(auditLog);

  const updated = await updateFn(record);

  auditLog.newValue = deepClone(updated);
  await updateAuditLog(auditLog);

  return updated;
}

export async function restoreFromAudit(recordId: string): Promise<CheckRecord | null> {
  const logs = loadAuditLogs();
  const recordLogs = logs
    .filter(log => log.recordId === recordId && log.newValue)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (recordLogs.length > 0 && recordLogs[0].newValue) {
    return recordLogs[0].newValue as CheckRecord;
  }

  const snapshotLogs = logs
    .filter(log => log.recordId === recordId && log.snapshot)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (snapshotLogs.length > 0 && snapshotLogs[0].snapshot) {
    return snapshotLogs[0].snapshot as CheckRecord;
  }

  return null;
}

async function processSingleRecord(record: CheckRecord): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 10));

  if (record.id === 'record-fail-sim') {
    throw new Error('模拟处理失败：数据格式错误');
  }

  if (record.dataStatus === DataStatus.EMPTY) {
    throw new Error('空数据无法处理');
  }
}

export async function processWithPartialSuccess(
  records: CheckRecord[],
  operator: string
): Promise<RestartResult> {
  const restartId = generateId('restart');
  const success: string[] = [];
  const failed: Array<{ recordId: string; reason: string; data: unknown }> = [];
  const auditSnapshot: AuditLog[] = [];

  const restartRecord: ServiceRestart = {
    id: restartId,
    startTime: new Date().toISOString(),
    totalRecords: records.length,
    successCount: 0,
    failCount: 0,
    failRecordIds: [],
    failDetails: [],
    operator,
    status: 'processing'
  };

  const restarts = loadServiceRestarts();
  restarts.push(restartRecord);
  saveServiceRestarts(restarts);

  for (const record of records) {
    try {
      const snapshot = createAuditSnapshot(record, AuditAction.SERVICE_RESTART, restartId);
      auditSnapshot.push(snapshot);

      await processSingleRecord(record);

      success.push(record.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      failed.push({
        recordId: record.id,
        reason: errorMessage,
        data: deepClone(record)
      });

      const failSnapshot: AuditLog = {
        ...createAuditSnapshot(record, AuditAction.SERVICE_RESTART, restartId),
        success: false,
        errorMessage
      };
      auditSnapshot.push(failSnapshot);
    }
  }

  await persistAuditLogs(auditSnapshot);

  restartRecord.endTime = new Date().toISOString();
  restartRecord.successCount = success.length;
  restartRecord.failCount = failed.length;
  restartRecord.failRecordIds = failed.map(f => f.recordId);
  restartRecord.failDetails = failed;

  if (failed.length === 0) {
    restartRecord.status = 'completed';
  } else if (success.length > 0) {
    restartRecord.status = 'partial_success';
  } else {
    restartRecord.status = 'failed';
  }

  const allRestarts = loadServiceRestarts();
  const idx = allRestarts.findIndex(r => r.id === restartId);
  if (idx !== -1) {
    allRestarts[idx] = restartRecord;
    saveServiceRestarts(allRestarts);
  }

  return { success, failed, auditSnapshot };
}

export function getAuditLogsByRecordId(recordId: string): AuditLog[] {
  const logs = loadAuditLogs();
  return logs
    .filter(log => log.recordId === recordId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getAllAuditLogs(): AuditLog[] {
  return loadAuditLogs().sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getAllServiceRestarts(): ServiceRestart[] {
  return loadServiceRestarts().sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

export function getLostRecordsWithAudit(): Array<{
  recordId: string;
  babyId?: string;
  lastSnapshot: unknown;
  lastSeen: string;
  errorMessage?: string;
}> {
  const logs = loadAuditLogs();
  const failedRestartLogs = logs.filter(
    log => log.action === AuditAction.SERVICE_RESTART && !log.success
  );

  return failedRestartLogs.map(log => ({
    recordId: log.recordId!,
    babyId: log.babyId,
    lastSnapshot: log.snapshot,
    lastSeen: log.timestamp,
    errorMessage: log.errorMessage
  }));
}
