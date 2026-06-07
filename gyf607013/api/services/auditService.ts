import type { AuditLog, DisinfectionRecord, User } from '../../src/types/index.js';
import { mockDb } from '../db/mockDb.js';

export const TEMP_NOMINAL = 100;
export const TEMP_THRESHOLD_PCT = 0.05;
export const TEMP_MIN = TEMP_NOMINAL * (1 - TEMP_THRESHOLD_PCT);
export const TEMP_MAX = TEMP_NOMINAL * (1 + TEMP_THRESHOLD_PCT);

export interface BoundaryCheckResult {
  isBoundary: boolean;
  isOutOfRange: boolean;
  reason?: string;
}

export function checkTemperatureBoundary(temperature: number): BoundaryCheckResult {
  if (temperature === 0 || temperature === undefined || temperature === null) {
    return { isBoundary: false, isOutOfRange: false };
  }

  if (temperature < TEMP_MIN) {
    return {
      isBoundary: true,
      isOutOfRange: true,
      reason: `温度${temperature}℃低于下限阈值${TEMP_MIN}℃`,
    };
  }
  if (temperature > TEMP_MAX) {
    return {
      isBoundary: true,
      isOutOfRange: true,
      reason: `温度${temperature}℃超过上限阈值${TEMP_MAX}℃`,
    };
  }
  if (temperature === TEMP_MIN) {
    return {
      isBoundary: true,
      isOutOfRange: false,
      reason: `温度达到下限阈值${TEMP_MIN}℃`,
    };
  }
  if (temperature === TEMP_MAX) {
    return {
      isBoundary: true,
      isOutOfRange: false,
      reason: `温度达到上限阈值${TEMP_MAX}℃`,
    };
  }
  return { isBoundary: false, isOutOfRange: false };
}

export function logFieldChange(
  recordId: string,
  fieldName: string,
  oldValue: unknown,
  newValue: unknown,
  operator: User,
  isBoundaryAudit = false,
): AuditLog {
  return mockDb.addAuditLog({
    recordId,
    fieldName,
    oldValue,
    newValue,
    operatorId: operator.id,
    operatorName: operator.name,
    isBoundaryAudit,
  });
}

export function logRecordUpdate(
  oldRecord: DisinfectionRecord,
  newRecord: DisinfectionRecord,
  operator: User,
): AuditLog[] {
  const logs: AuditLog[] = [];
  const fieldsToTrack: (keyof DisinfectionRecord)[] = [
    'status',
    'temperature',
    'duration',
    'exceptionNote',
    'source',
    'handlerId',
    'handlerName',
    'reviewedById',
    'reviewedByName',
    'actualTime',
  ];

  for (const field of fieldsToTrack) {
    const oldVal = oldRecord[field];
    const newVal = newRecord[field];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      const isBoundary =
        field === 'temperature' && checkTemperatureBoundary(newVal as number).isBoundary;
      logs.push(
        logFieldChange(newRecord.id, field, oldVal, newVal, operator, isBoundary),
      );
    }
  }

  return logs;
}

export function getAllAuditLogs(): AuditLog[] {
  return mockDb.getAuditLogs();
}

export function getAuditLogsByRecordId(recordId: string): AuditLog[] {
  return mockDb.getAuditLogsByRecordId(recordId);
}
