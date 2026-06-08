import { create } from 'zustand';
import type {
  AuthorizationRecord,
  AuthorizationRecordWithHistory,
  SummaryStats,
  UserRole,
  CreateRecordInput,
  UpdateRecordInput,
} from '../../shared/types';
import { api } from '@/lib/api';

interface AppState {
  role: UserRole;
  setRole: (role: UserRole) => void;

  records: AuthorizationRecord[];
  stats: SummaryStats | null;
  selectedRecord: AuthorizationRecordWithHistory | null;
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchRecord: (id: string) => Promise<void>;
  clearSelected: () => void;

  createRecord: (input: CreateRecordInput) => Promise<{ success: boolean; error?: string }>;
  updateRecord: (id: string, input: Omit<UpdateRecordInput, 'id'>) => Promise<{ success: boolean; error?: string }>;
  supplementRecord: (id: string, input: CreateRecordInput) => Promise<{ success: boolean; error?: string }>;
  invalidateRecord: (id: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

const emptyStats: SummaryStats = {
  total: 0,
  authorized: 0,
  pending: 0,
  denied: 0,
  conflicted: 0,
  revoked: 0,
  supplemented: 0,
  invalid: 0,
};

export const useAppStore = create<AppState>((set, get) => ({
  role: 'parent',
  setRole: (role) => set({ role }),

  records: [],
  stats: null,
  selectedRecord: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    const res = await api.getRecords(false);
    if (res.success && res.data) {
      set({ records: res.data, loading: false });
      await get().fetchStats();
    } else {
      set({ error: res.error || '加载失败', loading: false });
    }
  },

  fetchStats: async () => {
    const res = await api.getStats();
    if (res.success && res.data) {
      set({ stats: res.data });
    } else {
      set({ stats: emptyStats });
    }
  },

  fetchRecord: async (id: string) => {
    set({ loading: true, error: null });
    const res = await api.getRecord(id);
    if (res.success && res.data) {
      set({ selectedRecord: res.data, loading: false });
    } else {
      set({ error: res.error || '加载失败', loading: false });
    }
  },

  clearSelected: () => set({ selectedRecord: null }),

  createRecord: async (input) => {
    const res = await api.createRecord(input);
    if (res.success) {
      await get().fetchAll();
      return { success: true };
    }
    return { success: false, error: res.error };
  },

  updateRecord: async (id, input) => {
    const res = await api.updateRecord(id, input);
    if (res.success) {
      await get().fetchAll();
      if (get().selectedRecord?.current.id === id) {
        await get().fetchRecord(id);
      }
      return { success: true };
    }
    return { success: false, error: res.error };
  },

  supplementRecord: async (id, input) => {
    const res = await api.supplementRecord(id, input);
    if (res.success) {
      await get().fetchAll();
      return { success: true };
    }
    return { success: false, error: res.error };
  },

  invalidateRecord: async (id, reason) => {
    const res = await api.invalidateRecord(id, reason);
    if (res.success) {
      await get().fetchAll();
      if (get().selectedRecord?.current.id === id) {
        await get().fetchRecord(id);
      }
      return { success: true };
    }
    return { success: false, error: res.error };
  },
}));
