import { create } from 'zustand';
import type { MorningReview, Baby, ExportRow } from '@shared/types';
import { api } from '@/lib/api';

interface AppState {
  babies: Baby[];
  reviews: MorningReview[];
  exportRows: ExportRow[];
  loading: boolean;
  error: string | null;
  selectedReviewId: string | null;
  currentView: 'parent' | 'waiter' | 'kitchen' | 'manager';
  lastPollError: string | null;

  loadAll: () => Promise<void>;
  setSelectedReview: (id: string | null) => void;
  setCurrentView: (v: AppState['currentView']) => void;
  updateReview: (r: MorningReview) => void;
  startPolling: () => () => void;
}

export const useStore = create<AppState>((set, get) => ({
  babies: [],
  reviews: [],
  exportRows: [],
  loading: false,
  error: null,
  selectedReviewId: null,
  currentView: 'parent',
  lastPollError: null,

  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const [babies, reviews, exportRows] = await Promise.all([
        api.getBabies(),
        api.getReviews(),
        api.getExport(),
      ]);
      set({ babies, reviews, exportRows, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  setSelectedReview: (id) => set({ selectedReviewId: id }),
  setCurrentView: (v) => set({ currentView: v }),
  updateReview: (r) =>
    set((s) => {
      const reviews = s.reviews.map((x) => (x.id === r.id ? r : x));
      const baby = s.babies.find((b) => b.id === r.babyId);
      const exportRows = s.exportRows.map((er) =>
        er.reviewId === r.id
          ? {
              ...er,
              status: r.status,
              temperatureStatus: r.temperatureStatus,
              leaveStatus: r.leaveStatus,
              hasPhotoMissing: r.hasPhotoMissing,
            }
          : er,
      );
      if (baby && !exportRows.find((er) => er.reviewId === r.id)) {
        exportRows.push({
          reviewId: r.id,
          babyName: baby.name,
          className: baby.className,
          date: r.date,
          status: r.status,
          temperatureStatus: r.temperatureStatus,
          leaveStatus: r.leaveStatus,
          hasPhotoMissing: r.hasPhotoMissing,
        });
      }
      return { reviews, exportRows };
    }),

  startPolling: () => {
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      try {
        const reviews = await api.getReviews();
        const exportRows = await api.getExport();
        if (!stopped) set({ reviews, exportRows, lastPollError: null });
      } catch (e) {
        if (!stopped) set({ lastPollError: (e as Error).message });
      }
    };
    const id = setInterval(tick, 2000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  },
}));
