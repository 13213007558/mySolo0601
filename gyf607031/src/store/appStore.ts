import { create } from 'zustand';
import type { Baby, AuditLog, DataStatus, ImportResult } from '../../shared/types';

interface AppState {
  babies: Baby[];
  audits: AuditLog[];
  status: DataStatus;
  selectedBabyId: string | null;
  importResult: ImportResult | null;
  loading: boolean;
  error: string | null;

  fetchBabies: () => Promise<void>;
  fetchAudits: () => Promise<void>;
  fetchBabyDetail: (id: string) => Promise<Baby | null>;
  selectBaby: (id: string | null) => void;
  addNote: (babyId: string, content: string, operator: string) => Promise<boolean>;
  addManualBaby: (data: { name: string; phone: string; room: string; className: string }) => Promise<Baby | null>;
  importRows: (rows: { name: string; phone: string; room: string; className: string }[]) => Promise<ImportResult | null>;
  clearImportResult: () => void;
  logExport: (operator: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  babies: [],
  audits: [],
  status: 'empty',
  selectedBabyId: null,
  importResult: null,
  loading: false,
  error: null,

  fetchBabies: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/babies');
      const json = await res.json();
      if (json.success) {
        set({ babies: json.data, status: json.status, loading: false });
      }
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchAudits: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/audit');
      const json = await res.json();
      if (json.success) {
        set({ audits: json.data, loading: false });
      }
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchBabyDetail: async (id) => {
    try {
      const res = await fetch(`/api/babies/${id}`);
      const json = await res.json();
      if (json.success) {
        const baby = json.data as Baby;
        set(state => ({
          babies: state.babies.map(b => b.id === id ? baby : b),
        }));
        return baby;
      }
    } catch (e) {
      set({ error: String(e) });
    }
    return null;
  },

  selectBaby: (id) => set({ selectedBabyId: id }),

  addNote: async (babyId, content, operator) => {
    try {
      const res = await fetch(`/api/babies/${babyId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, operator }),
      });
      const json = await res.json();
      if (json.success) {
        await get().fetchBabyDetail(babyId);
        await get().fetchAudits();
        return true;
      }
    } catch (e) {
      set({ error: String(e) });
    }
    return false;
  },

  addManualBaby: async (data) => {
    try {
      const res = await fetch('/api/babies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        await get().fetchBabies();
        await get().fetchAudits();
        return json.data;
      }
    } catch (e) {
      set({ error: String(e) });
    }
    return null;
  },

  importRows: async (rows) => {
    try {
      const res = await fetch('/api/babies/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (json.success) {
        set({ importResult: json.data });
        await get().fetchBabies();
        await get().fetchAudits();
        return json.data;
      }
    } catch (e) {
      set({ error: String(e) });
    }
    return null;
  },

  clearImportResult: () => set({ importResult: null }),

  logExport: async (operator) => {
    try {
      await fetch('/api/babies/export/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator }),
      });
      await get().fetchAudits();
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));
