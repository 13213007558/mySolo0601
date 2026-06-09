import {
  ValidationRule,
  ValidationResult,
  ParsedRecord,
  ErrorType,
} from '@/types';

export const VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'meterNo',
    validate: (value) => {
      if (typeof value !== 'string') return false;
      return /^\d{8}$/.test(value.trim());
    },
    errorType: 'format_error',
    message: '电表编号必须为8位数字',
  },
  {
    field: 'reading',
    validate: (value) => {
      const num = Number(value);
      return !isNaN(num) && num >= 0 && value !== '' && value !== null;
    },
    errorType: 'invalid_reading',
    message: '电表读数不能为空或负数',
  },
  {
    field: 'readingTime',
    validate: (value) => {
      if (!value) return false;
      const date = new Date(String(value));
      if (isNaN(date.getTime())) return false;
      const now = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return date > threeMonthsAgo && date < now;
    },
    errorType: 'invalid_time',
    message: '抄表时间超出合理范围（近3个月内）',
  },
  {
    field: 'multiplier',
    validate: (value) => {
      const num = Number(value);
      return !isNaN(num) && num > 0;
    },
    errorType: 'missing_multiplier',
    message: '倍率字段缺失或无效',
  },
];

export function validateRecord(
  record: ParsedRecord
): ValidationResult {
  for (const rule of VALIDATION_RULES) {
    const value = record[rule.field];
    if (!rule.validate(value, record as unknown as Record<string, unknown>)) {
      return {
        isValid: false,
        errorType: rule.errorType,
        errorMessage: rule.message,
      };
    }
  }
  return { isValid: true };
}

export function getErrorTypeLabel(errorType: ErrorType): string {
  const labels: Record<ErrorType, string> = {
    format_error: '编号格式错误',
    invalid_reading: '读数异常',
    invalid_time: '时间异常',
    missing_multiplier: '倍率缺失',
    late_supplement: '补录晚到',
  };
  return labels[errorType] || '未知错误';
}

export function getErrorTypeColor(errorType: ErrorType): string {
  const colors: Record<ErrorType, string> = {
    format_error: 'bg-blue-100 text-blue-800 border-blue-200',
    invalid_reading: 'bg-red-100 text-red-800 border-red-200',
    invalid_time: 'bg-amber-100 text-amber-800 border-amber-200',
    missing_multiplier: 'bg-purple-100 text-purple-800 border-purple-200',
    late_supplement: 'bg-orange-100 text-orange-800 border-orange-200',
  };
  return colors[errorType] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function sanitizeValue(value: unknown, defaultValue: unknown = ''): unknown {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value.trim();
  return value;
}
