import { create } from 'zustand';
import type {
  Alarm,
  StatusHistory,
  OperationHistory,
  ManualEntry,
  FilterOptions,
  ValidationIssue,
  AlarmStatus,
} from '../types';
import {
  MOCK_ALARMS,
  MOCK_STATUS_HISTORY,
  MOCK_OPERATION_HISTORY,
  MOCK_MANUAL_ENTRIES,
} from '../utils/mockData';
import { validateAlarms, fixReadmeInconsistency, fixPhoneMasking } from '../utils/validators';
import {
  calculateTotalAmount,
  calculateTotalAmountPrecise,
  formatAmountDisplay,
  generateId,
} from '../utils/formatters';

interface AlarmState {
  alarms: Alarm[];
  statusHistories: StatusHistory[];
  operationHistories: OperationHistory[];
  manualEntries: ManualEntry[];
  validationIssues: ValidationIssue[];
  filters: FilterOptions;
  selectedAlarmIds: string[];
  loading: boolean;

  initData: () => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  selectAll: (ids: string[]) => void;
  getFilteredAlarms: () => Alarm[];
  getAlarmById: (id: string) => Alarm | undefined;
  getStatusHistoryByAlarmId: (alarmId: string) => StatusHistory[];
  getOperationHistoryByAlarmId: (alarmId: string) => OperationHistory[];
  getManualEntryByAlarmId: (alarmId: string) => ManualEntry | undefined;
  updateAlarmStatus: (
    alarmId: string,
    status: AlarmStatus,
    reason: string,
    operator: string
  ) => void;
  addManualEntry: (entry: Omit<ManualEntry, 'id' | 'createdAt'>) => void;
  runValidation: () => void;
  fixIssue: (type: string, alarmId: string) => void;
  getStats: () => {
    totalAlarms: number;
    pendingAlarms: number;
    resolvedAlarms: number;
    totalAmount: number;
    totalAmountDisplay: string;
    preciseTotalAmount: string;
    readmeInconsistencyCount: number;
    precisionIssueCount: number;
    phoneLeakCount: number;
  };
}

const DEFAULT_FILTERS: FilterOptions = {
  level: 'all',
  status: 'all',
  siteName: '',
  dateRange: { start: '', end: '' },
  keyword: '',
};

export const useAlarmStore = create<AlarmState>((set, get) => ({
  alarms: [],
  statusHistories: [],
  operationHistories: [],
  manualEntries: [],
  validationIssues: [],
  filters: DEFAULT_FILTERS,
  selectedAlarmIds: [],
  loading: false,

  initData: () => {
    set({
      alarms: MOCK_ALARMS,
      statusHistories: MOCK_STATUS_HISTORY,
      operationHistories: MOCK_OPERATION_HISTORY,
      manualEntries: MOCK_MANUAL_ENTRIES,
    });
    get().runValidation();
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS });
  },

  toggleSelected: (id) => {
    set((state) => ({
      selectedAlarmIds: state.selectedAlarmIds.includes(id)
        ? state.selectedAlarmIds.filter((i) => i !== id)
        : [...state.selectedAlarmIds, id],
    }));
  },

  clearSelected: () => {
    set({ selectedAlarmIds: [] });
  },

  selectAll: (ids) => {
    set({ selectedAlarmIds: ids });
  },

  getFilteredAlarms: () => {
    const { alarms, filters } = get();
    return alarms.filter((alarm) => {
      if (filters.level !== 'all' && alarm.level !== filters.level) return false;
      if (filters.status !== 'all' && alarm.status !== filters.status) return false;
      if (filters.siteName && !alarm.siteName.includes(filters.siteName)) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (
          !alarm.alarmCode.toLowerCase().includes(kw) &&
          !alarm.description.toLowerCase().includes(kw) &&
          !alarm.deviceName.toLowerCase().includes(kw) &&
          !alarm.siteName.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (new Date(alarm.createdAt) < startDate) return false;
      }
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(alarm.createdAt) > endDate) return false;
      }
      return true;
    });
  },

  getAlarmById: (id) => {
    return get().alarms.find((a) => a.id === id);
  },

  getStatusHistoryByAlarmId: (alarmId) => {
    return get()
      .statusHistories.filter((h) => h.alarmId === alarmId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getOperationHistoryByAlarmId: (alarmId) => {
    return get()
      .operationHistories.filter((h) => h.alarmId === alarmId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getManualEntryByAlarmId: (alarmId) => {
    return get().manualEntries.find((e) => e.alarmId === alarmId);
  },

  updateAlarmStatus: (alarmId, status, reason, operator) => {
    const now = new Date().toISOString();
    const alarm = get().getAlarmById(alarmId);
    if (!alarm) return;

    const fromStatus = alarm.status;

    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === alarmId ? { ...a, status, updatedAt: now } : a
      ),
      statusHistories: [
        ...state.statusHistories,
        {
          id: generateId(),
          alarmId,
          fromStatus,
          toStatus: status,
          operator,
          reason,
          createdAt: now,
        },
      ],
      operationHistories: [
        ...state.operationHistories,
        {
          id: generateId(),
          alarmId,
          operationType: 'status_change',
          operator,
          detail: `状态从"${fromStatus}"变更为"${status}"，原因：${reason}`,
          createdAt: now,
        },
      ],
    }));

    get().runValidation();
  },

  addManualEntry: (entry) => {
    const now = new Date().toISOString();
    const newEntry: ManualEntry = {
      ...entry,
      id: generateId(),
      createdAt: now,
    };

    if (entry.alarmData) {
      const newAlarm: Alarm = {
        id: entry.alarmId || generateId(),
        alarmCode: entry.alarmData.alarmCode || 'BMS-MANUAL',
        siteName: entry.alarmData.siteName || '未知站点',
        deviceName: entry.alarmData.deviceName || '未知设备',
        level: entry.alarmData.level || 'warning',
        description: entry.alarmData.description || '手工补录告警',
        amount: entry.alarmData.amount || 0,
        amountDisplay: entry.alarmData.amountDisplay || formatAmountDisplay(0),
        phone: entry.alarmData.phone || '',
        phoneMasked: entry.alarmData.phone || '',
        status: entry.alarmData.status || 'pending',
        source: 'manual',
        bmsPhotoUrl: entry.photoUrl,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => ({
        manualEntries: [...state.manualEntries, newEntry],
        alarms: entry.alarmId
          ? state.alarms.map((a) => (a.id === entry.alarmId ? { ...a, ...newAlarm } : a))
          : [...state.alarms, newAlarm],
      }));
    } else {
      set((state) => ({
        manualEntries: [...state.manualEntries, newEntry],
      }));
    }

    get().runValidation();
  },

  runValidation: () => {
    const issues = validateAlarms(get().alarms);
    set({ validationIssues: issues });
  },

  fixIssue: (type, alarmId) => {
    const alarm = get().getAlarmById(alarmId);
    if (!alarm) return;

    let updatedAlarm = alarm;
    if (type === 'readme_inconsistency') {
      updatedAlarm = fixReadmeInconsistency(alarm);
    } else if (type === 'phone_leak') {
      updatedAlarm = fixPhoneMasking(alarm);
    }

    set((state) => ({
      alarms: state.alarms.map((a) => (a.id === alarmId ? updatedAlarm : a)),
    }));

    get().runValidation();
  },

  getStats: () => {
    const { alarms, validationIssues } = get();
    const amounts = alarms.map((a) => a.amount);

    return {
      totalAlarms: alarms.length,
      pendingAlarms: alarms.filter((a) => a.status === 'pending').length,
      resolvedAlarms: alarms.filter((a) => a.status === 'resolved').length,
      totalAmount: calculateTotalAmount(amounts),
      totalAmountDisplay: formatAmountDisplay(calculateTotalAmount(amounts)),
      preciseTotalAmount: formatAmountDisplay(calculateTotalAmountPrecise(amounts)),
      readmeInconsistencyCount: validationIssues.filter((i) => i.type === 'readme_inconsistency')
        .length,
      precisionIssueCount: validationIssues.filter((i) => i.type === 'decimal_precision').length,
      phoneLeakCount: validationIssues.filter((i) => i.type === 'phone_leak').length,
    };
  },
}));
