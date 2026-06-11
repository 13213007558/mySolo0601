import { create } from 'zustand';
import { Stone, Inclusion, InclusionType, PlotState, Erratum, ReportFieldMapping } from '@/types';
import { MOCK_STONES } from '@/data/mockStones';
import { getInclusionConfig } from '@/config/inclusionTypes';

interface StoneStore {
  stones: Stone[];
  currentStoneId: string | null;
  errata: Erratum[];
  auditLog: { timestamp: string; action: string; stoneId: string; details?: string }[];
  
  getCurrentStone: () => Stone | undefined;
  selectStone: (id: string) => void;
  addInclusion: (stoneId: string, x: number, y: number, type: InclusionType) => void;
  updateInclusion: (stoneId: string, inclusionId: string, updates: Partial<Inclusion>) => void;
  removeInclusion: (stoneId: string, inclusionId: string) => void;
  recalculateProgress: (stoneId: string) => void;
  submitStone: (stoneId: string) => void;
  requestErratum: (stoneId: string, reason: string, newPhotoUrl: string) => void;
  approveErratum: (erratumId: string) => void;
  confirmField: (stoneId: string, fieldId: string, systemValue: string) => void;
  
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'diamond-plot-storage-v1';

const calculateProgress = (stone: Stone): number => {
  if (stone.requiredInclusionCount === 0) return 100;
  const actual = Math.min(stone.inclusions.length, stone.requiredInclusionCount);
  return Math.round((actual / stone.requiredInclusionCount) * 100);
};

const getSectorFromCoords = (x: number, y: number): number => {
  const dx = x - 50;
  const dy = y - 50;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  angle = (angle + 360 + 90) % 360;
  return Math.floor(angle / 45);
};

export const useStoneStore = create<StoneStore>((set, get) => ({
  stones: [],
  currentStoneId: null,
  errata: [],
  auditLog: [],

  getCurrentStone: () => {
    const { stones, currentStoneId } = get();
    return stones.find(s => s.id === currentStoneId);
  },

  selectStone: (id: string) => {
    set({ currentStoneId: id });
    const stone = get().stones.find(s => s.id === id);
    if (stone && stone.status === 'pending') {
      get().stones = get().stones.map(s =>
        s.id === id ? { ...s, status: 'in_progress' } : s
      );
      set({ stones: [...get().stones] });
      get().saveToStorage();
    }
  },

  addInclusion: (stoneId: string, x: number, y: number, type: InclusionType) => {
    const cfg = getInclusionConfig(type);
    const newInclusion: Inclusion = {
      id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      stoneId,
      type,
      x,
      y,
      color: cfg?.color || '#999',
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      stones: state.stones.map(s => {
        if (s.id !== stoneId) return s;
        const updated = { ...s, inclusions: [...s.inclusions, newInclusion] };
        updated.progress = calculateProgress(updated);
        return updated;
      }),
      auditLog: [
        ...state.auditLog,
        { timestamp: new Date().toISOString(), action: 'ADD_INCLUSION', stoneId, details: type },
      ],
    }));
    get().saveToStorage();
  },

  updateInclusion: (stoneId: string, inclusionId: string, updates: Partial<Inclusion>) => {
    set(state => ({
      stones: state.stones.map(s => {
        if (s.id !== stoneId) return s;
        return {
          ...s,
          inclusions: s.inclusions.map(inc =>
            inc.id === inclusionId ? { ...inc, ...updates } : inc
          ),
        };
      }),
    }));
    get().saveToStorage();
  },

  removeInclusion: (stoneId: string, inclusionId: string) => {
    set(state => ({
      stones: state.stones.map(s => {
        if (s.id !== stoneId) return s;
        const updated = {
          ...s,
          inclusions: s.inclusions.filter(inc => inc.id !== inclusionId),
        };
        updated.progress = calculateProgress(updated);
        return updated;
      }),
      auditLog: [
        ...state.auditLog,
        { timestamp: new Date().toISOString(), action: 'REMOVE_INCLUSION', stoneId, details: inclusionId },
      ],
    }));
    get().saveToStorage();
  },

  recalculateProgress: (stoneId: string) => {
    set(state => ({
      stones: state.stones.map(s => {
        if (s.id !== stoneId) return s;
        return { ...s, progress: calculateProgress(s) };
      }),
    }));
  },

  submitStone: (stoneId: string) => {
    const stone = get().stones.find(s => s.id === stoneId);
    if (!stone || stone.progress < 100) return;

    const allConfirmed = stone.fieldMappings.every(f => f.confirmed);
    if (!allConfirmed) return;

    set(state => ({
      stones: state.stones.map(s =>
        s.id === stoneId
          ? { ...s, status: 'submitted', submittedAt: new Date().toISOString() }
          : s
      ),
      auditLog: [
        ...state.auditLog,
        { timestamp: new Date().toISOString(), action: 'SUBMIT_STONE', stoneId },
      ],
    }));
    get().saveToStorage();
  },

  requestErratum: (stoneId: string, reason: string, newPhotoUrl: string) => {
    const newErratum: Erratum = {
      id: `err-${Date.now()}`,
      stoneId,
      reason,
      newPhotoUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      errata: [...state.errata, newErratum],
      stones: state.stones.map(s =>
        s.id === stoneId ? { ...s, status: 'erratum_pending' } : s
      ),
      auditLog: [
        ...state.auditLog,
        { timestamp: new Date().toISOString(), action: 'REQUEST_ERRATUM', stoneId, details: reason },
      ],
    }));
    get().saveToStorage();
  },

  approveErratum: (erratumId: string) => {
    const erratum = get().errata.find(e => e.id === erratumId);
    if (!erratum) return;
    set(state => ({
      errata: state.errata.map(e =>
        e.id === erratumId ? { ...e, status: 'approved', approvedAt: new Date().toISOString() } : e
      ),
      stones: state.stones.map(s =>
        s.id === erratum.stoneId ? {
          ...s,
          status: 'in_progress',
          imageUrl: erratum.newPhotoUrl || s.imageUrl,
          fieldMappings: s.fieldMappings.map(f => ({ ...f, confirmed: false, systemValue: '' })),
        } : s
      ),
      auditLog: [
        ...state.auditLog,
        { timestamp: new Date().toISOString(), action: 'APPROVE_ERRATUM', stoneId: erratum.stoneId },
      ],
    }));
    get().saveToStorage();
  },

  confirmField: (stoneId: string, fieldId: string, systemValue: string) => {
    set(state => ({
      stones: state.stones.map(s => {
        if (s.id !== stoneId) return s;
        return {
          ...s,
          fieldMappings: s.fieldMappings.map(f =>
            f.id === fieldId ? { ...f, confirmed: true, systemValue } : f
          ),
        };
      }),
    }));
    get().saveToStorage();
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          stones: data.stones || MOCK_STONES,
          errata: data.errata || [],
          auditLog: data.auditLog || [],
          currentStoneId: data.currentStoneId || (data.stones?.[0]?.id ?? MOCK_STONES[0]?.id ?? null),
        });
      } else {
        set({
          stones: MOCK_STONES,
          currentStoneId: MOCK_STONES[0]?.id ?? null,
        });
      }
    } catch (e) {
      set({
        stones: MOCK_STONES,
        currentStoneId: MOCK_STONES[0]?.id ?? null,
      });
    }
  },

  saveToStorage: () => {
    const { stones, errata, auditLog, currentStoneId } = get();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ stones, errata, auditLog, currentStoneId })
    );
  },
}));

interface PlotStore {
  isDragging: boolean;
  selectedInclusionId: string | null;
  currentInclusionType: InclusionType;
  showSectorHints: boolean;
  showPhotoOverlay: boolean;
  ripple: { x: number; y: number; id: number } | null;

  setDragging: (v: boolean) => void;
  setSelectedInclusion: (id: string | null) => void;
  setCurrentInclusionType: (t: InclusionType) => void;
  toggleSectorHints: () => void;
  togglePhotoOverlay: () => void;
  triggerRipple: (x: number, y: number) => void;
  clearRipple: () => void;
}

export const usePlotStore = create<PlotStore>((set) => ({
  isDragging: false,
  selectedInclusionId: null,
  currentInclusionType: 'crystal',
  showSectorHints: true,
  showPhotoOverlay: false,
  ripple: null,

  setDragging: (v) => set({ isDragging: v }),
  setSelectedInclusion: (id) => set({ selectedInclusionId: id }),
  setCurrentInclusionType: (t) => set({ currentInclusionType: t }),
  toggleSectorHints: () => set(s => ({ showSectorHints: !s.showSectorHints })),
  togglePhotoOverlay: () => set(s => ({ showPhotoOverlay: !s.showPhotoOverlay })),
  triggerRipple: (x, y) => set({ ripple: { x, y, id: Date.now() } }),
  clearRipple: () => set({ ripple: null }),
}));

export { getSectorFromCoords, calculateProgress };
