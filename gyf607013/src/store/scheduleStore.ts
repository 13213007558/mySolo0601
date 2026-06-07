import { create } from 'zustand';
import type {
  DisinfectionRecord,
  Baby,
  ClassInfo,
  ScanRecord,
} from '@/types';
import { api } from '@/utils/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

interface ScheduleState {
  records: DisinfectionRecord[];
  babies: Baby[];
  classes: ClassInfo[];
  scanRecords: ScanRecord[];
  loading: boolean;
  error: string | null;
  fetchRecords: (params?: Record<string, unknown>) => Promise<void>;
  fetchBabies: (params?: Record<string, unknown>) => Promise<void>;
  fetchClasses: () => Promise<void>;
  fetchScanRecords: (params?: Record<string, unknown>) => Promise<void>;
  fetchAll: () => Promise<void>;
  createRecord: (data: Omit<DisinfectionRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DisinfectionRecord>;
  updateRecord: (id: string, data: Partial<DisinfectionRecord>) => Promise<DisinfectionRecord>;
  setRecords: (records: DisinfectionRecord[]) => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  records: [],
  babies: [],
  classes: [],
  scanRecords: [],
  loading: false,
  error: null,

  fetchRecords: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      const res = await api<ApiResponse<DisinfectionRecord[]>>(`/schedules${query ? `?${query}` : ''}`);
      set({ records: res.data || [], loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取记录失败', loading: false });
    }
  },

  fetchBabies: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      const res = await api<ApiResponse<Baby[]>>(`/babies${query ? `?${query}` : ''}`);
      set({ babies: res.data || [], loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取宝宝列表失败', loading: false });
    }
  },

  fetchClasses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api<ApiResponse<ClassInfo[]>>('/classes');
      set({ classes: res.data || [], loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取班级列表失败', loading: false });
    }
  },

  fetchScanRecords: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      const res = await api<ApiResponse<ScanRecord[]>>(`/scan-records${query ? `?${query}` : ''}`);
      set({ scanRecords: res.data || [], loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取扫码记录失败', loading: false });
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [recordsRes, babiesRes, classesRes, scanRes] = await Promise.all([
        api<ApiResponse<DisinfectionRecord[]>>('/schedules'),
        api<ApiResponse<Baby[]>>('/babies'),
        api<ApiResponse<ClassInfo[]>>('/classes'),
        api<ApiResponse<ScanRecord[]>>('/scan-records'),
      ]);
      set({
        records: recordsRes.data || [],
        babies: babiesRes.data || [],
        classes: classesRes.data || [],
        scanRecords: scanRes.data || [],
        loading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载数据失败', loading: false });
    }
  },

  createRecord: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api<ApiResponse<DisinfectionRecord>>('/schedules', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const created = res.data;
      set((state) => ({
        records: [created, ...state.records],
        loading: false,
      }));
      return created;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建记录失败', loading: false });
      throw err;
    }
  },

  updateRecord: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await api<ApiResponse<DisinfectionRecord>>(`/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const updated = res.data;
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? updated : r)),
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新记录失败', loading: false });
      throw err;
    }
  },

  setRecords: (records) => set({ records }),
}));
