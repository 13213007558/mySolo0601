import { create } from 'zustand';
import type { Authorization, SummaryStats } from 'shared/types.js';
import type { AuthFilter } from '../lib/api.js';
import { authApi } from '../lib/api.js';

interface AuthState {
  filter: AuthFilter;
  setFilter: (f: AuthFilter) => void;
  summary: SummaryStats | null;
  loadSummary: () => Promise<void>;
  list: Authorization[];
  total: number;
  loadList: () => Promise<void>;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  filter: { page: 1, pageSize: 10 },
  setFilter: (f) => set({ filter: { ...get().filter, ...f } }),
  summary: null,
  loadSummary: async () => {
    const s = await authApi.getSummary();
    set({ summary: s });
  },
  list: [],
  total: 0,
  loadList: async () => {
    const res = await authApi.list(get().filter);
    set({ list: res.data, total: res.total });
  },
  selectedIds: new Set<string>(),
  toggleSelect: (id) => {
    const s = new Set(get().selectedIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    set({ selectedIds: s });
  },
  toggleSelectAll: () => {
    const cur = get().selectedIds;
    const all = get().list.map(a => a.id);
    const allSelected = all.length > 0 && all.every(id => cur.has(id));
    set({ selectedIds: allSelected ? new Set() : new Set(all) });
  },
  clearSelection: () => set({ selectedIds: new Set() }),
}));
