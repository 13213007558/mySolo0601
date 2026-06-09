import type { UserRole } from '@/types';

export interface SensitiveFieldConfig {
  field: string;
  fieldName: string;
  roles: UserRole[];
}

export const sensitiveFields: SensitiveFieldConfig[] = [
  { field: 'location.detail', fieldName: '具体位置', roles: ['operator', 'engineer', 'master_ye'] },
  { field: 'location.coordinates', fieldName: '坐标', roles: ['operator', 'engineer', 'master_ye'] },
  { field: 'processorName', fieldName: '处理人', roles: ['operator', 'master_ye'] },
  { field: 'params.temperature', fieldName: '温度', roles: ['operator', 'master_ye'] },
  { field: 'params.pressure', fieldName: '压力', roles: ['operator', 'master_ye'] },
  { field: 'params.voltage', fieldName: '电压', roles: ['operator', 'master_ye'] },
  { field: 'params.currentPower', fieldName: '当前功率', roles: ['operator', 'master_ye'] },
];

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  const lastPart = parts.pop()!;
  const target = parts.reduce((acc, part) => {
    if (!acc[part]) acc[part] = {};
    return acc[part];
  }, obj);
  target[lastPart] = value;
}

function desensitizeValue(value: any, field: string, fieldName: string): any {
  if (value === undefined || value === null) return value;

  if (typeof value === 'string') {
    if (field.includes('Name') || fieldName.includes('人')) {
      if (value.length > 1) {
        return value[0] + '*'.repeat(value.length - 1);
      }
      return value;
    }

    if (field.includes('location') || field.includes('detail') || fieldName.includes('位置')) {
      const match = value.match(/^([A-Za-z\u4e00-\u9fa5]+区)/);
      if (match) {
        return match[1] + '（具体位置已脱敏）';
      }
      return '位置信息已脱敏';
    }
  }

  if (field.includes('coordinates') || fieldName.includes('坐标')) {
    if (value?.lat !== undefined && value?.lng !== undefined) {
      return {
        lat: Math.round(value.lat * 100) / 100,
        lng: Math.round(value.lng * 100) / 100,
        note: '坐标已模糊处理'
      };
    }
  }

  if (typeof value === 'number') {
    if (field.match(/temperature|pressure|voltage|Power/) || 
        fieldName.match(/温度|压力|电压|功率/)) {
      if (value < 10) return '<10';
      if (value < 50) return '10-50';
      if (value < 100) return '50-100';
      if (value < 200) return '100-200';
      return '>200';
    }
  }

  return value;
}

export function desensitizeByRole<T extends Record<string, any>>(
  data: T,
  role: UserRole,
  customSensitiveFields?: SensitiveFieldConfig[]
): T {
  if (role === 'admin') {
    return { ...data };
  }

  const result = JSON.parse(JSON.stringify(data)) as T;
  const fields = customSensitiveFields || sensitiveFields;

  for (const config of fields) {
    if (config.roles.includes(role)) {
      const value = getNestedValue(result, config.field);
      if (value !== undefined) {
        const desensitized = desensitizeValue(value, config.field, config.fieldName);
        setNestedValue(result, config.field, desensitized);
      }
    }
  }

  return result;
}

export function desensitizeListByRole<T extends Record<string, any>>(
  dataList: T[],
  role: UserRole,
  customSensitiveFields?: SensitiveFieldConfig[]
): T[] {
  return dataList.map(item => desensitizeByRole(item, role, customSensitiveFields));
}

export function shouldDesensitizeField(field: string, role: UserRole): boolean {
  if (role === 'admin') return false;
  const config = sensitiveFields.find(f => f.field === field);
  return config ? config.roles.includes(role) : false;
}
