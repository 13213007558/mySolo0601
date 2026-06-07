import { create } from 'zustand';
import type {
  PhotoAuthorization,
  StatsSummary,
  ListFilters,
} from '@shared/types';

interface AuthState {
  records: PhotoAuthorization[];
  stats: StatsSummary;
  classes: string[];
  filters: ListFilters;
  loading: boolean;
  error: string | null;
  setFilters: (f: Partial<ListFilters>) => void;
  fetchAll: () => Promise<void>;
}

const emptyStats: StatsSummary = {
  total: 0,
  pending: 0,
  authorized: 0,
  partial: 0,
  revoked: 0,
  expired: 0,
  badData: 0,
  manualEntry: 0,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  records: [],
  stats: emptyStats,
  classes: [],
  filters: {},
  loading: false,
  error: null,
  setFilters: (f) => {
    set({ filters: { ...get().filters, ...f } });
    get().fetchAll();
  },
  fetchAll: async () => {
    const { filters } = get();
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.className) params.set('className', filters.className);
      if (filters.babyName) params.set('babyName', filters.babyName);
      if (filters.includeBadData) params.set('includeBadData', 'true');
      const [listRes, classRes] = await Promise.all([
        fetch('/api/records' + (params.toString() ? '?' + params.toString() : '')),
        fetch('/api/records/classes'),
      ]);
      if (!listRes.ok) throw new Error('加载失败');
      const listJson = await listRes.json();
      const classes = await classRes.json();
      set({
        records: listJson.data || [],
        stats: listJson.stats || emptyStats,
        classes: Array.isArray(classes) ? classes : [],
      });
    } catch (e: any) {
      set({ error: e.message || '加载失败' });
    } finally {
      set({ loading: false });
    }
  },
}));
