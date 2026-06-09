import { create } from 'zustand';
import type { ValveRecord, Contract, FilterParams } from '@/types';
import { storage, generateId, formatDateTime, todayStr } from '@/utils/storage';
import { mockValveRecords, mockContracts } from '@/data/mockData';
import { useAuditStore } from './auditStore';

interface ValveState {
  records: ValveRecord[];
  contracts: Contract[];
  filteredRecords: ValveRecord[];
  selectedRecordId: string | null;
  editingRecord: ValveRecord | null;
  showEditModal: boolean;
  showManualModal: boolean;
  showContractPanel: boolean;

  init: () => void;
  applyFilters: (filters: FilterParams, searchKeyword: string) => void;
  addRecord: (record: Omit<ValveRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => void;
  updateRecord: (id: string, updates: Partial<ValveRecord>) => void;
  deleteRecord: (id: string, reason: string) => void;
  addManualRecord: (record: Partial<ValveRecord>) => void;
  selectRecord: (id: string | null) => void;
  openEditModal: (record: ValveRecord) => void;
  closeEditModal: () => void;
  openManualModal: () => void;
  closeManualModal: () => void;
  toggleContractPanel: () => void;
  addContract: (contract: Omit<Contract, 'id' | 'uploadedAt'>) => void;
  linkContractToRecord: (recordId: string, contractId: string) => boolean;
  checkDateMatch: (recordId: string, contractId: string) => boolean;
  getRecordById: (id: string) => ValveRecord | undefined;
  getContractById: (id: string) => Contract | undefined;
  getUnmatchedContracts: () => Contract[];
  getRecordsWithoutContract: () => ValveRecord[];
}

export const useValveStore = create<ValveState>((set, get) => ({
  records: [],
  contracts: [],
  filteredRecords: [],
  selectedRecordId: null,
  editingRecord: null,
  showEditModal: false,
  showManualModal: false,
  showContractPanel: false,

  init: () => {
    const savedRecords = storage.get<ValveRecord[]>('valveRecords', []);
    const savedContracts = storage.get<Contract[]>('contracts', []);

    if (savedRecords.length > 0) {
      set({ records: savedRecords });
    } else {
      set({ records: mockValveRecords });
      storage.set('valveRecords', mockValveRecords);
    }

    if (savedContracts.length > 0) {
      set({ contracts: savedContracts });
    } else {
      set({ contracts: mockContracts });
      storage.set('contracts', mockContracts);
    }
  },

  applyFilters: (filters, searchKeyword) => {
    let records = [...get().records.filter(r => !r.isDeleted)];

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      records = records.filter(r => r.recordDate >= start && r.recordDate <= end);
    }

    if (filters.status && filters.status.length > 0) {
      records = records.filter(r => filters.status!.includes(r.status));
    }

    if (filters.valveNo) {
      records = records.filter(r => r.valveNo.includes(filters.valveNo!));
    }

    if (filters.operator) {
      records = records.filter(r => r.operator.includes(filters.operator!));
    }

    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      records = records.filter(r =>
        r.valveNo.toLowerCase().includes(kw) ||
        r.operator.toLowerCase().includes(kw) ||
        (r.remarks && r.remarks.toLowerCase().includes(kw))
      );
    }

    records.sort((a, b) => b.recordDate.localeCompare(a.recordDate) || b.createdAt.localeCompare(a.createdAt));

    set({ filteredRecords: records });
  },

  addRecord: (record) => {
    const newRecord: ValveRecord = {
      ...record,
      id: generateId(),
      isDeleted: false,
      createdAt: formatDateTime(new Date()),
      updatedAt: formatDateTime(new Date()),
    };

    const records = [newRecord, ...get().records];
    set({ records, showEditModal: false, editingRecord: null });
    storage.set('valveRecords', records);

    useAuditStore.getState().addLog({
      recordId: newRecord.id,
      operationType: 'create',
      operator: record.operator,
      oldValue: null,
      newValue: { ...record },
    });
  },

  updateRecord: (id, updates) => {
    const oldRecord = get().records.find(r => r.id === id);
    if (!oldRecord) return;

    const oldValue: Record<string, any> = {};
    const newValue: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      oldValue[key] = (oldRecord as any)[key];
      newValue[key] = (updates as any)[key];
    });

    const records = get().records.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: formatDateTime(new Date()) } : r
    );

    set({ records, showEditModal: false, editingRecord: null });
    storage.set('valveRecords', records);

    useAuditStore.getState().addLog({
      recordId: id,
      operationType: 'update',
      operator: '值班员',
      oldValue,
      newValue,
    });
  },

  deleteRecord: (id, reason) => {
    const oldRecord = get().records.find(r => r.id === id);
    if (!oldRecord) return;

    const records = get().records.map(r =>
      r.id === id ? { ...r, isDeleted: true, updatedAt: formatDateTime(new Date()) } : r
    );

    set({ records });
    storage.set('valveRecords', records);

    useAuditStore.getState().addLog({
      recordId: id,
      operationType: 'delete',
      operator: '值班员',
      oldValue: { ...oldRecord },
      newValue: null,
      undoReason: reason,
    });
  },

  addManualRecord: (record) => {
    const newRecord: ValveRecord = {
      id: generateId(),
      recordDate: record.recordDate || todayStr(),
      valveNo: record.valveNo || '',
      opening: record.opening || 0,
      temperature: record.temperature || 0,
      pressure: record.pressure || 0,
      status: 'manual',
      operator: '老何',
      contractId: record.contractId,
      remarks: record.remarks,
      isDeleted: false,
      createdAt: formatDateTime(new Date()),
      updatedAt: formatDateTime(new Date()),
    };

    const records = [newRecord, ...get().records];
    set({ records, showManualModal: false });
    storage.set('valveRecords', records);

    useAuditStore.getState().addLog({
      recordId: newRecord.id,
      operationType: 'manual',
      operator: '老何',
      oldValue: null,
      newValue: {
        valveNo: newRecord.valveNo,
        opening: newRecord.opening,
        temperature: newRecord.temperature,
        pressure: newRecord.pressure,
        remarks: newRecord.remarks,
      },
    });
  },

  selectRecord: (id) => set({ selectedRecordId: id }),

  openEditModal: (record) => set({ showEditModal: true, editingRecord: { ...record } }),

  closeEditModal: () => set({ showEditModal: false, editingRecord: null }),

  openManualModal: () => set({ showManualModal: true }),

  closeManualModal: () => set({ showManualModal: false }),

  toggleContractPanel: () => set(state => ({ showContractPanel: !state.showContractPanel })),

  addContract: (contract) => {
    const newContract: Contract = {
      ...contract,
      id: generateId(),
      uploadedAt: formatDateTime(new Date()),
    };

    const contracts = [newContract, ...get().contracts];
    set({ contracts });
    storage.set('contracts', contracts);
  },

  linkContractToRecord: (recordId, contractId) => {
    const record = get().records.find(r => r.id === recordId);
    const contract = get().contracts.find(c => c.id === contractId);

    if (!record || !contract) return false;

    const dateMatch = record.recordDate === contract.contractDate;

    const records = get().records.map(r =>
      r.id === recordId ? { ...r, contractId, updatedAt: formatDateTime(new Date()) } : r
    );

    set({ records });
    storage.set('valveRecords', records);

    return dateMatch;
  },

  checkDateMatch: (recordId, contractId) => {
    const record = get().records.find(r => r.id === recordId);
    const contract = get().contracts.find(c => c.id === contractId);
    return record?.recordDate === contract?.contractDate;
  },

  getRecordById: (id) => get().records.find(r => r.id === id),

  getContractById: (id) => get().contracts.find(c => c.id === id),

  getUnmatchedContracts: () => {
    const usedContractIds = new Set(get().records.map(r => r.contractId).filter(Boolean));
    return get().contracts.filter(c => !usedContractIds.has(c.id));
  },

  getRecordsWithoutContract: () => {
    return get().records.filter(r => !r.isDeleted && !r.contractId);
  },
}));
