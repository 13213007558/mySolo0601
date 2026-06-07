import type { DisinfectionRecord } from '../../src/types/index.js';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface UnitCheckResult {
  hasMixedUnits: boolean;
  fieldName?: string;
  message?: string;
}

export function checkUnitConsistency(record: Partial<DisinfectionRecord>): UnitCheckResult {
  if (record.temperature !== undefined) {
    if (record.temperature < -50 || record.temperature > 300) {
      return {
        hasMixedUnits: true,
        fieldName: 'temperature',
        message: `温度值 ${record.temperature} 疑似单位混用（应使用摄氏度，合理范围0-150℃）`,
      };
    }
  }
  if (record.duration !== undefined) {
    if (record.duration > 500) {
      return {
        hasMixedUnits: true,
        fieldName: 'duration',
        message: `时长值 ${record.duration} 疑似单位混用（应使用分钟，合理范围1-120分钟）`,
      };
    }
  }
  return { hasMixedUnits: false };
}

export function validateDisinfectionRecord(
  record: Partial<DisinfectionRecord>,
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (record.temperature !== undefined && record.temperature !== 0) {
    if (record.temperature < 0) {
      errors.push(`温度不能为负数：${record.temperature}`);
    } else if (record.temperature < 60) {
      warnings.push(`温度偏低：${record.temperature}℃，消毒效果可能不足`);
    } else if (record.temperature > 150) {
      warnings.push(`温度偏高：${record.temperature}℃，可能损坏物品`);
    }
  }

  if (record.duration !== undefined && record.duration !== 0) {
    if (record.duration < 0) {
      errors.push(`时长不能为负数：${record.duration}`);
    } else if (record.duration < 5) {
      warnings.push(`时长偏短：${record.duration}分钟，建议至少15分钟`);
    }
  }

  const unitCheck = checkUnitConsistency(record);
  if (unitCheck.hasMixedUnits) {
    warnings.push(unitCheck.message!);
  }

  if (record.status === 'completed') {
    if (!record.actualTime) {
      errors.push('已完成记录必须包含实际完成时间');
    }
    if (!record.operatorId) {
      warnings.push('已完成记录建议包含操作人');
    }
  }

  if (record.status === 'exception' && !record.exceptionNote) {
    warnings.push('异常状态建议填写异常说明');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export interface PartialSuccessResult<T> {
  success: boolean;
  totalCount: number;
  successCount: number;
  failedCount: number;
  failedItems: Array<{ index: number; reason: string }>;
  items: T[];
}

export function processWithPartialSuccess<T, U>(
  items: T[],
  processor: (item: T, index: number) => { result: U | null; error?: string },
): PartialSuccessResult<U> {
  const results: U[] = [];
  const failedItems: Array<{ index: number; reason: string }> = [];

  items.forEach((item, index) => {
    try {
      const { result, error } = processor(item, index);
      if (result !== null && result !== undefined) {
        results.push(result);
      } else {
        failedItems.push({ index, reason: error || '处理失败' });
      }
    } catch (e) {
      failedItems.push({ index, reason: e instanceof Error ? e.message : '未知错误' });
    }
  });

  return {
    success: failedItems.length === 0,
    totalCount: items.length,
    successCount: results.length,
    failedCount: failedItems.length,
    failedItems,
    items: results,
  };
}
