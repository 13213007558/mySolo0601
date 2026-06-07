import { create } from 'zustand';
import type { RecordWithBaby, MorningCheck, DataQuality, ReviewStatus } from '../../shared/types';

interface ApiResp<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RecordsState {
  records: RecordWithBaby[];
  loading: boolean;
  filters: {
    dataQuality?: DataQuality | 'all';
    reviewStatus?: ReviewStatus | 'all';
    date?: string;
    className?: string;
    keyword?: string;
  };
  fetchRecords: () => Promise<void>;
  setFilter: (key: keyof RecordsState['filters'], value: unknown) => void;
  updateRecord: (id: string, data: Partial<MorningCheck>, operator: string) => Promise<ApiResp>;
  createRecord: (data: Record<string, unknown>[]) => Promise<ApiResp>;
  manualEntry: (babyId: string, date: string, data: Partial<MorningCheck>, operator: string) => Promise<ApiResp>;
  getFilteredRecords: () => RecordWithBaby[];
}

function enrichRecords(records: MorningCheck[], babies: { id: string; name: string; avatar: string; className: string }[]): RecordWithBaby[] {
  return records.map((r) => {
    const baby = babies.find((b) => b.id === r.babyId);
    return {
      ...r,
      babyName: baby?.name ?? '未知',
      babyAvatar: baby?.avatar ?? '',
      className: baby?.className ?? '未知班级',
    };
  });
}

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [],
  loading: false,
  filters: {
    dataQuality: 'all',
    reviewStatus: 'all',
  },

  fetchRecords: async () => {
    set({ loading: true });
    const [recRes, babyRes] = await Promise.all([fetch('/api/records'), fetch('/api/babies')]);
    const recJson = await recRes.json();
    const babyJson = await babyRes.json();
    if (recJson.success && babyJson.success) {
      const enriched = enrichRecords(recJson.data, babyJson.data);
      set({ records: enriched, loading: false });
    } else {
      set({ loading: false });
    }
  },

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value } }));
  },

  updateRecord: async (id, data, operator) => {
    const res = await fetch(`/api/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, operator }),
    });
    const json = await res.json();
    if (json.success) {
      await get().fetchRecords();
    }
    return json;
  },

  createRecord: async (data) => {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    await get().fetchRecords();
    return json as ApiResp;
  },

  manualEntry: async (babyId, date, data, operator) => {
    const res = await fetch('/api/records/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ babyId, date, data, operator }),
    });
    const json = await res.json();
    if (json.success) {
      await get().fetchRecords();
    }
    return json;
  },

  getFilteredRecords: () => {
    const { records, filters } = get();
    return records.filter((r) => {
      if (filters.dataQuality && filters.dataQuality !== 'all' && r.dataQuality !== filters.dataQuality) return false;
      if (filters.reviewStatus && filters.reviewStatus !== 'all' && r.reviewStatus !== filters.reviewStatus) return false;
      if (filters.className && filters.className !== 'all' && r.className !== filters.className) return false;
      if (filters.date && r.date !== filters.date) return false;
      if (filters.keyword && !r.babyName.includes(filters.keyword)) return false;
      return true;
    });
  },
}));
