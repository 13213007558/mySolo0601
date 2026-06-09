import { create } from 'zustand';
import type { OperationHistory, ActionType } from '@/types';
import { mockHistory, generateId, getCurrentTime } from '@/mock/initialData';

interface HistoryState {
  history: OperationHistory[];
  addHistory: (params: {
    alarmId: string;
    operator: string;
    action: ActionType;
    oldReason?: string;
    newRemark?: string;
  }) => void;
  getHistoryByAlarmId: (alarmId: string) => OperationHistory[];
  clearHistory: () => void;
}

const STORAGE_KEY = 'alarm-wall-history';

const loadFromStorage = (): OperationHistory[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : mockHistory;
  } catch {
    return mockHistory;
  }
};

const saveToStorage = (history: OperationHistory[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: loadFromStorage(),
  addHistory: ({ alarmId, operator, action, oldReason, newRemark }) => {
    const newHistory: OperationHistory = {
      id: generateId('hist'),
      alarmId,
      operator,
      action,
      oldReason,
      newRemark,
      operatedAt: getCurrentTime(),
    };
    const updated = [...get().history, newHistory];
    set({ history: updated });
    saveToStorage(updated);
  },
  getHistoryByAlarmId: (alarmId) => {
    return get()
      .history.filter((h) => h.alarmId === alarmId)
      .sort((a, b) => new Date(a.operatedAt).getTime() - new Date(b.operatedAt).getTime());
  },
  clearHistory: () => {
    set({ history: mockHistory });
    saveToStorage(mockHistory);
  },
}));
