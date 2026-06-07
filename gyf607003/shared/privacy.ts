import type { UserRole, Baby } from './types';

export type MaskType = 'phone' | 'idcard' | 'address' | 'full';

export interface PrivacyFieldRule {
  field: keyof Baby;
  mask: MaskType;
  rolesAllowFull: UserRole[];
}

export const PRIVACY_FIELDS: PrivacyFieldRule[] = [
  { field: 'parentPhone', mask: 'phone', rolesAllowFull: ['supervisor', 'admin'] },
  { field: 'parentIdCard', mask: 'idcard', rolesAllowFull: ['supervisor', 'admin'] },
  { field: 'homeAddress', mask: 'address', rolesAllowFull: ['supervisor', 'admin'] },
];

export function maskValue(value: string, type: MaskType): string {
  if (!value) return value;

  switch (type) {
    case 'phone':
      if (value.length >= 7) {
        return value.slice(0, 3) + '****' + value.slice(-4);
      }
      return value.slice(0, 1) + '****';
    case 'idcard':
      if (value.length >= 10) {
        return value.slice(0, 4) + '**********' + value.slice(-4);
      }
      return value.slice(0, 2) + '********';
    case 'address':
      if (value.length > 6) {
        return value.slice(0, 6) + '***';
      }
      return value.slice(0, 2) + '***';
    case 'full':
      return '***';
    default:
      return value;
  }
}

export function applyPrivacyMask<T extends Partial<Baby>>(
  obj: T,
  role: UserRole,
  forceMask = false,
): T {
  if (!obj) return obj;

  const result = { ...obj } as T;

  for (const rule of PRIVACY_FIELDS) {
    const fieldValue = result[rule.field];
    if (typeof fieldValue === 'string') {
      const shouldMask = forceMask || !rule.rolesAllowFull.includes(role);
      if (shouldMask) {
        (result as Record<string, unknown>)[rule.field] = maskValue(fieldValue, rule.mask);
      }
    }
  }

  return result;
}

export function applyPrivacyMaskToList<T extends Partial<Baby>>(
  list: T[],
  role: UserRole,
  forceMask = false,
): T[] {
  return list.map((item) => applyPrivacyMask(item, role, forceMask));
}

export function sanitizeLogData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeLogData(item)) as unknown as T;
  }

  const result = { ...obj } as Record<string, unknown>;
  const sensitiveKeys = ['parentPhone', 'parentIdCard', 'homeAddress', 'phone', 'idCard', 'address'];

  for (const key of Object.keys(result)) {
    const lower = key.toLowerCase();
    if (sensitiveKeys.some((s) => lower.includes(s))) {
      const val = result[key];
      if (typeof val === 'string') {
        result[key] = maskValue(val, 'full');
      }
    } else if (typeof result[key] === 'object') {
      result[key] = sanitizeLogData(result[key] as object);
    }
  }

  return result as T;
}
