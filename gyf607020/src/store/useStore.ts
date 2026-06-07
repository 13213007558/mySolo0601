import { create } from 'zustand';
import type { ListFilters, RecordStatus, MilkRecord, ListResponse } from '@shared/types';

interface Store {
  filters: ListFilters;
  records: MilkRecord[];
  total: number;
  normalCount: number;
  badCount: number;
  loading: boolean;
  error: string | null;
  currentUser: string;

  setFilters: (f: Partial<ListFilters>) => void;
  resetFilters: () => void;
  fetchRecords: () => Promise<void>;
  setCurrentUser: (name: string) => void;
}

const defaultFilters: ListFilters = {
  phone: '',
  status: undefined,
  includeBadData: false,
  startDate: '',
  endDate: '',
};

function buildQuery(params: ListFilters): string {
  const qs = new URLSearchParams();
  if (params.phone) qs.set('phone', params.phone);
  if (params.status) qs.set('status', params.status);
  if (params.includeBadData) qs.set('includeBadData', 'true');
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  return qs.toString();
}

export const useStore = create<Store>((set, get) => ({
  filters: defaultFilters,
  records: [],
  total: 0,
  normalCount: 0,
  badCount: 0,
  loading: false,
  error: null,
  currentUser: '店长王姐',

  setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
  resetFilters: () => set({ filters: defaultFilters }),

  setCurrentUser: (name) => set({ currentUser: name }),

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const qs = buildQuery(get().filters);
      const res = await fetch(`/api/records${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('加载失败');
      const data = (await res.json()) as ListResponse;
      set({
        records: data.data,
        total: data.total,
        normalCount: data.normalCount,
        badCount: data.badCount,
      });
    } catch (e: any) {
      set({ error: e.message || '加载失败' });
    } finally {
      set({ loading: false });
    }
  },
}));

export { buildQuery };
export type { ListFilters, RecordStatus, MilkRecord };
