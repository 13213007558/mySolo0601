import { create } from 'zustand';
import type { Baby, BabyDetail, DataStatus, ImportResult, ImportAudit, OperationLog } from '@shared/types';
import { api } from '../lib/api';

interface AppState {
  babies: Baby[];
  stats: Record<string, number>;
  statusFilter: DataStatus | 'all';
  searchKeyword: string;
  currentBaby: BabyDetail | null;
  importResult: ImportResult | null;
  importAudits: ImportAudit[];
  operationLogs: OperationLog[];
  loading: boolean;
  error: string | null;
  refreshBabies: () => Promise<void>;
  setStatusFilter: (s: DataStatus | 'all') => void;
  setSearchKeyword: (s: string) => void;
  loadBabyDetail: (id: string) => Promise<void>;
  clearCurrentBaby: () => void;
  setImportResult: (r: ImportResult | null) => void;
  loadAuditData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  babies: [],
  stats: { total: 0, normal: 0, dirty: 0, empty: 0, missing_material: 0, pending_review: 0 },
  statusFilter: 'all',
  searchKeyword: '',
  currentBaby: null,
  importResult: null,
  importAudits: [],
  operationLogs: [],
  loading: false,
  error: null,

  refreshBabies: async () => {
    set({ loading: true });
    try {
      const { statusFilter, searchKeyword } = get();
      const s = statusFilter === 'all' ? undefined : statusFilter;
      const { babies, stats } = await api.getBabies(s, searchKeyword || undefined);
      set({ babies, stats, loading: false, error: null });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  setStatusFilter: (s) => set({ statusFilter: s }),
  setSearchKeyword: (s) => set({ searchKeyword: s }),

  loadBabyDetail: async (id) => {
    set({ loading: true, currentBaby: null });
    try {
      const baby = await api.getBabyDetail(id);
      set({ currentBaby: baby, loading: false, error: null });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  clearCurrentBaby: () => set({ currentBaby: null }),
  setImportResult: (r) => set({ importResult: r }),

  loadAuditData: async () => {
    set({ loading: true });
    try {
      const [audits, logs] = await Promise.all([api.getImportAudits(), api.getOperationLogs()]);
      set({ importAudits: audits, operationLogs: logs, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
}));
