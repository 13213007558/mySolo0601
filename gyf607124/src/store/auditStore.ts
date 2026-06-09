import { create } from 'zustand';
import type { AuditLog, ValveRecord } from '@/types';
import { storage, generateId, formatDateTime } from '@/utils/storage';
import { mockAuditLogs } from '@/data/mockData';

interface AuditState {
  logs: AuditLog[];
  selectedLogId: string | null;
  showUndoModal: boolean;
  undoReason: string;
  previousUndoReason: string;

  init: () => void;
  addLog: (log: Omit<AuditLog, 'id' | 'operationTime'>) => void;
  getLogsByRecordId: (recordId: string) => AuditLog[];
  selectLog: (logId: string | null) => void;
  openUndoModal: (logId: string, previousReason?: string) => void;
  closeUndoModal: () => void;
  setUndoReason: (reason: string) => void;
  undoOperation: (logId: string, reason: string) => AuditLog | null;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: [],
  selectedLogId: null,
  showUndoModal: false,
  undoReason: '',
  previousUndoReason: '',

  init: () => {
    const saved = storage.get<AuditLog[]>('auditLogs', []);
    if (saved.length > 0) {
      set({ logs: saved });
    } else {
      set({ logs: mockAuditLogs });
      storage.set('auditLogs', mockAuditLogs);
    }
  },

  addLog: (log) => {
    const newLog: AuditLog = {
      ...log,
      id: generateId(),
      operationTime: formatDateTime(new Date()),
    };
    const logs = [newLog, ...get().logs];
    set({ logs });
    storage.set('auditLogs', logs);
  },

  getLogsByRecordId: (recordId) => {
    return get().logs.filter(log => log.recordId === recordId);
  },

  selectLog: (logId) => set({ selectedLogId: logId }),

  openUndoModal: (logId, previousReason = '') => {
    set({
      selectedLogId: logId,
      showUndoModal: true,
      undoReason: '',
      previousUndoReason: previousReason,
    });
  },

  closeUndoModal: () => {
    set({ showUndoModal: false, undoReason: '', previousUndoReason: '' });
  },

  setUndoReason: (reason) => set({ undoReason: reason }),

  undoOperation: (logId, reason) => {
    const log = get().logs.find(l => l.id === logId);
    if (!log) return null;

    const previousLog = get().logs.find(
      l => l.recordId === log.recordId && l.operationTime < log.operationTime
    );

    const undoLog: AuditLog = {
      id: generateId(),
      recordId: log.recordId,
      operationType: 'undo',
      operator: '主管',
      operationTime: formatDateTime(new Date()),
      oldValue: log.newValue,
      newValue: log.oldValue,
      undoReason: reason,
      previousUndoReason: previousLog?.undoReason,
    };

    const logs = [undoLog, ...get().logs];
    set({ logs, showUndoModal: false, undoReason: '' });
    storage.set('auditLogs', logs);

    return undoLog;
  },
}));
