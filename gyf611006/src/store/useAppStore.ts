import { create } from 'zustand';
import type {
  AppMode,
  DiamondMeasure,
  WindData,
  LeakSource,
  HistoryRecord,
  CorrectedDistances,
  ValidationResult,
  SmsPushStatus,
} from '../types';
import { createInitialDiamond, calculateDiamondDistances } from '../utils/distance';
import { createInitialWindData, calculateCorrectedDistances } from '../utils/wind';
import { validateSubmission } from '../utils/validation';
import { mockHistoryRecords } from '../data/history';

interface AppState {
  mode: AppMode;
  diamond: DiamondMeasure;
  wind: WindData;
  hasWindReading: boolean;
  leakSource: LeakSource;
  historyRecords: HistoryRecord[];
  selectedHistoryId: string | null;
  showHistoryOverlay: boolean;
  smsStatus: SmsPushStatus;

  setMode: (mode: AppMode) => void;
  setDiamondVertex: (direction: 'north' | 'south' | 'east' | 'west', x: number, y: number) => void;
  setWindAngle: (angle: number) => void;
  setWindSpeed: (speed: number) => void;
  setHasWindReading: (value: boolean) => void;
  setLeakSourcePoint: (x: number, y: number) => void;
  setLeakSourcePhoto: (url: string, name: string) => void;
  clearLeakSource: () => void;
  getValidationResult: () => ValidationResult;
  getCorrectedDistances: () => CorrectedDistances;
  submitRecord: () => HistoryRecord | null;
  toggleHistoryOverlay: () => void;
  setSelectedHistoryId: (id: string | null) => void;
  pushSms: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'drill',
  diamond: createInitialDiamond(300, 300),
  wind: createInitialWindData(),
  hasWindReading: false,
  leakSource: {
    point: null,
    photoUrl: null,
    photoName: null,
  },
  historyRecords: mockHistoryRecords,
  selectedHistoryId: null,
  showHistoryOverlay: false,
  smsStatus: {
    isPushing: false,
    lastPushTime: null,
    pushedCount: 0,
    totalCount: 0,
  },

  setMode: (mode) => set({ mode }),

  setDiamondVertex: (direction, x, y) => {
    set((state) => {
      const newDiamond = { ...state.diamond };
      newDiamond[direction] = { ...newDiamond[direction], x, y };
      newDiamond.distances = calculateDiamondDistances(
        newDiamond.center,
        newDiamond.north,
        newDiamond.south,
        newDiamond.east,
        newDiamond.west
      );
      return { diamond: newDiamond };
    });
  },

  setWindAngle: (angle) => set((state) => ({
    wind: { ...state.wind, angle },
  })),

  setWindSpeed: (speed) => set((state) => ({
    wind: { ...state.wind, speed },
  })),

  setHasWindReading: (value) => set({ hasWindReading: value }),

  setLeakSourcePoint: (x, y) => set((state) => ({
    leakSource: { ...state.leakSource, point: { x, y } },
  })),

  setLeakSourcePhoto: (url, name) => set((state) => ({
    leakSource: { ...state.leakSource, photoUrl: url, photoName: name },
  })),

  clearLeakSource: () => set({
    leakSource: { point: null, photoUrl: null, photoName: null },
  }),

  getValidationResult: () => {
    const state = get();
    const corrected = calculateCorrectedDistances(state.diamond.distances, state.wind);
    return validateSubmission(
      state.mode,
      corrected,
      state.wind,
      state.hasWindReading,
      state.leakSource
    );
  },

  getCorrectedDistances: () => {
    const state = get();
    return calculateCorrectedDistances(state.diamond.distances, state.wind);
  },

  submitRecord: () => {
    const state = get();
    const validation = state.getValidationResult();
    
    if (!validation.isValid) return null;

    const corrected = state.getCorrectedDistances();
    const newRecord: HistoryRecord = {
      id: `record-${Date.now()}`,
      timestamp: Date.now(),
      mode: state.mode,
      location: '化工园区A区-3号储罐',
      leakSource: state.leakSource.point || { x: 300, y: 300 },
      diamond: state.diamond,
      wind: state.wind,
      correctedDistances: corrected,
      isCompliant: true,
      photoUrl: state.leakSource.photoUrl || undefined,
    };

    set((prevState) => ({
      historyRecords: [newRecord, ...prevState.historyRecords],
    }));

    return newRecord;
  },

  toggleHistoryOverlay: () => set((state) => ({
    showHistoryOverlay: !state.showHistoryOverlay,
  })),

  setSelectedHistoryId: (id) => set({ selectedHistoryId: id }),

  pushSms: async () => {
    set((state) => ({
      smsStatus: {
        ...state.smsStatus,
        isPushing: true,
        pushedCount: 0,
        totalCount: 5,
      },
    }));

    for (let i = 1; i <= 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      set((state) => ({
        smsStatus: {
          ...state.smsStatus,
          pushedCount: i,
        },
      }));
    }

    set((state) => ({
      smsStatus: {
        ...state.smsStatus,
        isPushing: false,
        lastPushTime: Date.now(),
      },
    }));
  },
}));
