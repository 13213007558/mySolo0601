import { create } from 'zustand';
import type { RoofShadowRecord, AerialAnnotation, SaveStatus, ThresholdConfig } from '@/types';
import { DEFAULT_THRESHOLD, generateMockRecords, generateMockAnnotation, generateId } from '@/utils/mockData';
import { validateRecord, validateRecords } from '@/utils/dataValidator';

const STORAGE_KEY = 'roof-shadow-tracker-data';
const STORAGE_VERSION = '1.0.0';

const calculateStatus = (shadowHours: number, powerEfficiency: number, config: ThresholdConfig): 'normal' | 'warning' | 'danger' => {
  if (shadowHours >= config.dangerShadowHours || powerEfficiency <= config.dangerEfficiency) {
    return 'danger';
  }
  if (shadowHours >= config.warningShadowHours || powerEfficiency <= config.warningEfficiency) {
    return 'warning';
  }
  return 'normal';
};

let saveTimeout: NodeJS.Timeout | null = null;

interface ShadowState {
  records: RoofShadowRecord[];
  annotations: AerialAnnotation[];
  selectedIds: string[];
  filterRange: { start: string; end: string } | null;
  saveStatus: SaveStatus;
  thresholdConfig: ThresholdConfig;
  lastSavedAt: string | null;
  currentUser: string;
  
  getVisibleRecords: () => RoofShadowRecord[];
  addRecord: (record: Omit<RoofShadowRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecord: (id: string, updates: Partial<RoofShadowRecord>) => boolean;
  batchUpdateStatus: (ids: string[], status: RoofShadowRecord['status']) => void;
  batchDelete: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setFilterRange: (range: { start: string; end: string } | null) => void;
  
  importData: (data: RoofShadowRecord[], annotations?: AerialAnnotation[]) => void;
  exportData: (type: 'raw' | 'modified') => RoofShadowRecord[];
  
  loadFromStorage: () => void;
  saveToStorage: () => void;
  loadMockData: () => void;
  clearAllData: () => void;
  
  addAnnotation: (annotation: Omit<AerialAnnotation, 'id'>) => void;
  updateAnnotation: (id: string, updates: Partial<AerialAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  
  setCurrentUser: (user: string) => void;
}

export const useShadowStore = create<ShadowState>((set, get) => ({
  records: [],
  annotations: [],
  selectedIds: [],
  filterRange: null,
  saveStatus: 'idle',
  thresholdConfig: DEFAULT_THRESHOLD,
  lastSavedAt: null,
  currentUser: '值班员',

  getVisibleRecords: () => {
    const state = get();
    let records = state.records.filter(r => !r.isDeleted);
    if (state.filterRange) {
      records = records.filter(r => 
        r.recordDate >= state.filterRange!.start && r.recordDate <= state.filterRange!.end
      );
    }
    return records;
  },

  addRecord: (record) => {
    const validation = validateRecord(record);
    if (!validation.valid) return;

    const newRecord: RoofShadowRecord = {
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set(state => ({ records: [...state.records, newRecord] }));
    scheduleSave();
  },

  updateRecord: (id, updates) => {
    const state = get();
    const existingRecord = state.records.find(r => r.id === id);
    if (!existingRecord) return false;

    const validation = validateRecord({ ...existingRecord, ...updates });
    if (!validation.valid) return false;

    const status = calculateStatus(
      updates.shadowHours ?? existingRecord.shadowHours,
      updates.powerEfficiency ?? existingRecord.powerEfficiency,
      state.thresholdConfig
    );

    set(state => ({
      records: state.records.map(r =>
        r.id === id
          ? { ...r, ...updates, status, updatedAt: new Date().toISOString() }
          : r
      ),
    }));
    scheduleSave();
    return true;
  },

  batchUpdateStatus: (ids, status) => {
    set(state => ({
      records: state.records.map(r =>
        ids.includes(r.id)
          ? { ...r, status, markedBy: state.currentUser, markedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : r
      ),
    }));
    scheduleSave();
  },

  batchDelete: (ids) => {
    set(state => ({
      records: state.records.map(r =>
        ids.includes(r.id)
          ? { ...r, isDeleted: true, updatedAt: new Date().toISOString() }
          : r
      ),
      selectedIds: state.selectedIds.filter(id => !ids.includes(id)),
    }));
    scheduleSave();
  },

  toggleSelection: (id) => {
    set(state => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(i => i !== id)
        : [...state.selectedIds, id],
    }));
  },

  selectAll: () => {
    const state = get();
    const visibleIds = state.getVisibleRecords().map(r => r.id);
    set({ selectedIds: visibleIds });
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  setFilterRange: (range) => {
    set({ filterRange: range, selectedIds: [] });
  },

  importData: (data, annotations = []) => {
    const validation = validateRecords(data);
    if (!validation.valid) return;

    set({
      records: data,
      annotations,
      selectedIds: [],
      filterRange: null,
    });
    get().saveToStorage();
  },

  exportData: (type) => {
    const state = get();
    const activeRecords = state.records.filter(r => !r.isDeleted);

    if (type === 'raw') {
      return activeRecords.map(r => ({
        ...r,
        shadowHours: r.originalShadowHours,
        powerEfficiency: r.originalPowerEfficiency,
      }));
    }
    return activeRecords;
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        get().loadMockData();
        return;
      }

      const parsed = JSON.parse(stored);
      if (parsed.version !== STORAGE_VERSION) {
        get().loadMockData();
        return;
      }

      set({
        records: parsed.records || [],
        annotations: parsed.annotations || [],
        lastSavedAt: parsed.lastSavedAt || null,
      });
    } catch (e) {
      console.error('Failed to load from storage:', e);
      get().loadMockData();
    }
  },

  saveToStorage: () => {
    set({ saveStatus: 'saving' });
    try {
      const state = get();
      const data = {
        version: STORAGE_VERSION,
        records: state.records,
        annotations: state.annotations,
        lastSavedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      set({ saveStatus: 'saved', lastSavedAt: data.lastSavedAt });
      
      setTimeout(() => {
        if (get().saveStatus === 'saved') {
          set({ saveStatus: 'idle' });
        }
      }, 2000);
    } catch (e) {
      console.error('Failed to save to storage:', e);
      set({ saveStatus: 'error' });
    }
  },

  loadMockData: () => {
    const mockRecords = generateMockRecords();
    const mockAnnotation = generateMockAnnotation();
    set({
      records: mockRecords,
      annotations: [mockAnnotation],
    });
    get().saveToStorage();
  },

  clearAllData: () => {
    set({
      records: [],
      annotations: [],
      selectedIds: [],
      filterRange: null,
      lastSavedAt: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  },

  addAnnotation: (annotation) => {
    const newAnnotation: AerialAnnotation = {
      ...annotation,
      id: generateId(),
    };
    set(state => ({ annotations: [...state.annotations, newAnnotation] }));
    scheduleSave();
  },

  updateAnnotation: (id, updates) => {
    set(state => ({
      annotations: state.annotations.map(a =>
        a.id === id ? { ...a, ...updates, recordedAt: new Date().toISOString() } : a
      ),
    }));
    scheduleSave();
  },

  deleteAnnotation: (id) => {
    set(state => ({
      annotations: state.annotations.filter(a => a.id !== id),
    }));
    scheduleSave();
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },
}));

function scheduleSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    useShadowStore.getState().saveToStorage();
  }, 500);
}
