import { create } from 'zustand';
import type { ViewMode, UserRole, AnomalyType, ChartSyncState, FilterParams } from '@/types';
import { storage } from '@/utils/storage';

interface ViewState {
  currentView: ViewMode;
  currentRole: UserRole;
  anomalyState: AnomalyType | null;
  chartSyncState: ChartSyncState;
  filters: FilterParams;
  filterTimestamp: number;
  chartRenderTimestamp: number;
  searchKeyword: string;

  toggleView: () => void;
  setView: (view: ViewMode) => void;
  setRole: (role: UserRole) => void;
  setAnomalyState: (state: AnomalyType | null) => void;
  setChartSyncState: (state: ChartSyncState) => void;
  updateChartRenderTimestamp: () => void;
  setFilters: (filters: FilterParams) => void;
  resetFilters: () => void;
  setSearchKeyword: (keyword: string) => void;
}

export const useViewStore = create<ViewState>((set, get) => ({
  currentView: storage.get('currentView', 'duty' as ViewMode),
  currentRole: storage.get('currentRole', 'operator' as UserRole),
  anomalyState: null,
  chartSyncState: 'synced',
  filters: storage.get('filters', {}),
  filterTimestamp: Date.now(),
  chartRenderTimestamp: Date.now(),
  searchKeyword: '',

  toggleView: () => {
    const newView = get().currentView === 'duty' ? 'review' : 'duty';
    storage.set('currentView', newView);
    set({ currentView: newView });
  },

  setView: (view) => {
    storage.set('currentView', view);
    set({ currentView: view });
  },

  setRole: (role) => {
    storage.set('currentRole', role);
    set({ currentRole: role });
  },

  setAnomalyState: (state) => set({ anomalyState: state }),

  setChartSyncState: (state) => set({ chartSyncState: state }),

  updateChartRenderTimestamp: () => set({ chartRenderTimestamp: Date.now() }),

  setFilters: (filters) => {
    storage.set('filters', filters);
    set({ filters, filterTimestamp: Date.now(), chartSyncState: 'outdated' });
  },

  resetFilters: () => {
    storage.set('filters', {});
    set({ filters: {}, filterTimestamp: Date.now(), chartSyncState: 'outdated' });
  },

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
}));
