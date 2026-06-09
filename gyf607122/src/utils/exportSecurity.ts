import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import type { User } from '@/types';
import { desensitizeByRole } from './desensitize';

export interface ExportOptions {
  includeSensitive?: boolean;
  addWatermark?: boolean;
  sheetName?: string;
}

export function exportToExcel<T extends Record<string, any>>(
  records: T[],
  user: User,
  options: ExportOptions = {}
): Blob {
  const { includeSensitive = false, addWatermark = true, sheetName = '数据导出' } = options;

  let processedRecords = records;
  
  if (!includeSensitive || user.role !== 'admin') {
    processedRecords = records.map(r => desensitizeByRole(r, user.role));
  }

  const exportRecords = processedRecords.map(record => {
    const flattened: Record<string, any> = {};
    Object.entries(record).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          flattened[`${key}.${subKey}`] = subValue;
        });
      } else if (Array.isArray(value)) {
        flattened[key] = value.join('；');
      } else {
        flattened[key] = value;
      }
    });
    return flattened;
  });

  const ws = XLSX.utils.json_to_sheet(exportRecords);

  ws['!cols'] = Object.keys(exportRecords[0] || {}).map(() => ({ wch: 15 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  if (addWatermark) {
    const watermarkData = [
      { '导出信息': '---' },
      { '导出人': user.name },
      { '工号': user.employeeId },
      { '角色': user.role },
      { '导出时间': dayjs().format('YYYY-MM-DD HH:mm:ss') },
      { '数据条数': records.length },
      { '是否脱敏': includeSensitive && user.role === 'admin' ? '否' : '是' },
    ];
    const wsWatermark = XLSX.utils.json_to_sheet(watermarkData);
    wsWatermark['!cols'] = [{ wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsWatermark, '导出信息');
  }

  return new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readExcelFile<T extends Record<string, any>>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsBinaryString(file);
  });
}

export function generateFileName(prefix: string): string {
  const timestamp = dayjs().format('YYYYMMDD_HHmmss');
  return `${prefix}_${timestamp}.xlsx`;
}

export function verifyExportIntegrity<T extends Record<string, any>>(
  originalRecords: T[],
  importedRecords: T[],
  keyField: string
): { valid: boolean; missing: T[]; extra: T[]; different: T[] } {
  const originalMap = new Map(originalRecords.map(r => [r[keyField], r]));
  const importedMap = new Map(importedRecords.map(r => [r[keyField], r]));

  const missing: T[] = [];
  const extra: T[] = [];
  const different: T[] = [];

  originalRecords.forEach(record => {
    const key = record[keyField];
    const imported = importedMap.get(key);
    if (!imported) {
      missing.push(record);
    } else if (JSON.stringify(record) !== JSON.stringify(imported)) {
      different.push(imported);
    }
  });

  importedRecords.forEach(record => {
    const key = record[keyField];
    if (!originalMap.has(key)) {
      extra.push(record);
    }
  });

  return {
    valid: missing.length === 0 && extra.length === 0 && different.length === 0,
    missing,
    extra,
    different
  };
}
