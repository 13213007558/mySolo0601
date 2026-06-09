import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  StoreType,
  MeterRecord,
  ProblemRecord,
  MultiplierConfig,
  OperatorName,
  LogAction,
  ParseResult,
} from '@/types';
import { parseFile, revalidateRecord } from '@/utils/parser';
import {
  generateReviewSummary,
  generateMarkdownReport,
  exportFullDataToExcel,
} from '@/utils/report';

const STORAGE_KEY = 'meter_review_app_state_v1';
const LOGS_STORAGE_KEY = 'meter_review_logs_v1';

const INITIAL_MULTIPLIERS: MultiplierConfig[] = [
  {
    id: 'mult_001',
    meterNo: '20240001',
    multiplier: 40,
    effectiveDate: new Date('2026-01-01'),
    enteredBy: 'zhou',
    note: '老周手工补录：1#主变分表，CT变比40/5',
    createdAt: new Date('2026-06-01'),
    version: 1,
  },
  {
    id: 'mult_002',
    meterNo: '20240002',
    multiplier: 60,
    effectiveDate: new Date('2026-01-01'),
    enteredBy: 'zhou',
    note: '老周手工补录：2#主变分表，CT变比60/5',
    createdAt: new Date('2026-06-01'),
    version: 1,
  },
  {
    id: 'mult_003',
    meterNo: '20240015',
    multiplier: 80,
    effectiveDate: new Date('2026-03-15'),
    enteredBy: 'zhou',
    note: '老周手工补录：光伏阵列A区总表，3月15日起启用新倍率',
    createdAt: new Date('2026-06-05'),
    version: 2,
  },
];

function deserializeState(serialized: string): Partial<StoreType> | null {
  try {
    const parsed = JSON.parse(serialized);
    return {
      ...parsed,
      normalRecords: parsed.normalRecords?.map((r: MeterRecord) => ({
        ...r,
        readingTime: new Date(r.readingTime),
        importedAt: new Date(r.importedAt),
      })) || [],
      problemRecords: parsed.problemRecords?.map((r: ProblemRecord) => ({
        ...r,
        readingTime: new Date(r.readingTime),
        importedAt: new Date(r.importedAt),
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : undefined,
      })) || [],
      multipliers: parsed.multipliers?.map((m: MultiplierConfig) => ({
        ...m,
        effectiveDate: new Date(m.effectiveDate),
        expiryDate: m.expiryDate ? new Date(m.expiryDate) : undefined,
        createdAt: new Date(m.createdAt),
      })) || [],
      operationLogs: parsed.operationLogs?.map((l: { timestamp: string | Date }) => ({
        ...l,
        timestamp: new Date(l.timestamp),
      })) || [],
      lastSavedAt: parsed.lastSavedAt ? new Date(parsed.lastSavedAt) : null,
    };
  } catch {
    return null;
  }
}

function serializeState(state: Partial<StoreType>): string {
  return JSON.stringify(state);
}

export const useMeterStore = create<StoreType>((set, get) => ({
  normalRecords: [],
  problemRecords: [],
  multipliers: INITIAL_MULTIPLIERS,
  operationLogs: [],
  currentOperator: '张调度',
  lastSavedAt: null,
  lastRefreshReason: null,
  isLoading: false,

  addLog: (action: LogAction, description: string, reason?: string, metadata?: Record<string, unknown>) => {
    const { currentOperator, operationLogs } = get();
    const newLog = {
      id: nanoid(12),
      timestamp: new Date(),
      operator: currentOperator,
      action,
      description,
      reason,
      metadata,
    };
    set({ operationLogs: [newLog, ...operationLogs].slice(0, 500) });
    get().saveState();
  },

  importRecords: async (file: File): Promise<ParseResult> => {
    const { currentOperator, addLog } = get();
    set({ isLoading: true });

    try {
      const result = await parseFile(file, currentOperator);

      set((state) => ({
        normalRecords: [...state.normalRecords, ...result.normalRecords],
        problemRecords: [...state.problemRecords, ...result.problemRecords],
        isLoading: false,
      }));

      addLog(
        'import',
        `导入文件 ${file.name}，共 ${result.totalCount} 条记录`,
        undefined,
        {
          fileName: file.name,
          fileSize: file.size,
          ...result,
        }
      );

      get().saveState();
      return result;
    } catch (error) {
      set({ isLoading: false });
      addLog('import', `导入失败: ${(error as Error).message}`, (error as Error).message);
      throw error;
    }
  },

  resolveProblem: (recordId: string, updates: Partial<MeterRecord>, note?: string) => {
    const { problemRecords, normalRecords, currentOperator, addLog } = get();
    const record = problemRecords.find((r) => r.id === recordId);

    if (!record) return;

    const validation = revalidateRecord(record, updates);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage || '数据校验失败');
    }

    const updatedRecord: MeterRecord = {
      ...record,
      ...updates,
      calculatedValue: (updates.reading ?? record.reading) * (updates.multiplier ?? record.multiplier),
      operator: currentOperator,
    };

    set((state) => ({
      problemRecords: state.problemRecords.filter((r) => r.id !== recordId),
      normalRecords: [...state.normalRecords, updatedRecord],
    }));

    addLog(
      'resolve',
      `解决问题记录 ${record.meterNo}，${note || '已修正数据'}`,
      note,
      { recordId, updates }
    );

    get().saveState();
  },

  rejectProblem: (recordId: string, reason: string) => {
    const { problemRecords, currentOperator, addLog } = get();

    set((state) => ({
      problemRecords: state.problemRecords.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'rejected',
              reviewedBy: currentOperator,
              reviewedAt: new Date(),
              supplementNote: reason,
            }
          : r
      ),
    }));

    const record = problemRecords.find((r) => r.id === recordId);
    addLog(
      'resolve',
      `驳回问题记录 ${record?.meterNo}`,
      reason,
      { recordId }
    );

    get().saveState();
  },

  supplementRecord: (recordId: string, updates: Partial<MeterRecord>, reason: string) => {
    const { problemRecords, normalRecords, currentOperator, addLog } = get();
    const record = problemRecords.find((r) => r.id === recordId);

    if (!record) return;

    const validation = revalidateRecord(record, updates);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage || '数据校验失败');
    }

    const updatedRecord: MeterRecord = {
      ...record,
      ...updates,
      calculatedValue: (updates.reading ?? record.reading) * (updates.multiplier ?? record.multiplier),
      operator: currentOperator,
      source: 'manual',
    };

    set((state) => ({
      problemRecords: state.problemRecords.filter((r) => r.id !== recordId),
      normalRecords: [...state.normalRecords, updatedRecord],
    }));

    addLog(
      'supplement',
      `补录记录 ${record.meterNo}`,
      reason,
      { recordId, updates }
    );

    get().saveState();
  },

  updateMultiplier: (config: Omit<MultiplierConfig, 'id' | 'createdAt' | 'version'>) => {
    const { multipliers, normalRecords, addLog } = get();

    const existingVersions = multipliers.filter((m) => m.meterNo === config.meterNo);
    const newVersion = existingVersions.length > 0
      ? Math.max(...existingVersions.map((m) => m.version)) + 1
      : 1;

    const newMultiplier: MultiplierConfig = {
      ...config,
      id: nanoid(12),
      createdAt: new Date(),
      version: newVersion,
    };

    set((state) => ({
      multipliers: [...state.multipliers, newMultiplier],
      normalRecords: state.normalRecords.map((r) => {
        if (r.meterNo === config.meterNo && r.readingTime >= config.effectiveDate) {
          return {
            ...r,
            multiplier: config.multiplier,
            calculatedValue: r.reading * config.multiplier,
          };
        }
        return r;
      }),
    }));

    addLog(
      'multiplier_update',
      `更新电表 ${config.meterNo} 倍率为 ${config.multiplier}`,
      config.note,
      { meterNo: config.meterNo, multiplier: config.multiplier, version: newVersion }
    );

    get().saveState();
  },

  setOperator: (operator: OperatorName) => {
    const { currentOperator, addLog } = get();
    if (operator !== currentOperator) {
      set({ currentOperator: operator });
      addLog('operator_change', `切换操作人为 ${operator}`);
      get().saveState();
    }
  },

  generateSummary: () => {
    const { normalRecords, problemRecords, multipliers, currentOperator } = get();
    return generateReviewSummary(
      normalRecords,
      problemRecords,
      multipliers,
      currentOperator
    );
  },

  exportSummary: () => {
    const summary = get().generateSummary();
    const markdown = generateMarkdownReport(summary);
    get().addLog('export', '导出复核摘要', undefined, { recordCount: summary.statistics.totalRecords });
    return markdown;
  },

  exportExcel: () => {
    const { normalRecords, problemRecords, multipliers } = get();
    exportFullDataToExcel(normalRecords, problemRecords, multipliers);
    get().addLog('export', '导出完整Excel数据', undefined, {
      normalCount: normalRecords.length,
      problemCount: problemRecords.length,
      multiplierCount: multipliers.length,
    });
  },

  saveState: () => {
    const state = get();
    const stateToSave = {
      normalRecords: state.normalRecords,
      problemRecords: state.problemRecords,
      multipliers: state.multipliers,
      operationLogs: state.operationLogs,
      currentOperator: state.currentOperator,
      lastSavedAt: new Date(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, serializeState(stateToSave));
      localStorage.setItem(LOGS_STORAGE_KEY, serializeState({ operationLogs: state.operationLogs }));
      set({ lastSavedAt: new Date() });
    } catch (error) {
      console.error('保存状态失败:', error);
    }
  },

  loadState: (): boolean => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (!savedState) {
        set({ lastRefreshReason: '首次访问，无历史数据' });
        return false;
      }

      const deserialized = deserializeState(savedState);
      if (!deserialized) {
        set({ lastRefreshReason: '历史数据格式损坏，已重置' });
        get().addLog('status_lost', '状态加载失败，历史数据格式损坏', '历史数据格式损坏');
        return false;
      }

      set((state) => ({
        ...state,
        normalRecords: deserialized.normalRecords || [],
        problemRecords: deserialized.problemRecords || [],
        multipliers: deserialized.multipliers?.length > 0 ? deserialized.multipliers : INITIAL_MULTIPLIERS,
        operationLogs: deserialized.operationLogs || [],
        currentOperator: deserialized.currentOperator || '张调度',
        lastSavedAt: deserialized.lastSavedAt || null,
      }));

      const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
      if (savedLogs) {
        const deserializedLogs = deserializeState(savedLogs);
        if (deserializedLogs?.operationLogs) {
          set({ operationLogs: deserializedLogs.operationLogs });
        }
      }

      return true;
    } catch (error) {
      set({ lastRefreshReason: `状态加载异常: ${(error as Error).message}` });
      get().addLog('status_lost', '状态加载异常', (error as Error).message);
      return false;
    }
  },

  clearState: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LOGS_STORAGE_KEY);
    set({
      normalRecords: [],
      problemRecords: [],
      multipliers: INITIAL_MULTIPLIERS,
      operationLogs: [],
      lastSavedAt: null,
      lastRefreshReason: '已手动清空数据',
    });
    get().addLog('refresh', '清空所有数据');
  },
}));

export function useStatistics() {
  return useMeterStore((state) => ({
    total: state.normalRecords.length + state.problemRecords.length,
    normal: state.normalRecords.length,
    problem: state.problemRecords.length,
    pending: state.problemRecords.filter((r) => r.status === 'pending').length,
    totalReading: state.normalRecords.reduce((sum, r) => sum + r.calculatedValue, 0),
  }));
}

export function useMultiplierForMeter(meterNo: string): number {
  return useMeterStore((state) => {
    const configs = state.multipliers
      .filter((m) => m.meterNo === meterNo)
      .sort((a, b) => b.version - a.version);
    return configs[0]?.multiplier || 1;
  });
}
