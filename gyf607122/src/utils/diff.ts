import type { DiffResult, SupplementRecord } from '@/types';
import dayjs from 'dayjs';

const fieldNameMap: Record<string, string> = {
  hostId: '主机编号',
  hostName: '主机名称',
  startTime: '开始时间',
  endTime: '结束时间',
  operationType: '操作类型',
  reason: '原因说明',
};

export function compareData<T extends Record<string, any>>(
  oldData: Partial<T>,
  newData: Partial<T>,
  customFieldMap?: Record<string, string>
): DiffResult[] {
  const results: DiffResult[] = [];
  const fieldMap = customFieldMap || fieldNameMap;
  const allFields = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  allFields.forEach(field => {
    const oldValue = oldData[field as keyof T];
    const newValue = newData[field as keyof T];
    const fieldName = fieldMap[field] || field;

    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);

    if (oldStr === newStr) return;

    if (oldValue === undefined && newValue !== undefined) {
      results.push({
        field,
        fieldName,
        oldValue,
        newValue,
        changeType: 'add'
      });
    } else if (oldValue !== undefined && newValue === undefined) {
      results.push({
        field,
        fieldName,
        oldValue,
        newValue,
        changeType: 'delete'
      });
    } else {
      results.push({
        field,
        fieldName,
        oldValue,
        newValue,
        changeType: 'modify'
      });
    }
  });

  return results;
}

export function compareSupplementRecords(
  original: Partial<SupplementRecord>,
  updated: Partial<SupplementRecord>
): DiffResult[] {
  return compareData(original, updated, fieldNameMap);
}

export function formatValue(value: any): string {
  if (value === undefined || value === null) return '-';
  if (dayjs.isDayjs(value) || (typeof value === 'string' && dayjs(value).isValid())) {
    return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
  }
  if (value === 'start') return '启动';
  if (value === 'stop') return '停止';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function getDiffStats(diffs: DiffResult[]) {
  return {
    total: diffs.length,
    added: diffs.filter(d => d.changeType === 'add').length,
    modified: diffs.filter(d => d.changeType === 'modify').length,
    deleted: diffs.filter(d => d.changeType === 'delete').length,
  };
}

export function createSupplementRecordWithDiff(
  data: Omit<SupplementRecord, 'id' | 'createTime' | 'originalData' | 'diffFields'>,
  originalData?: Partial<SupplementRecord>
): SupplementRecord {
  const diffs = originalData ? compareSupplementRecords(originalData, data) : [];
  
  return {
    ...data,
    id: `SUP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createTime: dayjs().toISOString(),
    originalData,
    diffFields: diffs.map(d => d.field),
  };
}
