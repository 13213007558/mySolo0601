import type { UserRole, HotSpotRecord, SensitiveData } from '@/types';
import { ROLE_CONFIGS } from '@/config/roles';

const MASK_TEXT = '***';

export function desensitizeValue(value: unknown, fieldName: string, role: UserRole): unknown {
  const config = ROLE_CONFIGS[role];
  
  if (!config.canViewSensitiveData && fieldName in config.sensitiveFieldMask) {
    return MASK_TEXT;
  }
  
  return value;
}

export function desensitizeSensitiveData(data: SensitiveData, role: UserRole): SensitiveData {
  const config = ROLE_CONFIGS[role];
  const result = { ...data };
  
  (Object.keys(data) as Array<keyof SensitiveData>).forEach(key => {
    if (config.sensitiveFieldMask[key]) {
      if (typeof data[key] === 'number') {
        (result[key] as unknown) = MASK_TEXT;
      } else {
        (result[key] as unknown) = MASK_TEXT;
      }
    }
  });
  
  return result;
}

export function desensitizeRecord(record: HotSpotRecord, role: UserRole): HotSpotRecord {
  const config = ROLE_CONFIGS[role];
  const result = { ...record };
  
  if (!config.allowedFields.includes('currentWithdrawReason')) {
    result.currentWithdrawReason = MASK_TEXT;
  }
  if (!config.allowedFields.includes('originalWithdrawReason')) {
    result.originalWithdrawReason = MASK_TEXT;
  }
  if (!config.allowedFields.includes('internalFieldCode')) {
    result.internalFieldCode = MASK_TEXT;
  }
  if (!config.allowedFields.includes('processedBy')) {
    result.processedBy = MASK_TEXT;
  }
  if (!config.allowedFields.includes('supplementedBy')) {
    result.supplementedBy = MASK_TEXT;
  }
  
  result.sensitiveData = desensitizeSensitiveData(record.sensitiveData, role);
  
  if (!config.allowedFields.includes('versionHistory')) {
    result.versionHistory = record.versionHistory.map(vh => ({
      ...vh,
      withdrawReason: MASK_TEXT,
      previousWithdrawReason: MASK_TEXT,
      sourceMaterialReference: MASK_TEXT,
    }));
  }
  
  return result;
}

export function desensitizeRecords(records: HotSpotRecord[], role: UserRole): HotSpotRecord[] {
  return records.map(r => desensitizeRecord(r, role));
}

export function isFieldVisible(fieldName: string, role: UserRole): boolean {
  const config = ROLE_CONFIGS[role];
  return config.allowedFields.includes(fieldName);
}

export function canPerformOperation(operation: string, role: UserRole): boolean {
  const config = ROLE_CONFIGS[role];
  return config.allowedOperations.includes(operation);
}

export function formatDesensitizedNumber(value: number | string, role: UserRole, fieldKey: keyof SensitiveData): string {
  const config = ROLE_CONFIGS[role];
  if (config.sensitiveFieldMask[fieldKey]) {
    return MASK_TEXT;
  }
  if (typeof value === 'number') {
    return `¥${value.toLocaleString()}`;
  }
  return String(value);
}
