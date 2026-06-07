import { create } from 'zustand';
import type { Baby, AuthRecord, BabySummary, Stats, CreateRecordBody } from '@shared/types';

interface AppState {
  loading: boolean;
  summaries: BabySummary[];
  stats: Stats | null;
  detailBaby: Baby | null;
  detailRecords: AuthRecord[];
  toast: { id: number; type: 'success' | 'error' | 'info'; message: string } | null;

  fetchAll: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  addRecord: (body: CreateRecordBody) => Promise<boolean>;
  clearDetail: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  clearToast: () => void;
}

export const useAuthStore = create<AppState>((set, get) => ({
  loading: false,
  summaries: [],
  stats: null,
  detailBaby: null,
  detailRecords: [],
  toast: null,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const [sRes, tRes] = await Promise.all([fetch('/api/babies'), fetch('/api/stats')]);
      const summaries = await sRes.json() as BabySummary[];
      const stats = await tRes.json() as Stats;
      set({ summaries, stats, loading: false });
    } catch {
      set({ loading: false });
      get().showToast('error', '加载数据失败，请稍后重试');
    }
  },

  fetchStats: async () => {
    try {
      const res = await fetch('/api/stats');
      const stats = await res.json() as Stats;
      set({ stats });
    } catch {
      // ignore
    }
  },

  fetchDetail: async (id: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/babies/${id}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json() as { baby: Baby; records: AuthRecord[] };
      set({ detailBaby: data.baby, detailRecords: data.records, loading: false });
    } catch {
      set({ loading: false, detailBaby: null, detailRecords: [] });
      get().showToast('error', '未找到该宝宝记录');
    }
  },

  addRecord: async (body: CreateRecordBody) => {
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('bad request');
      const data = await res.json() as { record: AuthRecord; created: boolean };
      if (data.created) {
        get().showToast('success', `补录成功：${data.record.operatorName} 新增 v${data.record.version}`);
      } else {
        get().showToast('info', '检测到重复提交，已忽略（未新增版本）');
      }
      await get().fetchAll();
      if (get().detailBaby?.id === body.babyId) {
        await get().fetchDetail(body.babyId);
      }
      return true;
    } catch {
      get().showToast('error', '提交失败，请核对表单');
      return false;
    }
  },

  clearDetail: () => set({ detailBaby: null, detailRecords: [] }),

  showToast: (type, message) => {
    const id = Date.now();
    set({ toast: { id, type, message } });
    setTimeout(() => {
      set((s) => (s.toast?.id === id ? { toast: null } : {}));
    }, 2600);
  },

  clearToast: () => set({ toast: null }),
}));
