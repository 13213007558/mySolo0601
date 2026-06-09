import { create } from 'zustand';
import dayjs from 'dayjs';
import type { User, AlarmRecord, HostInfo, SupplementRecord, FilterParams, AlarmStatus, StatusHistory } from '@/types';
import { secureStorage } from '@/utils/secureStorage';
import { mockAlarms, mockHosts, mockSupplementRecords, loginByEmployeeId, hasPermission } from '@/utils/mockData';
import { desensitizeListByRole } from '@/utils/desensitize';
import { generateDataFingerprint } from '@/utils/fingerprint';

interface AppState {
  currentUser: User | null;
  alarms: AlarmRecord[];
  hosts: HostInfo[];
  supplements: SupplementRecord[];
  filters: FilterParams;
  isLoading: boolean;
  error: string | null;

  login: (employeeId: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;

  setFilters: (filters: Partial<FilterParams>) => void;
  resetFilters: () => void;

  getFilteredAlarms: () => AlarmRecord[];
  getAlarmById: (id: string) => AlarmRecord | undefined;
  getHostById: (id: string) => HostInfo | undefined;
  getAlarmsByHostId: (hostId: string) => AlarmRecord[];

  updateAlarmStatus: (alarmId: string, status: AlarmStatus, remark: string) => boolean;
  addAlarms: (alarms: Partial<AlarmRecord>[]) => number;

  addSupplement: (supplement: Omit<SupplementRecord, 'id' | 'createTime' | 'operator' | 'operatorName'>) => SupplementRecord;
  getSupplementsByHostId: (hostId: string) => SupplementRecord[];

  hasPermission: (permission: string) => boolean;
  getStats: () => { pending: number; processing: number; completed: number; abnormal: number };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  alarms: [],
  hosts: [],
  supplements: [],
  filters: {},
  isLoading: false,
  error: null,

  login: async (employeeId: string) => {
    set({ isLoading: true, error: null });
    
    const user = loginByEmployeeId(employeeId);
    
    if (!user) {
      set({ isLoading: false, error: '工号不存在，请检查后重试' });
      return false;
    }

    const desensitizedAlarms = desensitizeListByRole(mockAlarms, user.role);
    const desensitizedHosts = desensitizeListByRole(mockHosts, user.role);

    secureStorage.set('currentUser', user);
    secureStorage.set('alarms', mockAlarms);
    secureStorage.set('hosts', mockHosts);
    secureStorage.set('supplements', mockSupplementRecords);

    set({
      currentUser: user,
      alarms: desensitizedAlarms,
      hosts: desensitizedHosts,
      supplements: mockSupplementRecords,
      isLoading: false,
    });

    return true;
  },

  logout: () => {
    secureStorage.remove('currentUser');
    set({
      currentUser: null,
      alarms: [],
      hosts: [],
      supplements: [],
      filters: {},
      error: null,
    });
  },

  checkAuth: () => {
    const user = secureStorage.get<User>('currentUser');
    if (user) {
      const storedAlarms = secureStorage.get<AlarmRecord[]>('alarms') || mockAlarms;
      const storedHosts = secureStorage.get<HostInfo[]>('hosts') || mockHosts;
      const storedSupplements = secureStorage.get<SupplementRecord[]>('supplements') || mockSupplementRecords;
      
      const desensitizedAlarms = desensitizeListByRole(storedAlarms, user.role);
      const desensitizedHosts = desensitizeListByRole(storedHosts, user.role);

      set({
        currentUser: user,
        alarms: desensitizedAlarms,
        hosts: desensitizedHosts,
        supplements: storedSupplements,
      });
    }
  },

  setFilters: (filters) => {
    set(state => ({ filters: { ...state.filters, ...filters } }));
  },

  resetFilters: () => {
    set({ filters: {} });
  },

  getFilteredAlarms: () => {
    const { alarms, filters } = get();
    let filtered = [...alarms];

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(a =>
        a.hostName.toLowerCase().includes(keyword) ||
        a.alarmType.toLowerCase().includes(keyword) ||
        a.hostId.toLowerCase().includes(keyword)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }

    if (filters.level) {
      filtered = filtered.filter(a => a.alarmLevel === filters.level);
    }

    if (filters.hostId) {
      filtered = filtered.filter(a => a.hostId === filters.hostId);
    }

    if (filters.startTime) {
      filtered = filtered.filter(a => dayjs(a.alarmTime).isAfter(filters.startTime!));
    }

    if (filters.endTime) {
      filtered = filtered.filter(a => dayjs(a.alarmTime).isBefore(filters.endTime!));
    }

    return filtered.sort((a, b) => dayjs(b.alarmTime).valueOf() - dayjs(a.alarmTime).valueOf());
  },

  getAlarmById: (id) => {
    return get().alarms.find(a => a.id === id);
  },

  getHostById: (id) => {
    return get().hosts.find(h => h.id === id);
  },

  getAlarmsByHostId: (hostId) => {
    return get().alarms
      .filter(a => a.hostId === hostId)
      .sort((a, b) => dayjs(b.alarmTime).valueOf() - dayjs(a.alarmTime).valueOf());
  },

  updateAlarmStatus: (alarmId, status, remark) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    const historyEntry: StatusHistory = {
      id: `HIST_${Date.now()}`,
      status,
      operator: currentUser.id,
      operatorName: currentUser.role === 'admin' ? currentUser.name : currentUser.name[0] + '*'.repeat(currentUser.name.length - 1),
      time: dayjs().toISOString(),
      remark,
    };

    set(state => {
      const updatedAlarms = state.alarms.map(alarm => {
        if (alarm.id === alarmId) {
          const updated = {
            ...alarm,
            status,
            processor: currentUser.id,
            processorName: historyEntry.operatorName,
            processTime: historyEntry.time,
            remark,
            history: [...(alarm.history || []), historyEntry],
          };
          return updated;
        }
        return alarm;
      });

      const storedAlarms = secureStorage.get<AlarmRecord[]>('alarms') || [];
      const updatedStoredAlarms = storedAlarms.map(alarm => {
        if (alarm.id === alarmId) {
          return {
            ...alarm,
            status,
            processor: currentUser.id,
            processorName: currentUser.name,
            processTime: historyEntry.time,
            remark,
            history: [...(alarm.history || []), { ...historyEntry, operatorName: currentUser.name }],
          };
        }
        return alarm;
      });
      secureStorage.set('alarms', updatedStoredAlarms);

      const desensitizedAlarms = desensitizeListByRole(updatedStoredAlarms, currentUser.role);

      return { alarms: desensitizedAlarms };
    });

    return true;
  },

  addAlarms: (newAlarms) => {
    const { currentUser } = get();
    if (!currentUser) return 0;

    const existingAlarms = secureStorage.get<AlarmRecord[]>('alarms') || [];
    const existingFingerprints = new Set(existingAlarms.map(a => a.dataFingerprint));

    const validAlarms: AlarmRecord[] = [];
    let addedCount = 0;

    newAlarms.forEach((data, index) => {
      if (!data.hostId || !data.alarmTime) return;

      const fingerprint = generateDataFingerprint(data.hostId, data.alarmTime);
      
      if (existingFingerprints.has(fingerprint)) return;

      const newAlarm: AlarmRecord = {
        id: `ALM_${Date.now()}_${index}`,
        hostId: data.hostId,
        hostName: data.hostName || get().hosts.find(h => h.id === data.hostId)?.name || '未知主机',
        alarmType: data.alarmType || '未知告警',
        alarmLevel: data.alarmLevel || 'warning',
        alarmTime: data.alarmTime,
        status: data.status || 'pending',
        location: data.location || { area: '未知区域' },
        params: data.params || {},
        attachments: data.attachments,
        dataFingerprint: fingerprint,
        createdAt: dayjs().toISOString(),
        history: [],
      };

      validAlarms.push(newAlarm);
      existingFingerprints.add(fingerprint);
      addedCount++;
    });

    if (validAlarms.length > 0) {
      const allAlarms = [...existingAlarms, ...validAlarms];
      secureStorage.set('alarms', allAlarms);
      
      const desensitizedAlarms = desensitizeListByRole(allAlarms, currentUser.role);
      set({ alarms: desensitizedAlarms });
    }

    return addedCount;
  },

  addSupplement: (supplementData) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('未登录');

    const newSupplement: SupplementRecord = {
      ...supplementData,
      id: `SUP_${Date.now()}`,
      createTime: dayjs().toISOString(),
      operator: currentUser.id,
      operatorName: currentUser.name,
    };

    set(state => {
      const existingSupplements = secureStorage.get<SupplementRecord[]>('supplements') || [];
      const allSupplements = [...existingSupplements, newSupplement];
      secureStorage.set('supplements', allSupplements);
      return { supplements: allSupplements };
    });

    return newSupplement;
  },

  getSupplementsByHostId: (hostId) => {
    return get().supplements
      .filter(s => s.hostId === hostId)
      .sort((a, b) => dayjs(b.createTime).valueOf() - dayjs(a.createTime).valueOf());
  },

  hasPermission: (permission) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    return hasPermission(currentUser, permission);
  },

  getStats: () => {
    const { alarms } = get();
    return {
      pending: alarms.filter(a => a.status === 'pending').length,
      processing: alarms.filter(a => a.status === 'processing').length,
      completed: alarms.filter(a => a.status === 'completed').length,
      abnormal: alarms.filter(a => a.status === 'abnormal').length,
    };
  },
}));
