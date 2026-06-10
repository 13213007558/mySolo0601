import { STORAGE_KEYS } from '@/types';
import type { AcceptanceRecord, StatusHistory, User } from '@/types';

export function saveToStorage<T>(key: string, data: T): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
  } catch (e) {
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      throw new Error('存储容量不足，请删除部分数据后重试');
    }
    throw e;
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const json = localStorage.getItem(key);
    if (!json) return defaultValue;
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

export function loadRecords(): AcceptanceRecord[] {
  return loadFromStorage<AcceptanceRecord[]>(STORAGE_KEYS.RECORDS, []);
}

export function saveRecords(records: AcceptanceRecord[]): void {
  saveToStorage(STORAGE_KEYS.RECORDS, records);
}

export function loadHistory(): StatusHistory[] {
  return loadFromStorage<StatusHistory[]>(STORAGE_KEYS.HISTORY, []);
}

export function saveHistory(history: StatusHistory[]): void {
  saveToStorage(STORAGE_KEYS.HISTORY, history);
}

export function loadCurrentUser(): User | null {
  return loadFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function saveCurrentUser(user: User | null): void {
  saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getStorageSize(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      total += localStorage.getItem(key)?.length || 0;
    }
  }
  return total;
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.RECORDS);
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}
