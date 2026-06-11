import type { Batch, DoorWindowRecord, MissingPart, ReplenishHistory, Settings } from './types';
import { normalizeOpeningCode, generateId } from './utils';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const batches = $state<Batch[]>(loadFromStorage('dw_batches', []));
const records = $state<DoorWindowRecord[]>(loadFromStorage('dw_records', []));
const missingParts = $state<MissingPart[]>(loadFromStorage('dw_missing', []));
const replenishHistories = $state<ReplenishHistory[]>(loadFromStorage('dw_replenish', []));
const settings = $state<Settings>(loadFromStorage('dw_settings', { currentResponsible: '', lastUpdated: '' }));

function persistBatches() { saveToStorage('dw_batches', batches); }
function persistRecords() { saveToStorage('dw_records', records); }
function persistMissing() { saveToStorage('dw_missing', missingParts); }
function persistReplenish() { saveToStorage('dw_replenish', replenishHistories); }
function persistSettings() { saveToStorage('dw_settings', settings); }

export function getStore() {
  return {
    get batches() { return batches; },
    get records() { return records; },
    get missingParts() { return missingParts; },
    get replenishHistories() { return replenishHistories; },
    get settings() { return settings; },

    addBatch(data: Omit<Batch, 'id' | 'createdAt'>) {
      batches.push({ ...data, id: generateId(), createdAt: new Date().toISOString() });
      persistBatches();
    },

    updateBatch(id: string, data: Partial<Omit<Batch, 'id' | 'createdAt'>>) {
      const idx = batches.findIndex(b => b.id === id);
      if (idx !== -1) {
        Object.assign(batches[idx], data);
        persistBatches();
      }
    },

    deleteBatch(id: string) {
      const idx = batches.findIndex(b => b.id === id);
      if (idx !== -1) {
        batches.splice(idx, 1);
        persistBatches();
      }
    },

    addRecord(data: Omit<DoorWindowRecord, 'id' | 'openingCodeNormalized' | 'isDuplicate' | 'createdAt' | 'updatedAt'>) {
      const normalized = normalizeOpeningCode(data.openingCode);
      const isDuplicate = records.some(r => r.batchId === data.batchId && r.openingCodeNormalized === normalized);
      records.push({
        ...data,
        id: generateId(),
        openingCodeNormalized: normalized,
        isDuplicate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      persistRecords();
    },

    updateRecord(id: string, data: Partial<Omit<DoorWindowRecord, 'id' | 'createdAt'>>) {
      const idx = records.findIndex(r => r.id === id);
      if (idx !== -1) {
        if (data.openingCode !== undefined) {
          data.openingCodeNormalized = normalizeOpeningCode(data.openingCode);
          data.isDuplicate = records.some(
            r => r.id !== id && r.batchId === records[idx].batchId && r.openingCodeNormalized === data.openingCodeNormalized
          );
        }
        Object.assign(records[idx], data, { updatedAt: new Date().toISOString() });
        persistRecords();
      }
    },

    deleteRecord(id: string) {
      const idx = records.findIndex(r => r.id === id);
      if (idx !== -1) {
        records.splice(idx, 1);
        persistRecords();
      }
    },

    acceptBatch(batchId: string) {
      for (let i = 0; i < records.length; i++) {
        if (records[i].batchId === batchId && records[i].status === 'pending') {
          records[i].status = 'accepted';
          records[i].updatedAt = new Date().toISOString();
        }
      }
      const batchIdx = batches.findIndex(b => b.id === batchId);
      if (batchIdx !== -1) {
        const allAccepted = records.filter(r => r.batchId === batchId).every(r => r.status === 'accepted');
        batches[batchIdx].status = allAccepted ? 'accepted' : 'partial_accepted';
      }
      persistRecords();
      persistBatches();
    },

    addMissingPart(data: Omit<MissingPart, 'id' | 'createdAt' | 'updatedAt'>) {
      missingParts.push({
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      persistMissing();
    },

    updateMissingPart(id: string, data: Partial<Omit<MissingPart, 'id' | 'createdAt'>>) {
      const idx = missingParts.findIndex(m => m.id === id);
      if (idx !== -1) {
        Object.assign(missingParts[idx], data, { updatedAt: new Date().toISOString() });
        persistMissing();
      }
    },

    deleteMissingPart(id: string) {
      const idx = missingParts.findIndex(m => m.id === id);
      if (idx !== -1) {
        missingParts.splice(idx, 1);
        persistMissing();
      }
    },

    replenish(missingId: string, replenishedQty: number, note: string) {
      const idx = missingParts.findIndex(m => m.id === missingId);
      if (idx === -1) return;
      const part = missingParts[idx];
      replenishHistories.push({
        id: generateId(),
        missingId,
        replenishedQty,
        responsible: settings.currentResponsible,
        note,
        createdAt: new Date().toISOString()
      });
      part.updatedAt = new Date().toISOString();
      if (replenishedQty >= part.quantity) {
        part.status = 'resolved';
      } else {
        part.status = 'partial';
      }
      persistMissing();
      persistReplenish();
    },

    changeResponsible(name: string) {
      settings.currentResponsible = name;
      settings.lastUpdated = new Date().toISOString();
      persistSettings();
    }
  };
}
