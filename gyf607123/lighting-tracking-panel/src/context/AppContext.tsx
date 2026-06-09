import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  AppState,
  CircuitRecord,
  StickerRecord,
  ExportRecord,
  ThresholdConfig,
  ComparisonResult,
} from '../types';
import {
  mockCircuitRecords,
  mockProblemRecords,
  mockStickerRecords,
  mockManualStickers,
  mockExportRecords,
  defaultThresholds,
} from '../data/mockData';
import { validateHandwrittenImport } from '../utils/validation';

type Action =
  | { type: 'IMPORT_HANDWRITTEN'; payload: Partial<CircuitRecord>[] }
  | { type: 'FIX_PROBLEM'; payload: { recordId: string; fixedRecord: CircuitRecord } }
  | { type: 'ADD_MANUAL_STICKER'; payload: StickerRecord }
  | { type: 'UPDATE_STICKER'; payload: StickerRecord }
  | { type: 'APPLY_STICKER_TO_RECORD'; payload: { stickerId: string; recordId: string } }
  | { type: 'SET_FILTERS'; payload: Partial<AppState['filters']> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'EXPORT_DATA'; payload: { type: 'sticker' | 'handwritten' | 'all'; cardValue: number } }
  | { type: 'IMPORT_STICKERS'; payload: StickerRecord[] }
  | { type: 'SET_THRESHOLDS'; payload: Partial<ThresholdConfig> }
  | { type: 'LOAD_DEMO_DATA' }
  | { type: 'CLEAR_ALL_DATA' };

const initialState: AppState = {
  circuitRecords: [],
  problemRecords: [],
  stickerRecords: [],
  manualStickers: [],
  exportRecords: [],
  hasImported: false,
  filters: {},
  thresholds: defaultThresholds,
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOAD_DEMO_DATA':
      return {
        ...state,
        circuitRecords: mockCircuitRecords,
        problemRecords: mockProblemRecords,
        stickerRecords: mockStickerRecords,
        manualStickers: mockManualStickers,
        exportRecords: mockExportRecords,
        hasImported: true,
      };

    case 'IMPORT_HANDWRITTEN': {
      const { validRecords, problemRecords } = validateHandwrittenImport(
        action.payload,
        state.thresholds
      );
      const validWithSource = validRecords.map(r => ({ ...r, source: 'handwritten' as const }));
      return {
        ...state,
        circuitRecords: [...state.circuitRecords, ...validWithSource],
        problemRecords: [...state.problemRecords, ...problemRecords],
        hasImported: true,
      };
    }

    case 'FIX_PROBLEM': {
      const { recordId, fixedRecord } = action.payload;
      const problemIndex = state.problemRecords.findIndex(p => p.id === recordId);
      if (problemIndex === -1) return state;

      const newProblemRecords = [...state.problemRecords];
      newProblemRecords.splice(problemIndex, 1);

      const fixedWithSource: CircuitRecord = {
        ...fixedRecord,
        source: fixedRecord.source || 'manual',
        manualEdited: true,
        editedBy: '值班员',
        editedAt: new Date().toISOString(),
      };

      return {
        ...state,
        problemRecords: newProblemRecords,
        circuitRecords: [...state.circuitRecords, fixedWithSource],
      };
    }

    case 'ADD_MANUAL_STICKER': {
      return {
        ...state,
        manualStickers: [...state.manualStickers, action.payload],
      };
    }

    case 'UPDATE_STICKER': {
      const updated = state.manualStickers.map(s =>
        s.id === action.payload.id ? action.payload : s
      );
      return {
        ...state,
        manualStickers: updated,
      };
    }

    case 'APPLY_STICKER_TO_RECORD': {
      const { stickerId, recordId } = action.payload;
      const sticker = state.manualStickers.find(s => s.id === stickerId);
      if (!sticker) return state;

      const recordIndex = state.circuitRecords.findIndex(r => r.id === recordId);
      if (recordIndex === -1) return state;

      const originalRecord = state.circuitRecords[recordIndex];
      const updatedRecord: CircuitRecord = {
        ...originalRecord,
        circuitName: sticker.circuitName,
        circuitCode: sticker.circuitCode,
        location: sticker.location,
        originalValues: {
          circuitName: originalRecord.circuitName,
          circuitCode: originalRecord.circuitCode,
          location: originalRecord.location,
        },
        manualEdited: true,
        editedBy: sticker.operator,
        editedAt: new Date().toISOString(),
        source: 'manual',
      };

      const newCircuitRecords = [...state.circuitRecords];
      newCircuitRecords[recordIndex] = updatedRecord;

      return {
        ...state,
        circuitRecords: newCircuitRecords,
      };
    }

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {},
      };

    case 'EXPORT_DATA': {
      const { type, cardValue } = action.payload;
      let recordsToExport: CircuitRecord[] = [];

      if (type === 'sticker') {
        recordsToExport = state.circuitRecords.filter(r => r.source === 'sticker');
      } else if (type === 'handwritten') {
        recordsToExport = state.circuitRecords.filter(r => r.source === 'handwritten');
      } else {
        recordsToExport = state.circuitRecords;
      }

      const exportedValue = recordsToExport.length;
      const newExportRecord: ExportRecord = {
        id: `EXP-${Date.now()}`,
        exportTime: new Date().toLocaleString('zh-CN'),
        exportType: type,
        cardValue,
        exportedValue,
        matched: cardValue === exportedValue,
        originalRecords: JSON.parse(JSON.stringify(recordsToExport)),
      };

      return {
        ...state,
        exportRecords: [...state.exportRecords, newExportRecord],
      };
    }

    case 'IMPORT_STICKERS': {
      return {
        ...state,
        stickerRecords: [...state.stickerRecords, ...action.payload],
        hasImported: true,
      };
    }

    case 'SET_THRESHOLDS':
      return {
        ...state,
        thresholds: { ...state.thresholds, ...action.payload },
      };

    case 'CLEAR_ALL_DATA':
      return initialState;

    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  getStatistics: () => {
    totalRecords: number;
    normalCount: number;
    faultCount: number;
    pendingCount: number;
    problemCount: number;
    totalPower: number;
    avgIllumination: number;
    passRate: number;
  };
  getFilteredRecords: () => CircuitRecord[];
  getComparison: (recordId: string) => ComparisonResult[];
  getEmptyStateType: () => 'no-import' | 'filter-too-narrow' | 'all-bad' | 'none';
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const getStatistics = () => {
    const { circuitRecords, problemRecords } = state;
    const normalCount = circuitRecords.filter(r => r.status === 'normal').length;
    const faultCount = circuitRecords.filter(r => r.status === 'fault').length;
    const pendingCount = circuitRecords.filter(r => r.status === 'pending').length;
    const problemCount = problemRecords.length;
    const totalRecords = circuitRecords.length;
    const totalPower = circuitRecords.reduce((sum, r) => sum + r.power, 0);
    const avgIllumination =
      circuitRecords.length > 0
        ? Math.round(circuitRecords.reduce((sum, r) => sum + r.illumination, 0) / circuitRecords.length)
        : 0;
    const passRate =
      totalRecords + problemCount > 0
        ? Math.round((normalCount / (totalRecords + problemCount)) * 100)
        : 0;

    return {
      totalRecords,
      normalCount,
      faultCount,
      pendingCount,
      problemCount,
      totalPower,
      avgIllumination,
      passRate,
    };
  };

  const getFilteredRecords = () => {
    const { circuitRecords, filters } = state;
    return circuitRecords.filter(record => {
      if (filters.status && record.status !== filters.status) return false;
      if (filters.location && !record.location.includes(filters.location)) return false;
      if (filters.searchText) {
        const search = filters.searchText.toLowerCase();
        if (
          !record.circuitName.toLowerCase().includes(search) &&
          !record.circuitCode.toLowerCase().includes(search) &&
          !record.location.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (filters.dateRange) {
        const recordDate = new Date(record.inspectionDate);
        const startDate = new Date(filters.dateRange[0]);
        const endDate = new Date(filters.dateRange[1]);
        if (recordDate < startDate || recordDate > endDate) return false;
      }
      return true;
    });
  };

  const getComparison = (recordId: string): ComparisonResult[] => {
    const record = state.circuitRecords.find(r => r.id === recordId);
    if (!record || !record.originalValues) return [];

    const fieldLabels: Record<string, string> = {
      circuitName: '回路名称',
      circuitCode: '回路编号',
      location: '位置',
      voltage: '电压',
      current: '电流',
      power: '功率',
      illumination: '照度',
      status: '状态',
    };

    const results: ComparisonResult[] = [];
    Object.entries(record.originalValues).forEach(([field, before]) => {
      const after = record[field as keyof CircuitRecord];
      if (before !== undefined && after !== undefined) {
        if (typeof before === 'string' || typeof before === 'number') {
          results.push({
            field: fieldLabels[field] || field,
            before: before as string | number,
            after: after as string | number,
            changed: before !== after,
          });
        }
      }
    });

    return results;
  };

  const getEmptyStateType = (): 'no-import' | 'filter-too-narrow' | 'all-bad' | 'none' => {
    const { hasImported, circuitRecords, problemRecords, filters } = state;

    if (!hasImported) return 'no-import';

    const hasFilters = Object.keys(filters).length > 0;
    const filteredCount = getFilteredRecords().length;

    if (hasFilters && filteredCount === 0 && circuitRecords.length > 0) {
      return 'filter-too-narrow';
    }

    if (circuitRecords.length === 0 && problemRecords.length > 0) {
      return 'all-bad';
    }

    return 'none';
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        getStatistics,
        getFilteredRecords,
        getComparison,
        getEmptyStateType,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
