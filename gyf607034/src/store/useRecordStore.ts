import { create } from 'zustand';
import type {
  RescheduleRecord,
  ChangeLog,
  RecordStatus,
  ChangeType,
  FilterOptions,
  UserRole,
} from '../types';
import { initialRecords } from '../data/mockData';
import { genId, sortedByDateDesc } from '../utils/format';

const STORAGE_KEY = 'reschedule_tracker_records_v1';

interface RecordStore {
  records: RescheduleRecord[];
  role: UserRole;
  currentOperator: string;
  filters: FilterOptions;

  init: () => void;
  setRole: (role: UserRole) => void;
  setCurrentOperator: (name: string) => void;

  setFilters: (patch: Partial<FilterOptions>) => void;
  resetFilters: () => void;

  getFilteredRecords: () => RescheduleRecord[];
  getRecordById: (id: string) => RescheduleRecord | undefined;

  appendNote: (
    recordId: string,
    note: string,
    newStatus?: RecordStatus,
  ) => void;

  rejudgeStatus: (
    recordId: string,
    newStatus: RecordStatus,
    reason: string,
  ) => void;

  markBadData: (recordId: string, reason: string) => void;
  unmarkBadData: (recordId: string) => void;

  createManualRecord: (data: {
    childName: string;
    parentName: string;
    parentPhone: string;
    originalPromiseDate: string;
    initialNote: string;
    additionalNote?: string;
    newStatusAfterNote?: RecordStatus;
    sourceFile?: string;
  }) => RescheduleRecord;
}

function persist(records: RescheduleRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* ignore */
  }
}

function load(): RescheduleRecord[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RescheduleRecord[];
  } catch {
    return null;
  }
}

export const useRecordStore = create<RecordStore>((set, get) => ({
  records: [],
  role: 'consultant',
  currentOperator: '郑顾问',
  filters: {
    status: 'exclude_bad',
    handler: '',
    keyword: '',
    dateFrom: '',
    dateTo: '',
    showBadData: false,
  },

  init: () => {
    const stored = load();
    const base = stored && stored.length > 0 ? stored : initialRecords;
    set({ records: sortedByDateDesc(base) });
  },

  setRole: (role) => set({ role }),
  setCurrentOperator: (name) => set({ currentOperator: name }),

  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () =>
    set({
      filters: {
        status: 'exclude_bad',
        handler: '',
        keyword: '',
        dateFrom: '',
        dateTo: '',
        showBadData: false,
      },
    }),

  getFilteredRecords: () => {
    const { records, filters } = get();
    let list = records.slice();

    if (!filters.showBadData && filters.status === 'exclude_bad') {
      list = list.filter((r) => !r.isBadData);
    } else if (filters.showBadData) {
      // include bad data
    } else if (filters.status !== 'all' && filters.status !== 'exclude_bad') {
      list = list.filter((r) => r.currentStatus === filters.status);
    }

    if (filters.handler) {
      list = list.filter((r) => r.handler === filters.handler);
    }

    if (filters.keyword) {
      const kw = filters.keyword.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.childName.toLowerCase().includes(kw) ||
          r.parentName.toLowerCase().includes(kw) ||
          r.parentPhone.includes(kw) ||
          r.sourceFile.toLowerCase().includes(kw) ||
          r.latestNote.toLowerCase().includes(kw),
      );
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      list = list.filter((r) => new Date(r.originalPromiseDate).getTime() >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() + 24 * 3600 * 1000;
      list = list.filter((r) => new Date(r.originalPromiseDate).getTime() < to);
    }

    return sortedByDateDesc(list);
  },

  getRecordById: (id) => get().records.find((r) => r.id === id),

  appendNote: (recordId, note, newStatus) => {
    const { records, currentOperator } = get();
    const updated = records.map((r) => {
      if (r.id !== recordId) return r;
      const prev = r.currentStatus;
      const finalStatus: RecordStatus = newStatus ?? prev;
      const log: ChangeLog = {
        id: genId(),
        recordId: r.id,
        status: finalStatus,
        note,
        operator: currentOperator,
        timestamp: new Date().toISOString(),
        isOriginal: false,
        changeType: newStatus && newStatus !== prev ? 'reschedule' : 'note',
        previousStatus: prev,
      };
      return {
        ...r,
        currentStatus: finalStatus,
        latestNote: note,
        updatedAt: log.timestamp,
        changeLogs: [log, ...r.changeLogs],
      };
    });
    persist(updated);
    set({ records: sortedByDateDesc(updated) });
  },

  rejudgeStatus: (recordId, newStatus, reason) => {
    const { records, currentOperator } = get();
    const updated = records.map((r) => {
      if (r.id !== recordId) return r;
      const prev = r.currentStatus;
      const log: ChangeLog = {
        id: genId(),
        recordId: r.id,
        status: newStatus,
        note: reason,
        operator: currentOperator,
        timestamp: new Date().toISOString(),
        isOriginal: false,
        changeType: 'rejudge' as ChangeType,
        previousStatus: prev,
      };
      return {
        ...r,
        currentStatus: newStatus,
        latestNote: reason,
        updatedAt: log.timestamp,
        isBadData: newStatus === 'bad_data' ? true : r.isBadData,
        changeLogs: [log, ...r.changeLogs],
      };
    });
    persist(updated);
    set({ records: sortedByDateDesc(updated) });
  },

  markBadData: (recordId, reason) => {
    const { records, currentOperator } = get();
    const updated = records.map((r) => {
      if (r.id !== recordId) return r;
      const prev = r.currentStatus;
      const log: ChangeLog = {
        id: genId(),
        recordId: r.id,
        status: 'bad_data',
        note: reason,
        operator: currentOperator,
        timestamp: new Date().toISOString(),
        isOriginal: false,
        changeType: 'bad_data',
        previousStatus: prev,
      };
      return {
        ...r,
        currentStatus: 'bad_data' as RecordStatus,
        latestNote: reason,
        updatedAt: log.timestamp,
        isBadData: true,
        badDataReason: reason,
        changeLogs: [log, ...r.changeLogs],
      };
    });
    persist(updated);
    set({ records: sortedByDateDesc(updated) });
  },

  unmarkBadData: (recordId) => {
    const { records, currentOperator } = get();
    const updated = records.map((r) => {
      if (r.id !== recordId) return r;
      const prev = r.currentStatus;
      // revert to previous non-bad_data status if possible
      const restoredStatus: RecordStatus =
        r.changeLogs.find((l) => l.status !== 'bad_data')?.status ?? 'pending';
      const log: ChangeLog = {
        id: genId(),
        recordId: r.id,
        status: restoredStatus,
        note: '解除坏数据标记，恢复原状态。',
        operator: currentOperator,
        timestamp: new Date().toISOString(),
        isOriginal: false,
        changeType: 'rejudge',
        previousStatus: prev,
      };
      return {
        ...r,
        currentStatus: restoredStatus,
        latestNote: log.note,
        updatedAt: log.timestamp,
        isBadData: false,
        badDataReason: undefined,
        changeLogs: [log, ...r.changeLogs],
      };
    });
    persist(updated);
    set({ records: sortedByDateDesc(updated) });
  },

  createManualRecord: (data) => {
    const { currentOperator } = get();
    const now = new Date().toISOString();
    const recordId = genId();
    const originalLog: ChangeLog = {
      id: genId(),
      recordId,
      status: 'promised',
      note: data.initialNote || `原始承诺试听日期：${data.originalPromiseDate}`,
      operator: currentOperator,
      timestamp: now,
      isOriginal: true,
      changeType: 'original',
    };
    const logs: ChangeLog[] = [originalLog];
    let finalStatus: RecordStatus = 'promised';
    let latestNote = originalLog.note;

    if (data.additionalNote && data.additionalNote.trim()) {
      const noteLog: ChangeLog = {
        id: genId(),
        recordId,
        status: data.newStatusAfterNote ?? finalStatus,
        note: data.additionalNote,
        operator: currentOperator,
        timestamp: now,
        isOriginal: false,
        changeType:
          data.newStatusAfterNote && data.newStatusAfterNote !== finalStatus
            ? 'reschedule'
            : 'note',
        previousStatus: finalStatus,
      };
      finalStatus = noteLog.status;
      latestNote = noteLog.note;
      logs.unshift(noteLog);
    }

    const record: RescheduleRecord = {
      id: recordId,
      childName: data.childName.trim(),
      parentName: data.parentName.trim(),
      parentPhone: data.parentPhone.trim(),
      sourceFile:
        data.sourceFile?.trim() || `手工补录（${currentOperator}）`,
      handler: currentOperator,
      currentStatus: finalStatus,
      originalPromiseDate: data.originalPromiseDate,
      latestNote,
      createdAt: now,
      updatedAt: now,
      isBadData: false,
      sourceType: 'manual',
      changeLogs: logs,
    };

    const next = [record, ...get().records];
    persist(next);
    set({ records: sortedByDateDesc(next) });
    return record;
  },
}));
