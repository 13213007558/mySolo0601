import type { Alarm, Severity, AlarmStatus } from '@/types';
import { generateId, getCurrentTime } from '@/mock/initialData';

const severityMap: Record<string, Severity> = {
  低: 'low',
  中: 'medium',
  高: 'high',
  严重: 'critical',
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
};

const statusMap: Record<string, AlarmStatus> = {
  待处理: 'pending',
  处理中: 'processing',
  已处理: 'completed',
  已复核: 'reviewed',
  已撤回: 'withdrawn',
  pending: 'pending',
  processing: 'processing',
  completed: 'completed',
  reviewed: 'reviewed',
  withdrawn: 'withdrawn',
};

export const parseJSON = (content: string): Alarm[] => {
  try {
    const data = JSON.parse(content);
    const alarms = Array.isArray(data) ? data : data.alarms || [];
    return alarms.map((alarm: Partial<Alarm>) => normalizeAlarm(alarm));
  } catch (error) {
    throw new Error('JSON 解析失败，请检查文件格式');
  }
};

export const parseCSV = (content: string): Alarm[] => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV 文件为空或格式不正确');
  }

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1);

  return rows.map((row) => {
    const values = parseCSVLine(row);
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return normalizeAlarmFromCSV(obj);
  });
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const normalizeAlarm = (alarm: Partial<Alarm>): Alarm => {
  const now = getCurrentTime();
  return {
    id: alarm.id || generateId('alarm'),
    siteName: alarm.siteName || '',
    bladeNo: alarm.bladeNo || '',
    defectType: alarm.defectType || '',
    severity: (alarm.severity && severityMap[alarm.severity]
      ? severityMap[alarm.severity]
      : alarm.severity) as Severity || 'medium',
    status: (alarm.status && statusMap[alarm.status]
      ? statusMap[alarm.status]
      : alarm.status) as AlarmStatus || 'pending',
    conclusion: alarm.conclusion || '',
    contactPhone: alarm.contactPhone || '',
    handler: alarm.handler || '周顾问',
    createdAt: alarm.createdAt || now,
    updatedAt: alarm.updatedAt || now,
    isManualSupplement: alarm.isManualSupplement || false,
    originalData: alarm.originalData,
  };
};

const normalizeAlarmFromCSV = (obj: Record<string, string>): Alarm => {
  const headerMap: Record<string, string> = {
    ID: 'id',
    站点名称: 'siteName',
    叶片编号: 'bladeNo',
    缺陷类型: 'defectType',
    严重程度: 'severity',
    状态: 'status',
    处理结论: 'conclusion',
    联系电话: 'contactPhone',
    处理人: 'handler',
    创建时间: 'createdAt',
    更新时间: 'updatedAt',
    手工补录: 'isManualSupplement',
  };

  const normalized: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    const mappedKey = headerMap[key] || key;
    if (mappedKey === 'severity') {
      normalized[mappedKey] = severityMap[value] || value;
    } else if (mappedKey === 'status') {
      normalized[mappedKey] = statusMap[value] || value;
    } else if (mappedKey === 'isManualSupplement') {
      normalized[mappedKey] = value === '是' || value === 'true';
    } else {
      normalized[mappedKey] = value;
    }
  });

  return normalizeAlarm(normalized as Partial<Alarm>);
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};
