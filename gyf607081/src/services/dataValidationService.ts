import { CheckRecord, TemperatureRecord, DataStatus } from '../types';

export interface ValidationResult {
  dataStatus: DataStatus;
  issues: string[];
}

export function validateTemperatureRecord(temp: TemperatureRecord): ValidationResult {
  const issues: string[] = [];

  if (!temp.temperature || temp.temperature < 35 || temp.temperature > 42) {
    issues.push('体温值异常');
  }

  if (!temp.measureTime) {
    issues.push('缺少测量时间');
  }

  if (!temp.operator) {
    issues.push('缺少操作人');
  }

  if (!temp.remark || temp.remark.trim() === '') {
    issues.push('备注不完整');
  }

  if (temp.temperature >= 37.5) {
    issues.push('体温偏高，需关注');
  }

  if (issues.length > 0) {
    return { dataStatus: DataStatus.DIRTY, issues };
  }

  return { dataStatus: DataStatus.NORMAL, issues: [] };
}

export function validateCheckRecord(
  record: CheckRecord,
  tempRecord?: TemperatureRecord
): ValidationResult {
  const issues: string[] = [];

  if (!record.temperatureRecordId && !record.leaveNoteId) {
    return {
      dataStatus: DataStatus.EMPTY,
      issues: ['缺少体温记录和请假条，数据不完整']
    };
  }

  if (tempRecord) {
    const tempValidation = validateTemperatureRecord(tempRecord);
    if (tempValidation.dataStatus === DataStatus.DIRTY) {
      issues.push(...tempValidation.issues);
    }
  }

  if (!record.currentRemark || record.currentRemark.trim() === '') {
    issues.push('缺少处理备注');
  }

  if (issues.length > 0) {
    return { dataStatus: DataStatus.DIRTY, issues };
  }

  return { dataStatus: DataStatus.NORMAL, issues: [] };
}

export function getDataStatusColor(status: DataStatus): string {
  const map: Record<DataStatus, string> = {
    [DataStatus.NORMAL]: '#2A9D8F',
    [DataStatus.DIRTY]: '#E9C46A',
    [DataStatus.EMPTY]: '#E63946'
  };
  return map[status];
}

export function getDataStatusBgColor(status: DataStatus): string {
  const map: Record<DataStatus, string> = {
    [DataStatus.NORMAL]: 'bg-emerald-50',
    [DataStatus.DIRTY]: 'bg-amber-50',
    [DataStatus.EMPTY]: 'bg-red-50'
  };
  return map[status];
}

export function getDataStatusBorderColor(status: DataStatus): string {
  const map: Record<DataStatus, string> = {
    [DataStatus.NORMAL]: 'border-emerald-300',
    [DataStatus.DIRTY]: 'border-amber-300',
    [DataStatus.EMPTY]: 'border-red-300'
  };
  return map[status];
}

export function getDataStatusText(status: DataStatus): string {
  const map: Record<DataStatus, string> = {
    [DataStatus.NORMAL]: '正常数据',
    [DataStatus.DIRTY]: '脏数据',
    [DataStatus.EMPTY]: '空数据'
  };
  return map[status];
}

export function getDataStatusDescription(status: DataStatus): string {
  const map: Record<DataStatus, string> = {
    [DataStatus.NORMAL]: '数据完整，校验通过',
    [DataStatus.DIRTY]: '数据存在异常，需人工复核',
    [DataStatus.EMPTY]: '关键数据缺失，请补录'
  };
  return map[status];
}
