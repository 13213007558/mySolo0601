import type { OilTempRecord, ConflictRecord } from '@/types';
import { generateId } from './hash';

export function detectConflict(
  storedRecord: OilTempRecord | undefined,
  newRecord: Partial<OilTempRecord>
): boolean {
  if (!storedRecord) return false;
  return storedRecord.version !== (newRecord.version ?? storedRecord.version);
}

export function createConflictRecord(
  oldValue: OilTempRecord,
  newValue: OilTempRecord,
  operator1: string,
  operator2: string
): ConflictRecord {
  return {
    id: generateId(),
    recordId: oldValue.id,
    oldValue: { ...oldValue },
    newValue: { ...newValue },
    operator1,
    operator2,
    timestamp: Date.now(),
    resolved: false,
  };
}

export function resolveConflict(
  conflict: ConflictRecord,
  resolution: 'keep_old' | 'use_new' | 'merge'
): OilTempRecord {
  switch (resolution) {
    case 'keep_old':
      return {
        ...conflict.oldValue,
        version: Math.max(conflict.oldValue.version, conflict.newValue.version) + 1,
        modifiedAt: Date.now(),
      };
    case 'use_new':
      return {
        ...conflict.newValue,
        version: Math.max(conflict.oldValue.version, conflict.newValue.version) + 1,
        modifiedAt: Date.now(),
      };
    case 'merge': {
      const mergedRemark = [
        conflict.oldValue.remark,
        conflict.newValue.remark,
      ].filter(Boolean).join(' | ');
      return {
        ...conflict.newValue,
        remark: mergedRemark,
        version: Math.max(conflict.oldValue.version, conflict.newValue.version) + 1,
        modifiedAt: Date.now(),
      };
    }
    default:
      return conflict.oldValue;
  }
}

export function getConflictingFields(conflict: ConflictRecord): string[] {
  const fields: string[] = [];
  const keys = Object.keys(conflict.oldValue) as (keyof OilTempRecord)[];
  for (const key of keys) {
    if (key === 'version' || key === 'modifiedAt') continue;
    if (JSON.stringify(conflict.oldValue[key]) !== JSON.stringify(conflict.newValue[key])) {
      fields.push(key);
    }
  }
  return fields;
}
