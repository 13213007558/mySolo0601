import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GunRecord,
  OperationLog,
  AlertMessage,
  AppFilter,
  SampleType,
  ImportResult
} from '../types';
import { getSampleData } from '../data/samples';
import { generateId, sortRecordsByTime, detectCrossDayIssues } from '../utils/time';
import { importFromFile, downloadJson, detectDuplicates } from '../utils/importExport';
import { detectAnomalies } from '../utils/validation';

interface RecordState {
  records: GunRecord[];
  operationLogs: OperationLog[];
  currentView: 'main' | 'review';
  selectedRecordIds: string[];
  filter: AppFilter;
  alerts: AlertMessage[];
  isManualEntryModalOpen: boolean;
  isSampleSelectorOpen: boolean;
  editingRecord?: GunRecord;
}

interface RecordActions {
  loadSample: (type: SampleType) => void;
  addRecords: (records: GunRecord[], source: 'import' | 'manual') => void;
  addManualEntry: (record: Omit<GunRecord, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'isManualEntry' | 'status'> & { manualEntryBy: string }) => void;
  updateRecord: (id: string, updates: Partial<GunRecord>) => void;
  deleteRecord: (id: string) => void;
  clearAll: () => void;
  setView: (view: 'main' | 'review') => void;
  setFilter: (filter: Partial<AppFilter>) => void;
  toggleRecordSelection: (id: string) => void;
  clearSelection: () => void;
  addAlert: (alert: Omit<AlertMessage, 'id'>) => void;
  dismissAlert: (id: string) => void;
  dismissAllAlerts: () => void;
  refreshAlerts: () => void;
  setManualEntryModalOpen: (open: boolean, record?: GunRecord) => void;
  setSampleSelectorOpen: (open: boolean) => void;
  importFromFile: (file: File) => Promise<ImportResult>;
  exportToFile: () => void;
  getFilteredRecords: () => GunRecord[];
  getSortedRecords: () => GunRecord[];
  getDuplicateRecords: () => GunRecord[];
  getManualEntryRecords: () => GunRecord[];
  addOperationLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void;
}

export const useRecordStore = create<RecordState & RecordActions>()(
  persist(
    (set, get) => ({
      records: [],
      operationLogs: [],
      currentView: 'main',
      selectedRecordIds: [],
      filter: {},
      alerts: [],
      isManualEntryModalOpen: false,
      isSampleSelectorOpen: false,

      loadSample: (type: SampleType) => {
        const samples = getSampleData(type);
        const existingRecords = get().records;
        
        if (type === 'empty') {
          set({ records: [] });
          get().addOperationLog({
            type: 'sample_load',
            description: '已清空所有数据',
            recordsAffected: 0,
            sampleType: type
          });
        } else if (type === 'linjie') {
          const { unique, duplicates } = detectDuplicates(samples, existingRecords);
          const newRecords = [...existingRecords, ...unique];
          set({ records: newRecords });
          get().addOperationLog({
            type: 'sample_load',
            description: `添加林姐补录样例 ${samples.length} 条`,
            recordsAffected: unique.length,
            sampleType: type
          });
          if (duplicates.length > 0) {
            get().addAlert({
              type: 'warning',
              message: `检测到 ${duplicates.length} 条重复记录，已保留原始值`,
              plainText: `值班员请注意：添加的林姐补录记录中有 ${duplicates.length} 条和现有记录重复了。系统没有直接覆盖，而是保留了原始值并做了标记，您可以去复盘页查看对比。`
            });
          }
        } else {
          const { unique, duplicates } = detectDuplicates(samples, existingRecords);
          const newRecords = [...existingRecords, ...unique];
          set({ records: newRecords });
          get().addOperationLog({
            type: 'sample_load',
            description: `加载${type === 'normal' ? '正常' : '异常'}数据样例 ${samples.length} 条`,
            recordsAffected: unique.length,
            sampleType: type
          });
          if (duplicates.length > 0) {
            get().addAlert({
              type: 'warning',
              message: `检测到 ${duplicates.length} 条重复记录，已保留原始值`,
              plainText: `值班员请注意：加载的样例数据中有 ${duplicates.length} 条和现有记录重复了。系统没有直接覆盖，而是保留了原始值并做了标记，您可以去复盘页查看对比。`
            });
          }
        }
        
        get().refreshAlerts();
      },

      addRecords: (records, source) => {
        const existingRecords = get().records;
        const { unique, duplicates } = detectDuplicates(records, existingRecords);
        
        const now = new Date().toISOString();
        const recordsWithMeta = unique.map(r => ({
          ...r,
          id: r.id || generateId(),
          createdAt: r.createdAt || now,
          updatedAt: now,
          source: source
        }));
        
        set({ records: [...existingRecords, ...recordsWithMeta] });
        get().addOperationLog({
          type: source,
          description: `添加记录 ${recordsWithMeta.length} 条`,
          recordsAffected: recordsWithMeta.length
        });
        
        if (duplicates.length > 0) {
          get().addAlert({
            type: 'warning',
            message: `检测到 ${duplicates.length} 条重复记录，已保留原始值`,
            plainText: `值班员请注意：导入的记录中有 ${duplicates.length} 条和现有记录重复了。系统没有直接覆盖，而是保留了原始值并做了标记，您可以去复盘页查看对比。`
          });
        }
        
        get().refreshAlerts();
      },

      addManualEntry: (recordData) => {
        const now = new Date().toISOString();
        const existingRecords = get().records;
        
        const newRecord: GunRecord = {
          ...recordData,
          id: generateId(),
          status: 'manual',
          isManualEntry: true,
          createdAt: now,
          updatedAt: now,
          source: 'manual'
        };
        
        const { unique, duplicates } = detectDuplicates([newRecord], existingRecords);
        
        if (duplicates.length > 0) {
          const dup = duplicates[0];
          const finalRecord: GunRecord = {
            ...dup.newRecord,
            originalValue: { ...dup.existingRecord },
            originalRecordId: dup.existingRecord.id
          };
          set({ records: [...existingRecords, finalRecord] });
          get().addAlert({
            type: 'warning',
            message: '补录记录与现有记录重复，已保留原始值',
            plainText: '值班员请注意：您手工补录的这条记录和现有记录重复了。系统没有直接覆盖，而是保留了原始值并做了标记，您可以去复盘页查看对比。'
          });
        } else {
          set({ records: [...existingRecords, ...unique] });
        }
        
        get().addOperationLog({
          type: 'manual',
          description: `${recordData.manualEntryBy} 手工补录记录`,
          recordsAffected: 1,
          user: recordData.manualEntryBy
        });
        
        get().refreshAlerts();
      },

      updateRecord: (id, updates) => {
        const records = get().records;
        const index = records.findIndex(r => r.id === id);
        if (index === -1) return;
        
        const oldRecord = records[index];
        const newRecord = {
          ...oldRecord,
          ...updates,
          updatedAt: new Date().toISOString(),
          originalValue: oldRecord.originalValue || { ...oldRecord }
        };
        
        const newRecords = [...records];
        newRecords[index] = newRecord;
        set({ records: newRecords });
        
        get().addOperationLog({
          type: 'update',
          description: `更新记录 ${oldRecord.gunCode}`,
          recordsAffected: 1
        });
        
        get().refreshAlerts();
      },

      deleteRecord: (id) => {
        const records = get().records;
        const record = records.find(r => r.id === id);
        if (!record) return;
        
        set({ records: records.filter(r => r.id !== id) });
        
        get().addOperationLog({
          type: 'delete',
          description: `删除记录 ${record.gunCode} ${record.timestamp}`,
          recordsAffected: 1
        });
        
        get().refreshAlerts();
      },

      clearAll: () => {
        set({ records: [], alerts: [], selectedRecordIds: [] });
        get().addOperationLog({
          type: 'delete',
          description: '清空所有记录',
          recordsAffected: get().records.length
        });
      },

      setView: (view) => set({ currentView: view }),

      setFilter: (filter) => set({ filter: { ...get().filter, ...filter } }),

      toggleRecordSelection: (id) => {
        const selected = get().selectedRecordIds;
        if (selected.includes(id)) {
          set({ selectedRecordIds: selected.filter(s => s !== id) });
        } else {
          set({ selectedRecordIds: [...selected, id] });
        }
      },

      clearSelection: () => set({ selectedRecordIds: [] }),

      addAlert: (alert) => {
        const id = generateId();
        set({ alerts: [...get().alerts, { ...alert, id }] });
      },

      dismissAlert: (id) => {
        set({ alerts: get().alerts.filter(a => a.id !== id) });
      },

      dismissAllAlerts: () => set({ alerts: [] }),

      refreshAlerts: () => {
        const records = get().records;
        const crossDayAlerts = detectCrossDayIssues(records);
        const anomalyAlerts = detectAnomalies(records);
        set({ alerts: [...crossDayAlerts, ...anomalyAlerts] });
      },

      setManualEntryModalOpen: (open, record) => {
        set({ isManualEntryModalOpen: open, editingRecord: record });
      },

      setSampleSelectorOpen: (open) => {
        set({ isSampleSelectorOpen: open });
      },

      importFromFile: async (file) => {
        const result = await importFromFile(file, get().records);
        
        if (result.added.length > 0) {
          get().addRecords(result.added, 'import');
        }
        
        return result;
      },

      exportToFile: () => {
        const records = get().records;
        downloadJson(records);
        
        get().addOperationLog({
          type: 'update',
          description: `导出 ${records.length} 条记录`,
          recordsAffected: records.length
        });
      },

      getFilteredRecords: () => {
        const { records, filter } = get();
        let filtered = [...records];
        
        if (filter.status) {
          filtered = filtered.filter(r => r.status === filter.status);
        }
        if (filter.gunCode) {
          filtered = filtered.filter(r => 
            r.gunCode.toLowerCase().includes(filter.gunCode!.toLowerCase())
          );
        }
        if (filter.dateRange) {
          const [start, end] = filter.dateRange;
          filtered = filtered.filter(r => {
            const date = new Date(r.timestamp);
            return date >= new Date(start) && date <= new Date(end + 'T23:59:59');
          });
        }
        
        return sortRecordsByTime(filtered);
      },

      getSortedRecords: () => {
        return sortRecordsByTime(get().records);
      },

      getDuplicateRecords: () => {
        return get().records.filter(r => r.status === 'duplicate');
      },

      getManualEntryRecords: () => {
        return get().records.filter(r => r.status === 'manual');
      },

      addOperationLog: (log) => {
        const newLog: OperationLog = {
          ...log,
          id: generateId(),
          timestamp: new Date().toISOString()
        };
        set({ operationLogs: [newLog, ...get().operationLogs].slice(0, 100) });
      }
    }),
    {
      name: 'gun-record-storage',
      partialize: (state) => ({
        records: state.records,
        operationLogs: state.operationLogs,
        filter: state.filter
      })
    }
  )
);
