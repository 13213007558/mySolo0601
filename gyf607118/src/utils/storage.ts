import type { BatteryRecord, OperationLog, SupplementRecord } from '../types';

const STORAGE_KEY = 'energy-battery-tracker-v1';
const MAX_HISTORY_STEPS = 50;

interface StorageData {
  records: BatteryRecord[];
  operationLogs: OperationLog[];
  supplementRecords: SupplementRecord[];
  historyStack: BatteryRecord[][];
  version: string;
}

const CURRENT_VERSION = '1.0.0';

const getDefaultData = (): StorageData => ({
  records: [],
  operationLogs: [],
  supplementRecords: [],
  historyStack: [],
  version: CURRENT_VERSION,
});

const migrateData = (data: any): StorageData => {
  if (!data.version || data.version < CURRENT_VERSION) {
    console.log(`数据版本迁移: ${data.version || '0.0.0'} -> ${CURRENT_VERSION}`);
    return {
      ...getDefaultData(),
      ...data,
      version: CURRENT_VERSION,
    };
  }
  return data as StorageData;
};

export const loadFromStorage = (): StorageData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultData();
    }
    const data = JSON.parse(raw);
    return migrateData(data);
  } catch (error) {
    console.error('读取本地存储失败:', error);
    return getDefaultData();
  }
};

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const saveToStorage = (data: Partial<StorageData>): void => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    try {
      const existing = loadFromStorage();
      const toSave: StorageData = {
        ...existing,
        ...data,
        version: CURRENT_VERSION,
        historyStack: (data.historyStack || existing.historyStack).slice(-MAX_HISTORY_STEPS),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      
      if (toSave.records.length > 100) {
        console.warn('警告：记录数量超过100条，建议清理旧数据');
      }
    } catch (error) {
      console.error('保存本地存储失败:', error);
    }
  }, 100);
};

export const clearStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getStorageInfo = (): { size: string; recordCount: number } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : getDefaultData();
    const size = new Blob([raw || '']).size;
    return {
      size: `${(size / 1024).toFixed(2)} KB`,
      recordCount: data.records.length,
    };
  } catch {
    return { size: '0 KB', recordCount: 0 };
  }
};
