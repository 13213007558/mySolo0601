import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BracketRecord,
  ProblemRecord,
  ManualAngleRecord,
  FilterParams,
  PageStatus,
  ImportResult,
  ExportConfig,
} from '@/types';
import { validateRecord, parseCSV, generateId, generateVersion } from '@/utils/dataValidator';
import { calculateAngleDiff } from '@/utils/diff';
import { mockNormalRecords, mockProblemRecords, mockManualRecords } from '@/utils/mockData';

interface BracketState {
  normalRecords: BracketRecord[];
  problemRecords: ProblemRecord[];
  manualRecords: ManualAngleRecord[];
  pageStatus: PageStatus;
  filterParams: FilterParams;
  selectedRecordId: string | null;
  isProblemPanelCollapsed: boolean;
  lastImportTime: number | null;
  hasBackup: boolean;
  highlightedRecordId: string | null;

  importRecords: (file: File) => Promise<ImportResult>;
  resolveProblem: (id: string, note: string) => void;
  addManualRecord: (record: Omit<ManualAngleRecord, 'id' | 'difference'>) => void;
  updateFilterParams: (params: Partial<FilterParams>) => void;
  syncFilterToURL: () => void;
  loadFromURLParams: () => void;
  exportData: (config: ExportConfig) => void;
  checkStateIntegrity: () => boolean;
  restoreFromBackup: () => void;
  updatePageStatus: () => void;
  loadMockData: () => void;
  clearAllData: () => void;
  setHighlightedRecord: (id: string | null) => void;
  toggleProblemPanel: () => void;
  simulateStateLoss: () => void;
  simulateOnlyProblemImport: () => void;
}

const initialFilterParams: FilterParams = {
  page: 1,
  pageSize: 10,
  sortBy: 'processDate',
  sortOrder: 'desc',
};

const detectPageStatus = (
  normalCount: number,
  problemCount: number,
  manualCount: number,
  lastImportTime: number | null,
  isNewImport: boolean
): PageStatus => {
  if (normalCount === 0 && problemCount === 0 && manualCount === 0) {
    return 'empty';
  }
  if (normalCount === 0 && problemCount > 0 && isNewImport) {
    return 'only_problem';
  }
  if (normalCount === 0 && problemCount > 0) {
    return 'all_problem';
  }
  return 'normal';
};

export const useBracketStore = create<BracketState>()(
  persist(
    (set, get) => ({
      normalRecords: [],
      problemRecords: [],
      manualRecords: [],
      pageStatus: 'empty',
      filterParams: initialFilterParams,
      selectedRecordId: null,
      isProblemPanelCollapsed: false,
      lastImportTime: null,
      hasBackup: false,
      highlightedRecordId: null,

      importRecords: async (file: File): Promise<ImportResult> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            const parsedRecords = parseCSV(content);

            const newNormalRecords: BracketRecord[] = [];
            const newProblemRecords: ProblemRecord[] = [];
            const now = new Date().toISOString();

            parsedRecords.forEach((partial, index) => {
              const validation = validateRecord(partial);
              const baseRecord: BracketRecord = {
                id: generateId(),
                bracketNo: partial.bracketNo || `IMPORT-${index + 1}`,
                installDate: partial.installDate || '',
                location: partial.location || '',
                currentAngle: partial.currentAngle || 0,
                targetAngle: partial.targetAngle || 45,
                handler: partial.handler || '',
                processDate: partial.processDate || '',
                status: partial.status || 'pending',
                version: partial.version || 'v1.0',
                remark: partial.remark || '',
                createdAt: now,
                updatedAt: now,
              };

              if (validation.isValid) {
                newNormalRecords.push(baseRecord);
              } else {
                newProblemRecords.push({
                  ...baseRecord,
                  status: 'problem',
                  errorType: validation.errorType || 'format_error',
                  errorDetail: validation.errors.join('; '),
                  isResolved: false,
                  resolveNote: '',
                });
              }
            });

            const isNewImport = true;
            const newStatus = detectPageStatus(
              newNormalRecords.length,
              newProblemRecords.length,
              get().manualRecords.length,
              Date.now(),
              isNewImport
            );

            set((state) => ({
              normalRecords: [...state.normalRecords, ...newNormalRecords],
              problemRecords: [...state.problemRecords, ...newProblemRecords],
              lastImportTime: Date.now(),
              pageStatus: newStatus,
              hasBackup: true,
            }));

            resolve({
              success: true,
              normalCount: newNormalRecords.length,
              problemCount: newProblemRecords.length,
              totalCount: parsedRecords.length,
              message: `导入完成：${newNormalRecords.length}条正常，${newProblemRecords.length}条问题`,
            });
          };
          reader.readAsText(file);
        });
      },

      resolveProblem: (id: string, note: string) => {
        set((state) => {
          const problemRecord = state.problemRecords.find((r) => r.id === id);
          if (!problemRecord) return state;

          const now = new Date().toISOString();
          const resolvedRecord: BracketRecord = {
            ...problemRecord,
            status: 'processed',
            version: generateVersion(problemRecord.version),
            remark: note || problemRecord.remark,
            updatedAt: now,
          };

          const updatedProblems = state.problemRecords.map((r) =>
            r.id === id ? { ...r, isResolved: true, resolveNote: note, updatedAt: now } : r
          );

          const newStatus = detectPageStatus(
            state.normalRecords.length + 1,
            updatedProblems.filter((r) => !r.isResolved).length,
            state.manualRecords.length,
            state.lastImportTime,
            false
          );

          return {
            normalRecords: [...state.normalRecords, resolvedRecord],
            problemRecords: updatedProblems,
            pageStatus: newStatus,
          };
        });
      },

      addManualRecord: (record) => {
        const { difference } = calculateAngleDiff(record.originalAngle, record.correctedAngle);
        const newRecord: ManualAngleRecord = {
          ...record,
          id: generateId(),
          difference,
        };

        set((state) => ({
          manualRecords: [...state.manualRecords, newRecord],
        }));

        set((state) => {
          const updatedNormalRecords = state.normalRecords.map((r) =>
            r.bracketNo === record.bracketNo
              ? {
                  ...r,
                  currentAngle: record.correctedAngle,
                  status: 'manual' as const,
                  version: generateVersion(r.version),
                  remark: `${r.remark} | 手工补录：${record.reason}`,
                  updatedAt: new Date().toISOString(),
                }
              : r
          );
          return { normalRecords: updatedNormalRecords };
        });
      },

      updateFilterParams: (params) => {
        set((state) => ({
          filterParams: { ...state.filterParams, ...params },
        }));
        get().syncFilterToURL();
      },

      syncFilterToURL: () => {
        const { filterParams, highlightedRecordId } = get();
        const params = new URLSearchParams();

        if (filterParams.bracketId) params.set('bracketId', filterParams.bracketId);
        if (filterParams.status) params.set('status', filterParams.status);
        if (filterParams.dateFrom) params.set('dateFrom', filterParams.dateFrom);
        if (filterParams.dateTo) params.set('dateTo', filterParams.dateTo);
        if (filterParams.handler) params.set('handler', filterParams.handler);
        if (filterParams.sortBy) params.set('sortBy', filterParams.sortBy);
        if (filterParams.sortOrder) params.set('sortOrder', filterParams.sortOrder);
        if (highlightedRecordId) params.set('highlight', highlightedRecordId);

        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
      },

      loadFromURLParams: () => {
        const params = new URLSearchParams(window.location.search);
        const newFilterParams: Partial<FilterParams> = {};

        if (params.get('bracketId')) newFilterParams.bracketId = params.get('bracketId') || undefined;
        if (params.get('status')) newFilterParams.status = params.get('status') || undefined;
        if (params.get('dateFrom')) newFilterParams.dateFrom = params.get('dateFrom') || undefined;
        if (params.get('dateTo')) newFilterParams.dateTo = params.get('dateTo') || undefined;
        if (params.get('handler')) newFilterParams.handler = params.get('handler') || undefined;
        if (params.get('sortBy')) newFilterParams.sortBy = params.get('sortBy') || undefined;
        if (params.get('sortOrder')) newFilterParams.sortOrder = (params.get('sortOrder') as 'asc' | 'desc') || undefined;

        const highlight = params.get('highlight');

        set((state) => ({
          filterParams: { ...state.filterParams, ...newFilterParams },
          highlightedRecordId: highlight,
        }));
      },

      exportData: (config) => {
        const { normalRecords, problemRecords, manualRecords } = get();
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `能源跟踪支架对账_${timestamp}`;

        if (config.format === 'csv') {
          import('@/utils/export').then(({ exportToCSV }) => {
            exportToCSV(
              config.includeNormal ? normalRecords : [],
              config.includeProblem ? problemRecords : [],
              config.includeManual ? manualRecords : [],
              filename
            );
          });
        } else {
          import('@/utils/export').then(({ exportToMarkdown }) => {
            exportToMarkdown(
              config.includeNormal ? normalRecords : [],
              config.includeProblem ? problemRecords : [],
              config.includeManual ? manualRecords : [],
              config.filterParams,
              filename
            );
          });
        }
      },

      checkStateIntegrity: () => {
        const { normalRecords, problemRecords, manualRecords, hasBackup } = get();
        const params = new URLSearchParams(window.location.search);
        const hasURLParams = params.toString().length > 0;

        if (hasURLParams && normalRecords.length === 0 && problemRecords.length === 0 && hasBackup) {
          set({ pageStatus: 'state_lost' });
          return false;
        }
        return true;
      },

      restoreFromBackup: () => {
        set({
          pageStatus: 'normal',
        });
        get().loadMockData();
      },

      updatePageStatus: () => {
        const { normalRecords, problemRecords, manualRecords, lastImportTime } = get();
        const activeProblems = problemRecords.filter((r) => !r.isResolved);
        const newStatus = detectPageStatus(
          normalRecords.length,
          activeProblems.length,
          manualRecords.length,
          lastImportTime,
          false
        );
        set({ pageStatus: newStatus });
      },

      loadMockData: () => {
        set({
          normalRecords: mockNormalRecords,
          problemRecords: mockProblemRecords,
          manualRecords: mockManualRecords,
          pageStatus: 'normal',
          hasBackup: true,
        });
      },

      clearAllData: () => {
        set({
          normalRecords: [],
          problemRecords: [],
          manualRecords: [],
          pageStatus: 'empty',
          filterParams: initialFilterParams,
          selectedRecordId: null,
          lastImportTime: null,
          highlightedRecordId: null,
        });
      },

      setHighlightedRecord: (id) => {
        set({ highlightedRecordId: id });
        get().syncFilterToURL();
      },

      toggleProblemPanel: () => {
        set((state) => ({
          isProblemPanelCollapsed: !state.isProblemPanelCollapsed,
        }));
      },

      simulateStateLoss: () => {
        set({
          normalRecords: [],
          problemRecords: [],
          manualRecords: [],
          pageStatus: 'state_lost',
        });
      },

      simulateOnlyProblemImport: () => {
        const onlyProblems = mockProblemRecords.slice(0, 2);
        set({
          normalRecords: [],
          problemRecords: onlyProblems,
          manualRecords: [],
          pageStatus: 'only_problem',
          lastImportTime: Date.now(),
        });
      },
    }),
    {
      name: 'bracket-reconciliation-store',
      partialize: (state) => ({
        normalRecords: state.normalRecords,
        problemRecords: state.problemRecords,
        manualRecords: state.manualRecords,
        filterParams: state.filterParams,
        hasBackup: state.hasBackup,
      }),
    }
  )
);
