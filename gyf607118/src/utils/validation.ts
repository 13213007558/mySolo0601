import type { FormatIssue, AnomalyCheck, BatteryRecord } from '../types';

const OLD_FORMAT_REGEX = /^BAT-\d{4}-\d{3}$/;
const NEW_FORMAT_REGEX = /^B-\d{6}-\d{4}$/;

export const detectBatteryNoFormat = (batteryNo: string): FormatIssue => {
  const trimmed = batteryNo.trim();
  
  if (OLD_FORMAT_REGEX.test(trimmed)) {
    const parts = trimmed.split('-');
    const year = parts[1];
    const seq = parts[2];
    const suggested = `B-${year}01-${seq.padStart(4, '0')}`;
    
    return {
      hasIssue: true,
      detectedFormat: 'old',
      suggestedFormat: suggested,
      message: `注意：这条记录用的是旧编号格式 ${trimmed}，现在已经统一改用 ${suggested} 格式啦`,
    };
  }
  
  if (NEW_FORMAT_REGEX.test(trimmed)) {
    return {
      hasIssue: false,
      detectedFormat: 'new',
      suggestedFormat: trimmed,
      message: '',
    };
  }
  
  return {
    hasIssue: true,
    detectedFormat: 'unknown',
    suggestedFormat: 'B-YYYYMM-NNNN',
    message: `注意：${trimmed} 这个编号格式不太对哦，标准格式应该是 B-YYYYMM-NNNN（比如 B-202406-0001）`,
  };
};

export const checkAnomaly = (record: Partial<BatteryRecord>, allRecords: BatteryRecord[]): AnomalyCheck => {
  const reasons: string[] = [];
  
  if (record.voltage !== undefined) {
    if (record.voltage < 3.2) {
      reasons.push(`电压 ${record.voltage}V 偏低，正常范围是 3.2V-4.2V`);
    } else if (record.voltage > 4.2) {
      reasons.push(`电压 ${record.voltage}V 偏高，正常范围是 3.2V-4.2V`);
    }
  }
  
  if (record.temperature !== undefined) {
    if (record.temperature < 0) {
      reasons.push(`温度 ${record.temperature}°C 过低，正常范围是 0°C-55°C`);
    } else if (record.temperature > 55) {
      reasons.push(`温度 ${record.temperature}°C 过高，正常范围是 0°C-55°C`);
    }
  }
  
  if (record.batteryNo && record.exchangeDate) {
    const duplicate = allRecords.find(
      r => r.batteryNo === record.batteryNo && 
           r.exchangeDate === record.exchangeDate &&
           r.id !== (record as BatteryRecord).id
    );
    if (duplicate) {
      reasons.push(`同一天 ${record.exchangeDate} 内同一电池 ${record.batteryNo} 出现多条记录`);
    }
  }
  
  return {
    isAnomaly: reasons.length > 0,
    reasons,
  };
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').substr(0, 19);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().substr(0, 10);
};

export const getTodayDate = (): string => {
  return formatDate(new Date());
};
