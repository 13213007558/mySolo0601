import type { UserRole, StorageScope } from '@/types';
import { ROLE_CONFIGS } from '@/config/roles';

const STORAGE_PREFIX = 'hotspot-inspection';
const ENCRYPTION_KEY = 'hs-inspect-2024';

function simpleEncrypt(data: string, role: UserRole): string {
  const roleSalt = ROLE_CONFIGS[role].role;
  const combined = `${roleSalt}|${data}`;
  return btoa(encodeURIComponent(combined));
}

function simpleDecrypt(encrypted: string, expectedRole: UserRole): string | null {
  try {
    const decoded = decodeURIComponent(atob(encrypted));
    const [roleSalt, data] = decoded.split('|');
    if (roleSalt !== ROLE_CONFIGS[expectedRole].role) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function getStorageKey(key: string, scope: StorageScope, role?: UserRole): string {
  if (scope === 'role-restricted' && role) {
    return `${STORAGE_PREFIX}:${scope}:${role}:${key}`;
  }
  return `${STORAGE_PREFIX}:${scope}:${key}`;
}

export function setStorageItem<T>(
  key: string,
  value: T,
  scope: StorageScope = 'public',
  role?: UserRole
): void {
  const storageKey = getStorageKey(key, scope, role);
  let storedValue: string;

  if (scope === 'role-restricted' && role) {
    const jsonValue = JSON.stringify(value);
    storedValue = simpleEncrypt(jsonValue, role);
  } else {
    storedValue = JSON.stringify(value);
  }

  localStorage.setItem(storageKey, storedValue);
}

export function getStorageItem<T>(
  key: string,
  scope: StorageScope = 'public',
  role?: UserRole
): T | null {
  const storageKey = getStorageKey(key, scope, role);
  const storedValue = localStorage.getItem(storageKey);

  if (!storedValue) {
    return null;
  }

  try {
    if (scope === 'role-restricted' && role) {
      const decrypted = simpleDecrypt(storedValue, role);
      if (!decrypted) {
        return null;
      }
      return JSON.parse(decrypted) as T;
    }
    return JSON.parse(storedValue) as T;
  } catch {
    return null;
  }
}

export function removeStorageItem(
  key: string,
  scope: StorageScope = 'public',
  role?: UserRole
): void {
  const storageKey = getStorageKey(key, scope, role);
  localStorage.removeItem(storageKey);
}

export function setSessionItem<T>(key: string, value: T): void {
  sessionStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value));
}

export function getSessionItem<T>(key: string): T | null {
  const stored = sessionStorage.getItem(`${STORAGE_PREFIX}:${key}`);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

export function removeSessionItem(key: string): void {
  sessionStorage.removeItem(`${STORAGE_PREFIX}:${key}`);
}

export function clearAllRoleStorage(role: UserRole): void {
  const prefix = `${STORAGE_PREFIX}:role-restricted:${role}:`;
  Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .forEach(key => localStorage.removeItem(key));
}

export function getCurrentRoleFromStorage(): UserRole | null {
  const role = getStorageItem<UserRole>('current-role', 'public');
  return role;
}

export function setCurrentRoleToStorage(role: UserRole): void {
  setStorageItem('current-role', role, 'public');
}
