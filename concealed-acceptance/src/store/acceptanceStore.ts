import { create } from 'zustand';
import type { AcceptanceRecord, StatusHistory, FilterState, User, AcceptanceStatus, Evidence } from '@/types';
import { loadRecords, saveRecords, loadHistory, saveHistory, loadCurrentUser, saveCurrentUser } from '@/utils/storage';
import { generateId, validateRecord, validateEvidence, validateDuplicateAxis } from '@/utils/validator';
import { getNowString } from '@/utils/date';
import { transitionStatus } from '@/utils/statusFlow';
import { getSampleData, getDefaultUsers } from '@/utils/sampleData';
import { isDateInRange } from '@/utils/date';

interface AcceptanceStore {
  records: AcceptanceRecord[];
  history: StatusHistory[];
  currentUser: User | null;
  availableUsers: User[];
  filter: FilterState;
  errors: string[];
  loadData: () => void;
  setCurrentUser: (user: User | null) => void;
  createRecord: (data: Partial<AcceptanceRecord>) => { success: boolean; errors?: string[] };
  updateRecord: (id: string, data: Partial<AcceptanceRecord>) => { success: boolean; errors?: string[] };
  deleteRecord: (id: string) => void;
  addEvidence: (recordId: string, evidence: Omit<Evidence, 'id' | 'uploadTime'>) => void;
  removeEvidence: (recordId: string, evidenceId: string) => void;
  changeStatus: (recordId: string, toStatus: AcceptanceStatus, reason?: string) => { success: boolean; error?: string };
  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;
  getFilteredRecords: () => AcceptanceRecord[];
  getRecordHistory: (recordId: string) => StatusHistory[];
  loadSampleData: () => void;
  importRecords: (records: AcceptanceRecord[]) => void;
  clearAllData: () => void;
  addError: (error: string) => void;
  clearErrors: () => void;
}

const initialFilter: FilterState = {
  status: [],
  workType: [],
  keyword: '',
  dateRange: null,
  onlyMyRecords: false
};

export const useAcceptanceStore = create<AcceptanceStore>((set, get) => ({
  records: [],
  history: [],
  currentUser: null,
  availableUsers: getDefaultUsers(),
  filter: initialFilter,
  errors: [],

  loadData: () => {
    const records = loadRecords();
    const history = loadHistory();
    const currentUser = loadCurrentUser();
    set({ records, history, currentUser });
  },

  setCurrentUser: (user) => {
    saveCurrentUser(user);
    set({ currentUser: user });
  },

  createRecord: (data) => {
    const { records, currentUser } = get();
    if (!currentUser) {
      return { success: false, errors: ['请先选择用户角色'] };
    }

    const newRecord: AcceptanceRecord = {
      id: generateId(),
      projectName: data.projectName || '',
      axis: data.axis || '',
      location: data.location || '',
      workType: data.workType || '',
      acceptanceDate: data.acceptanceDate || '',
      formworkDate: data.formworkDate || '',
      description: data.description || '',
      status: 'DRAFT',
      evidence: data.evidence || [],
      createdBy: currentUser.name,
      createdAt: getNowString(),
      updatedAt: getNowString()
    };

    const errors = validateRecord(newRecord, records);
    const criticalErrors = errors.filter((e) => e.severity === 'error');

    if (criticalErrors.length > 0) {
      return { success: false, errors: criticalErrors.map((e) => e.message) };
    }

    const updatedRecords = [...records, newRecord];
    saveRecords(updatedRecords);
    set({ records: updatedRecords });

    return { success: true };
  },

  updateRecord: (id, data) => {
    const { records } = get();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) {
      return { success: false, errors: ['记录不存在'] };
    }

    const updatedRecord: AcceptanceRecord = {
      ...records[index],
      ...data,
      updatedAt: getNowString()
    };

    const errors = validateRecord(updatedRecord, records);
    const criticalErrors = errors.filter((e) => e.severity === 'error');

    if (criticalErrors.length > 0) {
      return { success: false, errors: criticalErrors.map((e) => e.message) };
    }

    const updatedRecords = [...records];
    updatedRecords[index] = updatedRecord;
    saveRecords(updatedRecords);
    set({ records: updatedRecords });

    return { success: true };
  },

  deleteRecord: (id) => {
    const { records } = get();
    const updatedRecords = records.filter((r) => r.id !== id);
    saveRecords(updatedRecords);
    set({ records: updatedRecords });
  },

  addEvidence: (recordId, evidence) => {
    const { records, currentUser } = get();
    const index = records.findIndex((r) => r.id === recordId);
    if (index === -1 || !currentUser) return;

    const newEvidence: Evidence = {
      ...evidence,
      id: generateId(),
      uploadTime: getNowString()
    };

    const updatedRecords = [...records];
    updatedRecords[index] = {
      ...updatedRecords[index],
      evidence: [...updatedRecords[index].evidence, newEvidence],
      updatedAt: getNowString()
    };

    saveRecords(updatedRecords);
    set({ records: updatedRecords });
  },

  removeEvidence: (recordId, evidenceId) => {
    const { records } = get();
    const index = records.findIndex((r) => r.id === recordId);
    if (index === -1) return;

    const updatedRecords = [...records];
    updatedRecords[index] = {
      ...updatedRecords[index],
      evidence: updatedRecords[index].evidence.filter((e) => e.id !== evidenceId),
      updatedAt: getNowString()
    };

    saveRecords(updatedRecords);
    set({ records: updatedRecords });
  },

  changeStatus: (recordId, toStatus, reason) => {
    const { records, history, currentUser } = get();
    if (!currentUser) {
      return { success: false, error: '请先选择用户角色' };
    }

    const record = records.find((r) => r.id === recordId);
    if (!record) {
      return { success: false, error: '记录不存在' };
    }

    const result = transitionStatus(record, toStatus, currentUser, reason);
    if (!result.success || !result.record || !result.history) {
      return { success: false, error: result.error };
    }

    if (toStatus === 'SUBMITTED') {
      const evidenceErrors = validateEvidence(result.record.evidence);
      if (evidenceErrors.length > 0) {
        return { success: false, error: evidenceErrors.map((e) => e.message).join('；') };
      }
    }

    const duplicateErrors = validateDuplicateAxis(result.record, records);
    if (duplicateErrors.length > 0 && toStatus !== 'DRAFT') {
      return { success: false, error: duplicateErrors.map((e) => e.message).join('；') };
    }

    const updatedRecords = records.map((r) => (r.id === recordId ? result.record! : r));
    const updatedHistory = [...history, result.history];

    saveRecords(updatedRecords);
    saveHistory(updatedHistory);
    set({ records: updatedRecords, history: updatedHistory });

    return { success: true };
  },

  setFilter: (filter) => {
    set((state) => ({ filter: { ...state.filter, ...filter } }));
  },

  resetFilter: () => {
    set({ filter: initialFilter });
  },

  getFilteredRecords: () => {
    const { records, filter, currentUser } = get();
    let result = [...records];

    if (filter.status.length > 0) {
      result = result.filter((r) => filter.status.includes(r.status));
    }

    if (filter.workType.length > 0) {
      result = result.filter((r) => filter.workType.includes(r.workType));
    }

    if (filter.keyword.trim()) {
      const keyword = filter.keyword.toLowerCase();
      result = result.filter(
        (r) =>
          r.projectName.toLowerCase().includes(keyword) ||
          r.axis.toLowerCase().includes(keyword) ||
          r.location.toLowerCase().includes(keyword) ||
          r.workType.toLowerCase().includes(keyword) ||
          r.description.toLowerCase().includes(keyword)
      );
    }

    if (filter.dateRange) {
      result = result.filter((r) => isDateInRange(r.acceptanceDate, filter.dateRange![0], filter.dateRange![1]));
    }

    if (filter.onlyMyRecords && currentUser) {
      result = result.filter((r) => r.createdBy === currentUser.name);
    }

    result.sort((a, b) => {
      const dateCompare = b.acceptanceDate.localeCompare(a.acceptanceDate);
      if (dateCompare !== 0) return dateCompare;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return result;
  },

  getRecordHistory: (recordId) => {
    const { history } = get();
    return history
      .filter((h) => h.recordId === recordId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  loadSampleData: () => {
    const sample = getSampleData();
    saveRecords(sample.records);
    saveHistory(sample.history);
    set({ records: sample.records, history: sample.history });
  },

  importRecords: (importedRecords) => {
    const { records } = get();
    const newRecords = importedRecords.map((r) => ({
      ...r,
      id: generateId(),
      createdAt: getNowString(),
      updatedAt: getNowString()
    }));
    const updatedRecords = [...records, ...newRecords];
    saveRecords(updatedRecords);
    set({ records: updatedRecords });
  },

  clearAllData: () => {
    saveRecords([]);
    saveHistory([]);
    set({ records: [], history: [] });
  },

  addError: (error) => {
    set((state) => ({ errors: [...state.errors, error] }));
  },

  clearErrors: () => {
    set({ errors: [] });
  }
}));
