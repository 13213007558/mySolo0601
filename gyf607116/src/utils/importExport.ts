import type { GunRecord, ExportData, ImportResult, DuplicateInfo } from '../types';
import { generateId } from './time';

export function exportToJson(records: GunRecord[]): string {
  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: '能源充电枪复核台',
    records: records
  };
  return JSON.stringify(exportData, null, 2);
}

export function downloadJson(records: GunRecord[], filename?: string): void {
  const json = exportToJson(records);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = filename || `充电枪记录_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseJsonFile(file: File): Promise<GunRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;
        
        if (!data.records || !Array.isArray(data.records)) {
          reject(new Error('文件格式错误：未找到 records 数组'));
          return;
        }
        
        const validRecords = data.records.filter(validateRecord);
        resolve(validRecords);
      } catch (error) {
        reject(new Error(`JSON 解析失败：${error instanceof Error ? error.message : '未知错误'}`));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

export function validateRecord(record: Partial<GunRecord>): record is GunRecord {
  if (!record.gunCode || typeof record.gunCode !== 'string') return false;
  if (!record.timestamp || typeof record.timestamp !== 'string') return false;
  if (!record.operator || typeof record.operator !== 'string') return false;
  if (!record.action || (record.action !== 'insert' && record.action !== 'remove')) return false;
  if (typeof record.remark !== 'string') return false;
  if (typeof record.isManualEntry !== 'boolean') return false;
  
  const timestamp = new Date(record.timestamp);
  if (isNaN(timestamp.getTime())) return false;
  
  return true;
}

export function detectDuplicates(
  newRecords: GunRecord[],
  existingRecords: GunRecord[]
): { unique: GunRecord[]; duplicates: DuplicateInfo[] } {
  const duplicates: DuplicateInfo[] = [];
  const unique: GunRecord[] = [];
  const now = new Date().toISOString();
  
  const existingKeys = new Map(
    existingRecords.map(r => [`${r.gunCode}-${r.timestamp}-${r.action}`, r])
  );
  
  newRecords.forEach(newRecord => {
    const key = `${newRecord.gunCode}-${newRecord.timestamp}-${newRecord.action}`;
    const existing = existingKeys.get(key);
    
    if (existing) {
      const recordWithOriginal: GunRecord = {
        ...newRecord,
        id: newRecord.id || generateId(),
        status: 'duplicate',
        originalRecordId: existing.id,
        originalValue: { ...existing },
        isManualEntry: newRecord.isManualEntry ?? false,
        createdAt: newRecord.createdAt || now,
        updatedAt: now,
        source: newRecord.source || 'import'
      };
      duplicates.push({ newRecord: recordWithOriginal, existingRecord: existing });
      unique.push(recordWithOriginal);
    } else {
      unique.push({
        ...newRecord,
        id: newRecord.id || generateId(),
        status: newRecord.status || 'normal',
        isManualEntry: newRecord.isManualEntry ?? false,
        createdAt: newRecord.createdAt || now,
        updatedAt: now,
        source: newRecord.source || 'import'
      });
    }
  });
  
  return { unique, duplicates };
}

export async function importFromFile(
  file: File,
  existingRecords: GunRecord[]
): Promise<ImportResult> {
  const result: ImportResult = {
    added: [],
    duplicates: [],
    errors: []
  };
  
  try {
    const records = await parseJsonFile(file);
    
    if (records.length === 0) {
      result.errors.push('文件中没有有效的记录');
      return result;
    }
    
    const { unique, duplicates } = detectDuplicates(records, existingRecords);
    
    result.added = unique;
    result.duplicates = duplicates;
    
    if (duplicates.length > 0) {
      result.errors.push(`检测到 ${duplicates.length} 条重复记录，已标记并保留原始值`);
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : '导入失败');
  }
  
  return result;
}

export function getRecordKey(record: GunRecord): string {
  return `${record.gunCode}-${record.timestamp}-${record.action}`;
}
