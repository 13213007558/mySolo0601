import { create } from 'zustand';
import type {
  OilTempRecord,
  SupplementRecord,
  ConflictRecord,
  RecordStatus,
  ChartRange,
  SaveStatus,
} from '@/types';
import { generateId, calculateHash } from '@/utils/hash';
import { detectConflict, createConflictRecord, resolveConflict } from '@/utils/conflict';
import { generateMockRecords, generateZhaoSupplementData } from '@/utils/mockData';
import { exportToJSON, downloadJSON, downloadCSV, parseImportData } from '@/utils/export';

const STORAGE_KEY = 'oil_temp_review_desk_data';

interface PersistedData {
  records: OilTempRecord[];
  supplementRecords: SupplementRecord[];
  conflicts: ConflictRecord[];
  lastSavedAt: number;
  version: string;
}

interface OilTempState {
  records: OilTempRecord[];
  supplementRecords: SupplementRecord[];
  conflicts: ConflictRecord[];
  selectedIds: string[];
  chartRange: ChartRange;
  editingCell: { recordId: string; field: string } | null;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  showSupplementPanel: boolean;
  selectedDevice: string;
  currentOperator: string;

  init: () => void;
  updateRecord: (id: string, updates: Partial<OilTempRecord>) => void;
  batchUpdateStatus: (ids: string[], status: RecordStatus) => void;
  toggleSelection: (id: string, multi?: boolean) => void;
  selectAll: (filter?: (r: OilTempRecord) => boolean) => void;
  clearSelection: () => void;
  setChartRange: (range: ChartRange) => void;
  setEditingCell: (cell: { recordId: string; field: string } | null) => void;
  addSupplementRecord: (record: Omit<SupplementRecord, 'id' | 'createdAt' | 'originalDataHash'>) => void;
  setShowSupplementPanel: (show: boolean) => void;
  setSelectedDevice: (device: string) => void;
  resolveConflictById: (conflictId: string, resolution: 'keep_old' | 'use_new' | 'merge') => void;
  saveToStorage: () => void;
  loadFromStorage: () => boolean;
  exportData: () => void;
  exportSupplement: (id: string) => void;
  importData: (file: File) => Promise<boolean>;
  exportCSV: () => void;
  resetData: () => void;
  simulateConflict: (recordId: string) => void;
  autoSave: () => void;
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: number | undefined;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => fn.apply(this, args), delay);
  } as T;
}

export const useOilTempStore = create<OilTempState>((set, get) => {
  const debouncedSave = debounce(() => {
    get().saveToStorage();
  }, 500);

  return {
    records: [],
    supplementRecords: [],
    conflicts: [],
    selectedIds: [],
    chartRange: { start: '22:00', end: '06:00' },
    editingCell: null,
    saveStatus: 'idle',
    lastSavedAt: null,
    showSupplementPanel: false,
    selectedDevice: '2#箱变',
    currentOperator: '当前用户',

    init: () => {
      const loaded = get().loadFromStorage();
      if (!loaded) {
        const mockRecords = generateMockRecords();
        const zhaoSupplement = generateZhaoSupplementData();
        set({
          records: mockRecords,
          supplementRecords: [zhaoSupplement],
          lastSavedAt: Date.now(),
        });
        get().saveToStorage();
      }
    },

    updateRecord: (id: string, updates: Partial<OilTempRecord>) => {
      const state = get();
      const record = state.records.find(r => r.id === id);
      if (!record) return;

      if (detectConflict(record, updates)) {
        const newValue: OilTempRecord = {
          ...record,
          ...updates,
          version: record.version + 1,
          modifiedAt: Date.now(),
          modifiedBy: state.currentOperator,
        };
        const conflict = createConflictRecord(
          record,
          newValue,
          record.modifiedBy || '未知用户',
          state.currentOperator
        );
        set({
          conflicts: [...state.conflicts, conflict],
        });
        return;
      }

      if (updates.attachmentUrl === '' && record.attachmentUrl) {
        updates.attachmentMissing = true;
        updates.attachmentUrl = record.attachmentUrl;
      }

      const updatedRecords = state.records.map(r =>
        r.id === id
          ? {
              ...r,
              ...updates,
              version: r.version + 1,
              modifiedAt: Date.now(),
              modifiedBy: state.currentOperator,
            }
          : r
      );

      set({
        records: updatedRecords,
        saveStatus: 'saving',
      });

      get().autoSave();
    },

    batchUpdateStatus: (ids: string[], status: RecordStatus) => {
      const state = get();
      const updatedRecords = state.records.map(r =>
        ids.includes(r.id)
          ? {
              ...r,
              status,
              version: r.version + 1,
              modifiedAt: Date.now(),
              modifiedBy: state.currentOperator,
            }
          : r
      );
      set({
        records: updatedRecords,
        selectedIds: [],
        saveStatus: 'saving',
      });
      get().autoSave();
    },

    toggleSelection: (id: string, multi = false) => {
      const state = get();
      const isSelected = state.selectedIds.includes(id);
      if (multi) {
        set({
          selectedIds: isSelected
            ? state.selectedIds.filter(sid => sid !== id)
            : [...state.selectedIds, id],
        });
      } else {
        set({
          selectedIds: isSelected ? [] : [id],
        });
      }
    },

    selectAll: (filter) => {
      const state = get();
      const records = filter ? state.records.filter(filter) : state.records;
      set({
        selectedIds: records.map(r => r.id),
      });
    },

    clearSelection: () => {
      set({ selectedIds: [] });
    },

    setChartRange: (range: ChartRange) => {
      set({ chartRange: range });
    },

    setEditingCell: (cell) => {
      set({ editingCell: cell });
    },

    addSupplementRecord: (record) => {
      const state = get();
      const newRecord: SupplementRecord = {
        ...record,
        id: generateId(),
        createdAt: Date.now(),
        originalDataHash: calculateHash(record.points),
      };
      set({
        supplementRecords: [...state.supplementRecords, newRecord],
        saveStatus: 'saving',
      });
      get().autoSave();
    },

    setShowSupplementPanel: (show) => {
      set({ showSupplementPanel: show });
    },

    setSelectedDevice: (device) => {
      set({ selectedDevice: device });
    },

    resolveConflictById: (conflictId, resolution) => {
      const state = get();
      const conflict = state.conflicts.find(c => c.id === conflictId);
      if (!conflict) return;

      const resolvedRecord = resolveConflict(conflict, resolution);
      const updatedRecords = state.records.map(r =>
        r.id === conflict.recordId ? resolvedRecord : r
      );
      const updatedConflicts = state.conflicts.map(c =>
        c.id === conflictId ? { ...c, resolved: true } : c
      );

      set({
        records: updatedRecords,
        conflicts: updatedConflicts,
        saveStatus: 'saving',
      });
      get().autoSave();
    },

    saveToStorage: () => {
      const state = get();
      const data: PersistedData = {
        records: state.records,
        supplementRecords: state.supplementRecords,
        conflicts: state.conflicts,
        lastSavedAt: Date.now(),
        version: '1.0.0',
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        set({
          saveStatus: 'saved',
          lastSavedAt: Date.now(),
        });
        setTimeout(() => {
          if (get().saveStatus === 'saved') {
            set({ saveStatus: 'idle' });
          }
        }, 1500);
      } catch {
        set({ saveStatus: 'error' });
      }
    },

    loadFromStorage: () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return false;
        const data = JSON.parse(stored) as PersistedData;
        if (!data.records || !Array.isArray(data.records)) return false;
        set({
          records: data.records,
          supplementRecords: data.supplementRecords || [],
          conflicts: data.conflicts || [],
          lastSavedAt: data.lastSavedAt,
        });
        return true;
      } catch {
        return false;
      }
    },

    exportData: () => {
      const state = get();
      const content = exportToJSON(state.records, state.supplementRecords);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadJSON(content, `油温复核数据_${dateStr}.json`);
    },

    exportSupplement: (id) => {
      const state = get();
      const supplement = state.supplementRecords.find(s => s.id === id);
      if (!supplement) return;
      const content = JSON.stringify(supplement, null, 2);
      downloadJSON(content, `小赵补录_${supplement.deviceName}_${supplement.recordDate}.json`);
    },

    importData: async (file) => {
      try {
        const text = await file.text();
        const data = parseImportData(text);
        if (!data) return false;

        const state = get();
        const existingIds = new Set(state.records.map(r => r.id));
        const newRecords = data.records.filter(r => !existingIds.has(r.id));
        const updatedRecords = data.records.filter(r => existingIds.has(r.id));

        const finalRecords = state.records.map(r => {
          const update = updatedRecords.find(ur => ur.id === r.id);
          if (update && detectConflict(r, update)) {
            const conflict = createConflictRecord(
              r,
              update,
              r.modifiedBy || '本地用户',
              '导入数据'
            );
            set({ conflicts: [...get().conflicts, conflict] });
            return r;
          }
          return update || r;
        });

        set({
          records: [...finalRecords, ...newRecords],
          supplementRecords: [...state.supplementRecords, ...(data.supplementRecords || [])],
          saveStatus: 'saving',
        });
        get().autoSave();
        return true;
      } catch {
        return false;
      }
    },

    exportCSV: () => {
      const state = get();
      const dateStr = new Date().toISOString().split('T')[0];
      downloadCSV(state.records, `油温复核数据_${dateStr}.csv`);
    },

    resetData: () => {
      localStorage.removeItem(STORAGE_KEY);
      const mockRecords = generateMockRecords();
      const zhaoSupplement = generateZhaoSupplementData();
      set({
        records: mockRecords,
        supplementRecords: [zhaoSupplement],
        conflicts: [],
        selectedIds: [],
        lastSavedAt: Date.now(),
        saveStatus: 'saving',
      });
      get().autoSave();
    },

    simulateConflict: (recordId) => {
      const state = get();
      const record = state.records.find(r => r.id === recordId);
      if (!record) return;

      const newValue: OilTempRecord = {
        ...record,
        temperature: record.temperature + 2,
        status: 'abnormal' as RecordStatus,
        remark: '模拟冲突：其他用户修改',
        version: record.version + 1,
        modifiedAt: Date.now(),
        modifiedBy: '模拟用户',
      };

      const conflict = createConflictRecord(
        record,
        newValue,
        record.modifiedBy || state.currentOperator,
        '模拟用户'
      );

      set({
        conflicts: [...state.conflicts, conflict],
      });
    },

    autoSave: () => {
      debouncedSave();
    },
  };
});
