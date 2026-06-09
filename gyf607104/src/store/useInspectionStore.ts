import { create } from 'zustand';
import type { HotSpotRecord, FilterState } from '@/types';
import { MOCK_RECORDS } from '@/data/mockData';
import { desensitizeRecords } from '@/utils/desensitize';
import { useAuthStore } from './useAuthStore';

interface InspectionState {
  records: HotSpotRecord[];
  filteredRecords: HotSpotRecord[];
  filters: FilterState;
  selectedRecordId: string | null;
  highlightedVersionId: string | null;
  expandedImageSections: Record<string, boolean>;
  
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  selectRecord: (id: string | null) => void;
  setHighlightedVersion: (versionId: string | null) => void;
  toggleImageSection: (recordId: string) => void;
  getRecordById: (id: string) => HotSpotRecord | undefined;
  refreshRecords: () => void;
}

const defaultFilters: FilterState = {
  searchText: '',
  stationName: '',
  hotSpotLevel: '',
  status: '',
  dateRange: { start: '', end: '' },
  isManuallySupplemented: null,
};

export const useInspectionStore = create<InspectionState>((set, get) => {
  const initialRecords = MOCK_RECORDS;
  
  const applyFiltersWithRole = (records: HotSpotRecord[], filters: FilterState, role: string): HotSpotRecord[] => {
    let filtered = [...records];
    
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(r => 
        r.id.toLowerCase().includes(searchLower) ||
        r.componentId.toLowerCase().includes(searchLower) ||
        r.stationName.toLowerCase().includes(searchLower) ||
        r.location.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.stationName) {
      filtered = filtered.filter(r => r.stationName === filters.stationName);
    }
    
    if (filters.hotSpotLevel) {
      filtered = filtered.filter(r => r.hotSpotLevel === filters.hotSpotLevel);
    }
    
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    
    if (filters.dateRange.start) {
      filtered = filtered.filter(r => r.detectedDate >= filters.dateRange.start);
    }
    
    if (filters.dateRange.end) {
      filtered = filtered.filter(r => r.detectedDate <= filters.dateRange.end);
    }
    
    if (filters.isManuallySupplemented !== null) {
      filtered = filtered.filter(r => r.isManuallySupplemented === filters.isManuallySupplemented);
    }
    
    return desensitizeRecords(filtered, role as never);
  };
  
  return {
    records: initialRecords,
    filteredRecords: initialRecords,
    filters: defaultFilters,
    selectedRecordId: null,
    highlightedVersionId: null,
    expandedImageSections: {},
    
    setFilters: (newFilters) => {
      const updatedFilters = { ...get().filters, ...newFilters };
      const role = useAuthStore.getState().currentRole;
      const filtered = applyFiltersWithRole(get().records, updatedFilters, role);
      set({
        filters: updatedFilters,
        filteredRecords: filtered,
      });
    },
    
    resetFilters: () => {
      const role = useAuthStore.getState().currentRole;
      set({
        filters: defaultFilters,
        filteredRecords: desensitizeRecords(get().records, role as never),
      });
    },
    
    applyFilters: () => {
      const { records, filters } = get();
      const role = useAuthStore.getState().currentRole;
      const filtered = applyFiltersWithRole(records, filters, role);
      set({ filteredRecords: filtered });
    },
    
    selectRecord: (id) => set({ selectedRecordId: id }),
    
    setHighlightedVersion: (versionId) => set({ highlightedVersionId: versionId }),
    
    toggleImageSection: (recordId) => {
      const { expandedImageSections } = get();
      set({
        expandedImageSections: {
          ...expandedImageSections,
          [recordId]: !expandedImageSections[recordId],
        },
      });
    },
    
    getRecordById: (id) => {
      const { records } = get();
      const role = useAuthStore.getState().currentRole;
      const record = records.find(r => r.id === id);
      if (!record) return undefined;
      return desensitizeRecords([record], role as never)[0];
    },
    
    refreshRecords: () => {
      const { filters } = get();
      const role = useAuthStore.getState().currentRole;
      const filtered = applyFiltersWithRole(MOCK_RECORDS, filters, role);
      set({
        records: MOCK_RECORDS,
        filteredRecords: filtered,
      });
    },
  };
});
