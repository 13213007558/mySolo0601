import { create } from 'zustand';
import type { Baby } from '../../shared/types';

interface BabyState {
  babies: Baby[];
  loading: boolean;
  fetchBabies: () => Promise<void>;
  lookupByExportRow: (rowNo: number) => Promise<Baby | null>;
  getBaby: (id: string) => Baby | undefined;
}

export const useBabyStore = create<BabyState>((set, get) => ({
  babies: [],
  loading: false,

  fetchBabies: async () => {
    set({ loading: true });
    const res = await fetch('/api/babies');
    const json = await res.json();
    if (json.success) {
      set({ babies: json.data, loading: false });
    } else {
      set({ loading: false });
    }
  },

  lookupByExportRow: async (rowNo) => {
    const res = await fetch(`/api/export/lookup?rowNo=${rowNo}`);
    const json = await res.json();
    if (json.success) {
      return json.data.baby as Baby;
    }
    return null;
  },

  getBaby: (id) => get().babies.find((b) => b.id === id),
}));
