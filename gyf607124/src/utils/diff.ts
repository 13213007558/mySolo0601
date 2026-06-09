import type { DiffField } from '@/types';
import { FIELD_LABELS } from '@/types';

export function computeDiff(
  oldObj: Record<string, any> | null,
  newObj: Record<string, any> | null
): DiffField[] {
  const fields = ['recordDate', 'valveNo', 'opening', 'temperature', 'pressure', 'status', 'operator', 'contractId', 'remarks'];
  const oldData = oldObj || {};
  const newData = newObj || {};

  return fields.map(field => {
    const oldValue = oldData[field];
    const newValue = newData[field];
    const changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);
    return { field, oldValue, newValue, changed };
  });
}

export function formatValue(field: string, value: any): string {
  if (value === undefined || value === null) return '-';
  if (field === 'status') {
    const statusMap: Record<string, string> = { normal: '正常', abnormal: '异常', manual: '手工补录' };
    return statusMap[value] || value;
  }
  if (field === 'opening') return `${value}%`;
  if (field === 'temperature') return `${value}°C`;
  if (field === 'pressure') return `${value}MPa`;
  return String(value);
}

export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field;
}
