import type { PhoneValidationResult, FieldDiff, AuthorizationRecord } from '@/types';
import { FIELD_LABELS, PRIVATE_FIELDS } from '@/types';

export function validatePhone(raw: string): PhoneValidationResult {
  const issues: string[] = [];
  let normalized = raw.trim();
  const original = raw;

  if (normalized.startsWith('+86')) {
    normalized = normalized.slice(3).trim();
    issues.push('含国家区号 +86');
  }
  if (normalized.startsWith('86')) {
    normalized = normalized.slice(2).trim();
    issues.push('含国家区号前缀 86');
  }

  const hasDash = normalized.includes('-');
  const hasSpace = normalized.includes(' ') || normalized.includes('\u00A0');
  normalized = normalized.replace(/[-\s\u00A0]/g, '');

  if (hasDash) issues.push('含横杠分隔符');
  if (hasSpace) issues.push('含空格分隔符');

  if (!/^\d+$/.test(normalized)) {
    return {
      valid: false,
      partialSuccess: false,
      originalValue: original,
      normalizedValue: normalized,
      issues: ['含非数字字符，无法识别'],
    };
  }

  if (normalized.length !== 11) {
    return {
      valid: false,
      partialSuccess: false,
      originalValue: original,
      normalizedValue: normalized,
      issues: [`位数不足或过多（当前 ${normalized.length} 位，需 11 位）`],
    };
  }

  if (!/^1[3-9]/.test(normalized)) {
    return {
      valid: false,
      partialSuccess: false,
      originalValue: original,
      normalizedValue: normalized,
      issues: ['号段不正确（中国大陆手机号需以 13-19 开头）'],
    };
  }

  const partialSuccess = issues.length > 0;
  if (partialSuccess) {
    issues.push(`已自动规范化为 ${normalized}`);
  }

  return {
    valid: true,
    partialSuccess,
    originalValue: original,
    normalizedValue: normalized,
    issues,
  };
}

export function desensitizeIdCard(id: string): string {
  if (!id || id.length < 10) return id || '';
  return id.slice(0, 6) + '********' + id.slice(-4);
}

export function desensitizePhone(phone: string): string {
  if (!phone || phone.length < 7) return phone || '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return phone;
  return digits.slice(0, 3) + '****' + digits.slice(-4);
}

export function desensitizeContact(contact: string): string {
  if (!contact) return '';
  return contact.replace(/1[3-9]\d{9}/g, (match) => desensitizePhone(match));
}

export function desensitizeField(fieldName: string, value: string): string {
  if (!value) return '';
  if (fieldName === 'babyIdCard' || fieldName === 'authorizerIdCard') {
    return desensitizeIdCard(value);
  }
  if (fieldName === 'authorizerPhone') {
    return desensitizePhone(value);
  }
  if (fieldName === 'emergencyContact') {
    return desensitizeContact(value);
  }
  return value;
}

export function generateId(prefix = 'id'): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function formatDateTime(date?: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date.replace(/-/g, '/')) : new Date(date);
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function nowDateTime(): string {
  return formatDateTime(new Date());
}

export function computeFieldDiffs(oldRec: Partial<AuthorizationRecord>, newRec: Partial<AuthorizationRecord>): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const allKeys = new Set([...Object.keys(oldRec), ...Object.keys(newRec)]);
  for (const key of allKeys) {
    if (['createdAt', 'updatedAt', 'reviewTime', 'handledBy', 'handledByName', 'reviewedBy', 'reviewedByName'].includes(key)) continue;
    const oldVal = String(oldRec[key as keyof AuthorizationRecord] ?? '');
    const newVal = String(newRec[key as keyof AuthorizationRecord] ?? '');
    if (oldVal !== newVal) {
      diffs.push({
        fieldName: key,
        fieldLabel: FIELD_LABELS[key] || key,
        oldValue: oldVal,
        newValue: newVal,
        changed: true,
      });
    }
  }
  return diffs;
}

export function isPrivateField(fieldName: string): boolean {
  return PRIVATE_FIELDS.includes(fieldName);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
