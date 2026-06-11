import { create } from 'zustand';
import type { Zone, MeasurePoint, Evidence, Suggestion, SuggestionVersion, UnitMode, RiskLevel, SlopeResult } from '@/types';
import { calculateSlopes } from '@/utils/slopeCalc';

interface AppState {
  zones: Zone[];
  selectedZoneId: string | null;
  measurePoints: MeasurePoint[];
  evidences: Evidence[];
  suggestion: Suggestion | undefined;
  suggestionVersions: SuggestionVersion[];
  slopes: SlopeResult[];
  unitMode: UnitMode;
  filterRiskLevels: RiskLevel[];
  showExportPanel: boolean;
  editingSuggestion: boolean;
  editingContent: string;
  editingChangeNote: string;
  comparingVersions: boolean;
  compareVersionA: SuggestionVersion | null;
  compareVersionB: SuggestionVersion | null;
  initialized: boolean;

  setZones: (zones: Zone[]) => void;
  selectZone: (zoneId: string) => void;
  setMeasurePoints: (points: MeasurePoint[]) => void;
  setEvidences: (evidences: Evidence[]) => void;
  setSuggestion: (suggestion: Suggestion | undefined) => void;
  setSuggestionVersions: (versions: SuggestionVersion[]) => void;
  recalcSlopes: () => void;
  toggleUnit: () => void;
  setFilterRiskLevels: (levels: RiskLevel[]) => void;
  setShowExportPanel: (show: boolean) => void;
  startEditingSuggestion: () => void;
  cancelEditingSuggestion: () => void;
  setEditingContent: (content: string) => void;
  setEditingChangeNote: (note: string) => void;
  setComparingVersions: (comparing: boolean) => void;
  setCompareVersions: (a: SuggestionVersion | null, b: SuggestionVersion | null) => void;
  setInitialized: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  zones: [],
  selectedZoneId: null,
  measurePoints: [],
  evidences: [],
  suggestion: undefined,
  suggestionVersions: [],
  slopes: [],
  unitMode: 'mm',
  filterRiskLevels: [],
  showExportPanel: false,
  editingSuggestion: false,
  editingContent: '',
  editingChangeNote: '',
  comparingVersions: false,
  compareVersionA: null,
  compareVersionB: null,
  initialized: false,

  setZones: (zones) => set({ zones }),

  selectZone: (zoneId) => {
    set({ selectedZoneId: zoneId, filterRiskLevels: [], showExportPanel: false, editingSuggestion: false, comparingVersions: false });
  },

  setMeasurePoints: (points) => {
    set({ measurePoints: points });
    get().recalcSlopes();
  },

  setEvidences: (evidences) => set({ evidences }),
  setSuggestion: (suggestion) => set({ suggestion }),
  setSuggestionVersions: (versions) => set({ suggestionVersions: versions }),

  recalcSlopes: () => {
    const state = get();
    const zone = state.zones.find((z) => z.id === state.selectedZoneId);
    if (zone) {
      const slopes = calculateSlopes(state.measurePoints, zone);
      set({ slopes });
    }
  },

  toggleUnit: () => set((s) => ({ unitMode: s.unitMode === 'mm' ? 'cm' : 'mm' })),
  setFilterRiskLevels: (levels) => set({ filterRiskLevels: levels }),
  setShowExportPanel: (show) => set({ showExportPanel: show }),

  startEditingSuggestion: () => {
    const current = get().suggestion?.currentContent || '';
    set({ editingSuggestion: true, editingContent: current, editingChangeNote: '' });
  },

  cancelEditingSuggestion: () => set({ editingSuggestion: false, editingContent: '', editingChangeNote: '' }),
  setEditingContent: (content) => set({ editingContent: content }),
  setEditingChangeNote: (note) => set({ editingChangeNote: note }),
  setComparingVersions: (comparing) => set({ comparingVersions: comparing }),
  setCompareVersions: (a, b) => set({ compareVersionA: a, compareVersionB: b }),
  setInitialized: (v) => set({ initialized: v }),
}));
