import type { InfantRecord, AuditLog, FieldChange } from '../../shared/types';
import { initialRecords, initialAuditLogs } from './mockData';

let records: InfantRecord[] = [...initialRecords];
let auditLogs: AuditLog[] = [...initialAuditLogs];

export function getRecords(): InfantRecord[] {
  return [...records];
}

export function getRecordById(id: string): InfantRecord | undefined {
  return records.find((r) => r.id === id);
}

export function addRecord(record: InfantRecord): InfantRecord {
  records = [record, ...records];
  return record;
}

export function updateRecord(id: string, updater: (r: InfantRecord) => InfantRecord): InfantRecord | undefined {
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  records[idx] = updater(records[idx]);
  return records[idx];
}

export function getAuditLogs(): AuditLog[] {
  return [...auditLogs];
}

export function getAuditLogsByRecordId(recordId: string): AuditLog[] {
  return auditLogs.filter((a) => a.recordId === recordId);
}

export function addAuditLog(log: AuditLog): AuditLog {
  auditLogs = [log, ...auditLogs];
  return log;
}

export function diffFields(
  oldRec: Partial<InfantRecord>,
  newRec: Partial<InfantRecord>,
): FieldChange[] {
  const changes: FieldChange[] = [];
  const simpleFields: (keyof InfantRecord)[] = [
    'batchNo',
    'babyName',
    'gender',
    'birthDate',
    'parentPhone',
    'source',
    'status',
    'internalNotes',
  ];
  simpleFields.forEach((f) => {
    const ov = String(oldRec[f] ?? '');
    const nv = String(newRec[f] ?? '');
    if (ov !== nv) {
      changes.push({ field: f, oldValue: ov, newValue: nv });
    }
  });

  (['feeding', 'temperature', 'sleep'] as const).forEach((f) => {
    const ov = oldRec.parentVisible?.[f] ?? '';
    const nv = newRec.parentVisible?.[f] ?? '';
    if (ov !== nv) {
      changes.push({ field: `parentVisible.${f}`, oldValue: ov, newValue: nv });
    }
  });

  return changes;
}

export function nowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
