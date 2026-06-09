import { create } from 'zustand';
import { useMemo } from 'react';
import type { BatteryStore, BatteryRecord, RecordStatus, SupplementRecord } from '../types';
import { loadFromStorage, saveToStorage, clearStorage } from '../utils/storage';
import { detectBatteryNoFormat, checkAnomaly, generateId, formatDateTime } from '../utils/validation';
import { createSampleBatteryRecords, createSampleSupplementRecords } from '../data/sampleData';
import { exportToCSV, exportToJSON, downloadFile } from '../utils/fileHandler';

const initialData = loadFromStorage();

const processRecord = (
  record: Omit<BatteryRecord, 'id' | 'originalBatteryNo' | 'originalStatus' | 'createdAt' | 'updatedAt'>,
  existingRecords: BatteryRecord[]
): BatteryRecord => {
  const id = generateId();
  const now = new Date().toISOString();
  
  const formatIssue = detectBatteryNoFormat(record.batteryNo);
  const anomalyCheck = checkAnomaly(record, existingRecords);

  return {
    ...record,
    id,
    originalBatteryNo: record.batteryNo,
    originalStatus: record.status,
    formatIssue: formatIssue.hasIssue ? formatIssue.message : null,
    isAnomaly: anomalyCheck.isAnomaly,
    anomalyReason: anomalyCheck.isAnomaly ? anomalyCheck.reasons.join('；') : null,
    createdAt: now,
    updatedAt: now,
  };
};

export const useBatteryStore = create<BatteryStore>((set, get) => ({
  records: initialData.records,
  operationLogs: initialData.operationLogs,
  supplementRecords: initialData.supplementRecords,
  historyStack: initialData.historyStack,
  selectedIds: [],
  filters: {
    batteryNo: '',
    status: '',
    dateRange: { start: '', end: '' },
    isAnomaly: null,
    hasFormatIssue: null,
  },
  version: initialData.version,

  importRecords: (inputRecords) => {
    const state = get();
    const snapshot = [...state.records];
    
    const processedRecords = inputRecords.map(r => processRecord(r, state.records));
    
    const logEntry = {
      id: generateId(),
      type: 'import' as const,
      operator: '值班员',
      description: `导入 ${processedRecords.length} 条电池记录`,
      snapshot,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      records: [...state.records, ...processedRecords],
      operationLogs: [logEntry, ...state.operationLogs],
      historyStack: [...state.historyStack, snapshot],
    }));

    saveToStorage(get());
  },

  updateRecord: (id, updates) => {
    const state = get();
    const snapshot = [...state.records];
    const record = state.records.find(r => r.id === id);
    
    if (!record) return;

    const updatedRecord = {
      ...record,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const formatIssue = detectBatteryNoFormat(updatedRecord.batteryNo);
    const anomalyCheck = checkAnomaly(updatedRecord, state.records.filter(r => r.id !== id));
    
    updatedRecord.formatIssue = formatIssue.hasIssue ? formatIssue.message : null;
    updatedRecord.isAnomaly = anomalyCheck.isAnomaly;
    updatedRecord.anomalyReason = anomalyCheck.isAnomaly ? anomalyCheck.reasons.join('；') : null;

    const logEntry = {
      id: generateId(),
      type: 'update' as const,
      operator: '值班员',
      description: `更新电池记录 ${record.batteryNo}`,
      snapshot,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      records: state.records.map(r => (r.id === id ? updatedRecord : r)),
      operationLogs: [logEntry, ...state.operationLogs],
      historyStack: [...state.historyStack, snapshot],
    }));

    saveToStorage(get());
  },

  deleteRecords: (ids) => {
    const state = get();
    const snapshot = [...state.records];
    const deletedNos = state.records.filter(r => ids.includes(r.id)).map(r => r.batteryNo);

    const logEntry = {
      id: generateId(),
      type: 'delete' as const,
      operator: '值班员',
      description: `删除 ${deletedNos.length} 条记录: ${deletedNos.join(', ')}`,
      snapshot,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      records: state.records.filter(r => !ids.includes(r.id)),
      operationLogs: [logEntry, ...state.operationLogs],
      historyStack: [...state.historyStack, snapshot],
      selectedIds: state.selectedIds.filter(id => !ids.includes(id)),
    }));

    saveToStorage(get());
  },

  reviewRecords: (ids, status, reviewer) => {
    const state = get();
    const snapshot = [...state.records];
    const now = new Date().toISOString();
    const reviewedNos: string[] = [];

    const updatedRecords = state.records.map(r => {
      if (ids.includes(r.id)) {
        reviewedNos.push(r.batteryNo);
        return {
          ...r,
          status,
          reviewedBy: reviewer,
          reviewedAt: now,
          updatedAt: now,
        };
      }
      return r;
    });

    const statusText = status === 'normal' ? '正常' : status === 'anomaly' ? '异常' : '待复核';
    const logEntry = {
      id: generateId(),
      type: 'review' as const,
      operator: reviewer,
      description: `复核 ${reviewedNos.length} 条记录为「${statusText}」: ${reviewedNos.join(', ')}`,
      snapshot,
      timestamp: now,
    };

    set((state) => ({
      records: updatedRecords,
      operationLogs: [logEntry, ...state.operationLogs],
      historyStack: [...state.historyStack, snapshot],
      selectedIds: [],
    }));

    saveToStorage(get());
  },

  undo: () => {
    const state = get();
    if (state.historyStack.length === 0) return;

    const previousState = state.historyStack[state.historyStack.length - 1];
    const newHistoryStack = state.historyStack.slice(0, -1);

    const logEntry = {
      id: generateId(),
      type: 'undo' as const,
      operator: '值班员',
      description: `撤回上一步操作，恢复到 ${previousState.length} 条记录的状态`,
      snapshot: [...state.records],
      timestamp: new Date().toISOString(),
    };

    set(() => ({
      records: previousState,
      historyStack: newHistoryStack,
      operationLogs: [logEntry, ...state.operationLogs],
      selectedIds: [],
    }));

    saveToStorage(get());
  },

  selectRecord: (id, selected) => {
    set((state) => ({
      selectedIds: selected
        ? [...state.selectedIds, id]
        : state.selectedIds.filter(i => i !== id),
    }));
  },

  selectAll: (selected) => {
    const state = get();
    const filteredRecords = getFilteredRecords(state);
    set(() => ({
      selectedIds: selected ? filteredRecords.map(r => r.id) : [],
    }));
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearFilters: () => {
    set(() => ({
      filters: {
        batteryNo: '',
        status: '',
        dateRange: { start: '', end: '' },
        isAnomaly: null,
        hasFormatIssue: null,
      },
    }));
  },

  exportRecords: (type) => {
    const state = get();
    const csv = exportToCSV(state.records, type);
    const filename = `电池记录_${formatDateTime(new Date()).replace(/[:\s]/g, '-')}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8');
    return csv;
  },

  loadSampleData: () => {
    const state = get();
    const snapshot = [...state.records];
    
    const sampleRecords = createSampleBatteryRecords();
    const sampleSupplements = createSampleSupplementRecords();

    const logEntry = {
      id: generateId(),
      type: 'import' as const,
      operator: '系统',
      description: `加载 ${sampleRecords.length} 条样例数据`,
      snapshot,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      records: [...state.records, ...sampleRecords],
      supplementRecords: [...state.supplementRecords, ...sampleSupplements],
      operationLogs: [logEntry, ...state.operationLogs],
      historyStack: [...state.historyStack, snapshot],
    }));

    saveToStorage(get());
  },

  clearAllData: () => {
    clearStorage();
    set(() => ({
      records: [],
      operationLogs: [],
      supplementRecords: [],
      historyStack: [],
      selectedIds: [],
      filters: {
        batteryNo: '',
        status: '',
        dateRange: { start: '', end: '' },
        isAnomaly: null,
        hasFormatIssue: null,
      },
      version: '1.0.0',
    }));
  },

  addSupplementRecord: (record) => {
    const state = get();
    const id = generateId();
    const now = new Date().toISOString();
    
    const existing = state.supplementRecords.find(
      r => r.batteryNo === record.batteryNo && r.boxNo === record.boxNo
    );

    const newRecord: SupplementRecord = {
      ...record,
      id,
      beforeData: existing || null,
      afterData: null,
      createdAt: now,
    };

    if (existing) {
      existing.afterData = { ...newRecord, beforeData: null, afterData: null };
    }

    set((state) => ({
      supplementRecords: existing
        ? state.supplementRecords.map(r => r.id === existing.id ? existing : r)
        : [...state.supplementRecords, newRecord],
    }));

    saveToStorage(get());
  },

  updateSupplementRecord: (id, updates) => {
    const state = get();
    const record = state.supplementRecords.find(r => r.id === id);
    
    if (!record) return;

    const beforeData = { ...record };

    const updatedRecord: SupplementRecord = {
      ...record,
      ...updates,
      beforeData,
      afterData: null,
    };

    set((state) => ({
      supplementRecords: state.supplementRecords.map(r =>
        r.id === id ? updatedRecord : r
      ),
    }));

    saveToStorage(get());
  },

  deleteSupplementRecord: (id) => {
    set((state) => ({
      supplementRecords: state.supplementRecords.filter(r => r.id !== id),
    }));

    saveToStorage(get());
  },
}));

function getFilteredRecords(state: BatteryStore): BatteryRecord[] {
  let filtered = [...state.records];
  const { filters } = state;

  if (filters.batteryNo) {
    filtered = filtered.filter(r =>
      r.batteryNo.toLowerCase().includes(filters.batteryNo.toLowerCase())
    );
  }

  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status);
  }

  if (filters.dateRange.start) {
    filtered = filtered.filter(r => r.exchangeDate >= filters.dateRange.start);
  }

  if (filters.dateRange.end) {
    filtered = filtered.filter(r => r.exchangeDate <= filters.dateRange.end);
  }

  if (filters.isAnomaly !== null) {
    filtered = filtered.filter(r => r.isAnomaly === filters.isAnomaly);
  }

  if (filters.hasFormatIssue !== null) {
    filtered = filtered.filter(r =>
      filters.hasFormatIssue ? r.formatIssue !== null : r.formatIssue === null
    );
  }

  return filtered;
}

export const useFilteredRecords = () => {
  const records = useBatteryStore((state) => state.records);
  const filters = useBatteryStore((state) => state.filters);
  
  return useMemo(() => {
    let filtered = [...records];

    if (filters.batteryNo) {
      filtered = filtered.filter(r =>
        r.batteryNo.toLowerCase().includes(filters.batteryNo.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(r => r.exchangeDate >= filters.dateRange.start);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(r => r.exchangeDate <= filters.dateRange.end);
    }

    if (filters.isAnomaly !== null) {
      filtered = filtered.filter(r => r.isAnomaly === filters.isAnomaly);
    }

    if (filters.hasFormatIssue !== null) {
      filtered = filtered.filter(r =>
        filters.hasFormatIssue ? r.formatIssue !== null : r.formatIssue === null
      );
    }

    return filtered;
  }, [records, filters]);
};

const revalidateAllRecords = () => {
  const state = useBatteryStore.getState();
  if (state.records.length === 0) return;

  let hasChanges = false;
  const revalidatedRecords = state.records.map(record => {
    const formatIssue = detectBatteryNoFormat(record.batteryNo);
    const anomalyCheck = checkAnomaly(record, state.records);
    
    const newFormatIssue = formatIssue.hasIssue ? formatIssue.message : null;
    const newIsAnomaly = anomalyCheck.isAnomaly;
    const newAnomalyReason = anomalyCheck.isAnomaly ? anomalyCheck.reasons.join('；') : null;

    if (newFormatIssue !== record.formatIssue || 
        newIsAnomaly !== record.isAnomaly || 
        newAnomalyReason !== record.anomalyReason) {
      hasChanges = true;
      return {
        ...record,
        formatIssue: newFormatIssue,
        isAnomaly: newIsAnomaly,
        anomalyReason: newAnomalyReason,
        updatedAt: new Date().toISOString(),
      };
    }
    return record;
  });

  if (hasChanges) {
    useBatteryStore.setState({ records: revalidatedRecords });
    saveToStorage(useBatteryStore.getState());
  }
};

setTimeout(revalidateAllRecords, 100);
