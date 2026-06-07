import { create } from 'zustand';
import type { AuditLog } from '../../shared/types';

interface AuditState {
  logsByRecord: Record<string, AuditLog[]>;
  loading: boolean;
  fetchByRecord: (recordId: string) => Promise<void>;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  logsByRecord: {},
  loading: false,

  fetchByRecord: async (recordId) => {
    if (get().logsByRecord[recordId]?.length) return;
    set({ loading: true });
    const res = await fetch(`/api/records/${recordId}/audit`);
    const json = await res.json();
    if (json.success) {
      set((s) => ({
        logsByRecord: { ...s.logsByRecord, [recordId]: json.data },
        loading: false,
      }));
    } else {
      set({ loading: false });
    }
  },
}));
