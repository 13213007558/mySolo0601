import type { BracketRecord, ErrorType, ValidationResult } from '@/types';

const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

const isValidAngle = (angle: number): boolean => {
  return typeof angle === 'number' && !isNaN(angle) && angle >= 0 && angle <= 90;
};

const isValidBracketNo = (no: string): boolean => {
  return typeof no === 'string' && no.length > 0 && /^[A-Za-z0-9-]+$/.test(no);
};

export const validateRecord = (record: Partial<BracketRecord>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let errorType: ErrorType | undefined;

  if (!record.bracketNo || !isValidBracketNo(record.bracketNo)) {
    errors.push('支架编号格式无效或缺失');
    errorType = 'missing_data';
  }

  if (!record.installDate || !isValidDate(record.installDate)) {
    errors.push(`安装日期格式错误: ${record.installDate || '为空'}`);
    errorType = errorType || 'format_error';
  }

  if (!record.location || record.location.trim().length === 0) {
    warnings.push('位置信息为空');
  }

  if (record.currentAngle === undefined || !isValidAngle(record.currentAngle)) {
    errors.push(`当前角度异常: ${record.currentAngle} (有效范围 0-90°)`);
    errorType = errorType || 'angle_abnormal';
  }

  if (record.targetAngle === undefined || !isValidAngle(record.targetAngle)) {
    errors.push(`目标角度异常: ${record.targetAngle} (有效范围 0-90°)`);
    errorType = errorType || 'angle_abnormal';
  }

  if (!record.handler || record.handler.trim().length === 0) {
    errors.push('处理人信息缺失');
    errorType = errorType || 'missing_data';
  }

  if (!record.processDate || !isValidDate(record.processDate)) {
    errors.push(`处理日期格式错误或缺失: ${record.processDate || '为空'}`);
    errorType = errorType || 'format_error';
  }

  if (record.status === 'processed' && record.currentAngle !== record.targetAngle) {
    errors.push(`状态冲突: 标记为已处理但当前角度(${record.currentAngle}°)与目标角度(${record.targetAngle}°)不一致`);
    errorType = errorType || 'status_conflict';
  }

  if (record.processDate && isValidDate(record.processDate) && record.installDate && isValidDate(record.installDate)) {
    if (new Date(record.processDate) < new Date(record.installDate)) {
      warnings.push('处理日期早于安装日期，请确认');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    errorType,
  };
};

export const parseCSV = (content: string): Partial<BracketRecord>[] => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const records: Partial<BracketRecord>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const record: Partial<BracketRecord> = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      switch (header) {
        case 'bracketno':
        case '支架编号':
          record.bracketNo = value;
          break;
        case 'installdate':
        case '安装日期':
          record.installDate = value;
          break;
        case 'location':
        case '位置':
          record.location = value;
          break;
        case 'currentangle':
        case '当前角度':
          record.currentAngle = parseFloat(value);
          break;
        case 'targetangle':
        case '目标角度':
          record.targetAngle = parseFloat(value);
          break;
        case 'handler':
        case '处理人':
          record.handler = value;
          break;
        case 'processdate':
        case '处理日期':
          record.processDate = value;
          break;
        case 'status':
        case '状态':
          record.status = value as BracketRecord['status'];
          break;
        case 'version':
        case '版本':
          record.version = value;
          break;
        case 'remark':
        case '备注':
          record.remark = value;
          break;
      }
    });

    records.push(record);
  }

  return records;
};

export const generateId = (): string => {
  return `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateVersion = (existingVersion?: string): string => {
  if (!existingVersion) return 'v1.0';
  const match = existingVersion.match(/^v(\d+)\.(\d+)$/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10) + 1;
    return `v${major}.${minor}`;
  }
  return 'v1.0';
};
