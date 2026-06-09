import type { BracketRecord, DiffResult } from '@/types';

export const calculateAngleDiff = (original: number, corrected: number): { difference: number; percentage: number } => {
  const difference = corrected - original;
  const percentage = original !== 0 ? (difference / original) * 100 : 0;
  return { difference, percentage };
};

export const findRecordChanges = (
  oldRecord: Partial<BracketRecord>,
  newRecord: Partial<BracketRecord>
): DiffResult[] => {
  const changes: DiffResult[] = [];
  const fields: Array<keyof BracketRecord> = [
    'currentAngle', 'targetAngle', 'handler', 'processDate', 'status', 'version', 'remark'
  ];

  fields.forEach(field => {
    const oldVal = oldRecord[field];
    const newVal = newRecord[field];
    if (oldVal !== newVal) {
      let difference: number | string = '';
      if (typeof oldVal === 'number' && typeof newVal === 'number') {
        difference = newVal - oldVal;
      }
      changes.push({
        field,
        original: oldVal ?? '',
        corrected: newVal ?? '',
        difference,
      });
    }
  });

  return changes;
};

export const getDifferenceColor = (diff: number): string => {
  if (diff === 0) return 'text-green-600';
  if (Math.abs(diff) <= 2) return 'text-yellow-600';
  return 'text-red-600';
};

export const getDifferenceLabel = (diff: number): string => {
  if (diff === 0) return '无差异';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff}°`;
};

export const formatNumber = (num: number, decimals: number = 1): string => {
  return num.toFixed(decimals);
};
