import { create } from 'zustand';
import type {
  CourseRescheduleRecord,
  StatsSummary,
  RecordFilters,
  ExportLog,
  ChangeHistory,
  ExceptionEvent,
  UserRole,
  RecordStatus,
} from '../../shared/types';

interface RecordsState {
  records: CourseRescheduleRecord[];
  currentRecord: CourseRescheduleRecord | null;
  stats: StatsSummary;
  exportLogs: ExportLog[];
  filters: RecordFilters;
  loading: boolean;
  error: string | null;

  setFilters: (f: Partial<RecordFilters>) => void;
  fetchRecords: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchRecord: (id: string) => Promise<void>;
  fetchExportLogs: () => Promise<void>;
  createRecord: (data: Partial<CourseRescheduleRecord>) => Promise<CourseRescheduleRecord | null>;
  supplementRecord: (data: Partial<CourseRescheduleRecord>) => Promise<CourseRescheduleRecord | null>;
  updateRecord: (
    id: string,
    patch: Partial<CourseRescheduleRecord>,
    meta: { operator: string; operatorRole: UserRole; note: string },
  ) => Promise<CourseRescheduleRecord | null>;
  reviewRecord: (id: string, note?: string) => Promise<CourseRescheduleRecord | null>;
  addNote: (id: string, latestNote: string, operator?: string) => Promise<CourseRescheduleRecord | null>;
  addException: (
    id: string,
    evt: Omit<ExceptionEvent, 'id' | 'recordId' | 'createdAt'>,
  ) => Promise<ExceptionEvent | null>;
  exportRecords: (opts?: { format?: 'csv' | 'xlsx'; operator?: string }) => Promise<void>;
}

const api = async <T>(url: string, opts?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data as T;
};

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [],
  currentRecord: null,
  stats: { pending: 0, reviewed: 0, exception: 0, supplemented: 0, total: 0 },
  exportLogs: [],
  filters: {},
  loading: false,
  error: null,

  setFilters: (f) => set({ filters: { ...get().filters, ...f } }),

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      const f = get().filters;
      Object.entries(f).forEach(([k, v]) => {
        if (v) params.set(k, String(v));
      });
      const data = await api<any>(`/api/records?${params.toString()}`);
      set({ records: data as any, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const data = await api<StatsSummary>('/api/stats/summary');
      set({ stats: data });
    } catch (_) {}
  },

  fetchRecord: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api<CourseRescheduleRecord>(`/api/records/${id}`);
      set({ currentRecord: data, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchExportLogs: async () => {
    try {
      const data = await api<ExportLog[]>('/api/export/logs');
      set({ exportLogs: data });
    } catch (_) {}
  },

  createRecord: async (data) => {
    try {
      const rec = await api<CourseRescheduleRecord>('/api/records', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await get().fetchRecords();
      await get().fetchStats();
      return rec;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  supplementRecord: async (data) => {
    try {
      const rec = await api<CourseRescheduleRecord>('/api/records/supplement', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await get().fetchRecords();
      await get().fetchStats();
      return rec;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  updateRecord: async (id, patch, meta) => {
    try {
      const rec = await api<CourseRescheduleRecord>(`/api/records/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...patch, ...meta }),
      });
      set({ currentRecord: rec });
      await get().fetchRecords();
      await get().fetchStats();
      return rec;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  reviewRecord: async (id, note = '复核通过') => {
    try {
      const rec = await api<CourseRescheduleRecord>(`/api/records/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ note, operator: '王园长' }),
      });
      set({ currentRecord: rec });
      await get().fetchRecords();
      await get().fetchStats();
      return rec;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  addNote: async (id, latestNote, operator = '张护士') => {
    try {
      const rec = await api<CourseRescheduleRecord>(`/api/records/${id}/note`, {
        method: 'POST',
        body: JSON.stringify({ latestNote, operator, operatorRole: 'nurse' as UserRole }),
      });
      set({ currentRecord: rec });
      await get().fetchRecords();
      return rec;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  addException: async (id, evt) => {
    try {
      const res = await api<ExceptionEvent>(`/api/records/${id}/exception`, {
        method: 'POST',
        body: JSON.stringify(evt),
      });
      await get().fetchRecord(id);
      await get().fetchRecords();
      await get().fetchStats();
      return res;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  exportRecords: async (opts = {}) => {
    const { format = 'csv', operator = '王园长' } = opts;
    const f = get().filters;
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    params.set('format', format);
    params.set('operator', operator);
    window.open(`/api/export?${params.toString()}`, '_blank');
    await get().fetchExportLogs();
  },
}));
