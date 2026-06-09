import { create } from 'zustand';
import type { Alarm, AlarmStatus, FilterCondition, SupplementNote } from '@/types';
import { mockAlarms, mockSupplements, generateId, getCurrentTime } from '@/mock/initialData';
import { detectDuplicateSites } from '@/utils/duplicate';
import type { DuplicateSiteInfo } from '@/types';

interface AlarmState {
  alarms: Alarm[];
  supplements: SupplementNote[];
  selectedIds: string[];
  filter: FilterCondition;
  duplicateConflicts: DuplicateSiteInfo[];
  stats: Record<string, number>;
  setFilter: (filter: FilterCondition) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  addAlarms: (newAlarms: Alarm[]) => { conflicts: DuplicateSiteInfo[]; added: Alarm[] };
  addAlarmsForce: (newAlarms: Alarm[]) => void;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  updateAlarmStatus: (id: string, status: AlarmStatus) => void;
  withdrawAlarm: (id: string, reason: string) => void;
  resubmitAlarm: (id: string, newConclusion: string) => void;
  reviewAlarm: (id: string, remark: string) => void;
  addSupplement: (params: {
    alarmId: string;
    author: string;
    content: string;
    beforeData: string;
    afterData: string;
  }) => void;
  getSupplementsByAlarmId: (alarmId: string) => SupplementNote[];
  getFilteredAlarms: () => Alarm[];
  clearDuplicateConflicts: () => void;
  resetData: () => void;
}

const computeStats = (alarms: Alarm[]): Record<string, number> => ({
  total: alarms.length,
  pending: alarms.filter((a) => a.status === 'pending').length,
  processing: alarms.filter((a) => a.status === 'processing').length,
  completed: alarms.filter((a) => a.status === 'completed').length,
  reviewed: alarms.filter((a) => a.status === 'reviewed').length,
  withdrawn: alarms.filter((a) => a.status === 'withdrawn').length,
});

const STORAGE_KEY = 'alarm-wall-data';
const SUPPLEMENT_KEY = 'alarm-wall-supplements';

const loadAlarms = (): Alarm[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : mockAlarms;
  } catch {
    return mockAlarms;
  }
};

const loadSupplements = (): SupplementNote[] => {
  try {
    const stored = localStorage.getItem(SUPPLEMENT_KEY);
    return stored ? JSON.parse(stored) : mockSupplements;
  } catch {
    return mockSupplements;
  }
};

const saveAlarms = (alarms: Alarm[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
};

const saveSupplements = (supplements: SupplementNote[]) => {
  localStorage.setItem(SUPPLEMENT_KEY, JSON.stringify(supplements));
};

const initialAlarms = loadAlarms();

export const useAlarmStore = create<AlarmState>((set, get) => ({
  alarms: initialAlarms,
  supplements: loadSupplements(),
  selectedIds: [],
  filter: {},
  duplicateConflicts: [],
  stats: computeStats(initialAlarms),

  setFilter: (filter) => set({ filter }),

  toggleSelect: (id) => {
    const { selectedIds } = get();
    if (selectedIds.includes(id)) {
      set({ selectedIds: selectedIds.filter((i) => i !== id) });
    } else {
      set({ selectedIds: [...selectedIds, id] });
    }
  },

  selectAll: () => {
    const filtered = get().getFilteredAlarms();
    set({ selectedIds: filtered.map((a) => a.id) });
  },

  clearSelection: () => set({ selectedIds: [] }),

  addAlarms: (newAlarms) => {
    const existing = get().alarms;
    const { conflicts, safeToAdd } = detectDuplicateSites(newAlarms, existing);

    if (conflicts.length > 0) {
      set({ duplicateConflicts: conflicts });
      return { conflicts, added: [] };
    }

    const updated = [...existing, ...safeToAdd];
    set({ alarms: updated, duplicateConflicts: [], stats: computeStats(updated) });
    saveAlarms(updated);
    return { conflicts: [], added: safeToAdd };
  },

  addAlarmsForce: (newAlarms) => {
    const existing = get().alarms;
    const updated = [...existing, ...newAlarms];
    set({ alarms: updated, duplicateConflicts: [], stats: computeStats(updated) });
    saveAlarms(updated);
  },

  updateAlarm: (id, updates) => {
    const updated = get().alarms.map((a) =>
      a.id === id ? { ...a, ...updates, updatedAt: getCurrentTime() } : a
    );
    set({ alarms: updated, stats: computeStats(updated) });
    saveAlarms(updated);
  },

  updateAlarmStatus: (id, status) => {
    get().updateAlarm(id, { status });
  },

  withdrawAlarm: (id, reason) => {
    const alarm = get().alarms.find((a) => a.id === id);
    if (alarm) {
      get().updateAlarm(id, {
        status: 'withdrawn',
        conclusion: reason,
      });
    }
  },

  resubmitAlarm: (id, newConclusion) => {
    const alarm = get().alarms.find((a) => a.id === id);
    if (alarm) {
      get().updateAlarm(id, {
        status: 'completed',
        conclusion: newConclusion,
      });
    }
  },

  reviewAlarm: (id, remark) => {
    get().updateAlarm(id, { status: 'reviewed', conclusion: remark });
  },

  addSupplement: ({ alarmId, author, content, beforeData, afterData }) => {
    const newSupplement: SupplementNote = {
      id: generateId('supp'),
      alarmId,
      author,
      content,
      beforeData,
      afterData,
      createdAt: getCurrentTime(),
    };
    const updated = [...get().supplements, newSupplement];
    set({ supplements: updated });
    saveSupplements(updated);

    const alarm = get().alarms.find((a) => a.id === alarmId);
    if (alarm && !alarm.isManualSupplement) {
      get().updateAlarm(alarmId, { isManualSupplement: true });
    }
  },

  getSupplementsByAlarmId: (alarmId) => {
    return get()
      .supplements.filter((s) => s.alarmId === alarmId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getFilteredAlarms: () => {
    const { alarms, filter } = get();
    return alarms.filter((alarm) => {
      if (filter.status && alarm.status !== filter.status) return false;
      if (filter.severity && alarm.severity !== filter.severity) return false;
      if (filter.siteName && !alarm.siteName.includes(filter.siteName)) return false;
      if (filter.handler && !alarm.handler.includes(filter.handler)) return false;
      if (filter.isManualSupplement !== undefined && alarm.isManualSupplement !== filter.isManualSupplement)
        return false;
      return true;
    });
  },

  clearDuplicateConflicts: () => set({ duplicateConflicts: [] }),

  resetData: () => {
    set({
      alarms: mockAlarms,
      supplements: mockSupplements,
      selectedIds: [],
      filter: {},
      stats: computeStats(mockAlarms),
    });
    saveAlarms(mockAlarms);
    saveSupplements(mockSupplements);
  },
}));
