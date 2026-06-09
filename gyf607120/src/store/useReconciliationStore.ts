import { create } from 'zustand';
import type {
  PaymentFlow,
  GunInfo,
  RefundRecord,
  DriverQueue,
  SupplementRecord,
  ImportHistory,
  FilterConditions,
  ReconciliationState,
  ImportCheckResult
} from '@/types';
import { normalSample } from '@/data/samples/normal';
import { anomalySample } from '@/data/samples/anomaly';
import { emptySample } from '@/data/samples/empty';
import { checkForDuplicates, generateMockImportData } from '@/utils/importCheck';
import { generateUnappliedReasons } from '@/utils/export';

const initialFilters: FilterConditions = {
  plateNumber: [],
  paymentRemark: '',
  hasRefundMark: null,
  gunNo: [],
  dateRange: null,
  status: []
};

const STORAGE_KEY = 'reconciliation_store';

const loadFromStorage = (): Partial<ReconciliationState> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return null;
};

const saveToStorage = (state: ReconciliationState) => {
  try {
    const toSave = {
      currentSample: state.currentSample,
      paymentFlows: state.paymentFlows,
      supplementRecords: state.supplementRecords,
      importHistories: state.importHistories
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
};

const getInitialState = (): ReconciliationState => {
  const stored = loadFromStorage();
  const sample = stored?.currentSample || 'normal';
  const dataset = sample === 'normal' ? normalSample : 
                  sample === 'anomaly' ? anomalySample : emptySample;
  
  return {
    currentSample: sample,
    paymentFlows: stored?.paymentFlows || dataset.paymentFlows,
    filteredFlows: stored?.paymentFlows || dataset.paymentFlows,
    gunInfos: dataset.gunInfos,
    refundRecords: dataset.refundRecords,
    driverQueues: dataset.driverQueues,
    supplementRecords: stored?.supplementRecords || [],
    importHistories: stored?.importHistories || [],
    filters: initialFilters,
    chartFiltersApplied: true,
    unappliedFilterReasons: [],
    selectedFlowId: null,
    showSupplementDiff: false
  };
};

export const useReconciliationStore = create<ReconciliationState & {
  setSample: (sample: 'normal' | 'anomaly' | 'empty') => void;
  setFilter: <K extends keyof FilterConditions>(key: K, value: FilterConditions[K]) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  syncChartsToFilters: () => void;
  selectFlow: (id: string | null) => void;
  setShowSupplementDiff: (show: boolean) => void;
  addSupplementRecord: (paymentFlowId: string, remark: string, reason: string) => void;
  simulateImport: () => ImportCheckResult;
  confirmImport: (validNew: PaymentFlow[]) => void;
  returnForMaterials: (returned: PaymentFlow[], reasons: string[]) => void;
}>((set, get) => ({
  ...getInitialState(),

  setSample: (sample) => {
    localStorage.removeItem(STORAGE_KEY);
    const dataset = sample === 'normal' ? normalSample :
                    sample === 'anomaly' ? anomalySample : emptySample;
    set({
      currentSample: sample,
      paymentFlows: dataset.paymentFlows,
      filteredFlows: dataset.paymentFlows,
      gunInfos: dataset.gunInfos,
      refundRecords: dataset.refundRecords,
      driverQueues: dataset.driverQueues,
      supplementRecords: [],
      importHistories: [],
      filters: initialFilters,
      chartFiltersApplied: true,
      unappliedFilterReasons: [],
      selectedFlowId: null
    });
  },

  setFilter: (key, value) => {
    const state = get();
    const newFilters = { ...state.filters, [key]: value };
    
    const filtered = state.paymentFlows.filter(flow => {
      if (newFilters.plateNumber.length > 0 && !newFilters.plateNumber.includes(flow.plateNumber)) return false;
      if (newFilters.paymentRemark && !flow.remark.includes(newFilters.paymentRemark)) return false;
      if (newFilters.hasRefundMark !== null && flow.hasRefundMark !== newFilters.hasRefundMark) return false;
      if (newFilters.gunNo.length > 0 && !newFilters.gunNo.includes(flow.gunNo)) return false;
      if (newFilters.status.length > 0 && !newFilters.status.includes(flow.status)) return false;
      if (newFilters.dateRange) {
        const flowDate = new Date(flow.transactionTime);
        const start = new Date(newFilters.dateRange[0]);
        const end = new Date(newFilters.dateRange[1]);
        if (flowDate < start || flowDate > end) return false;
      }
      return true;
    });

    const filterCount = Object.values(newFilters).filter(v => 
      Array.isArray(v) ? v.length > 0 : v !== null && v !== ''
    ).length;

    const unappliedReasons = generateUnappliedReasons(newFilters, filterCount);

    set({
      filters: newFilters,
      filteredFlows: filtered,
      chartFiltersApplied: false,
      unappliedFilterReasons: unappliedReasons
    });
  },

  resetFilters: () => {
    set({
      filters: initialFilters,
      filteredFlows: get().paymentFlows,
      chartFiltersApplied: true,
      unappliedFilterReasons: []
    });
  },

  applyFilters: () => {
    set({
      chartFiltersApplied: true,
      unappliedFilterReasons: []
    });
  },

  syncChartsToFilters: () => {
    set({
      chartFiltersApplied: true,
      unappliedFilterReasons: []
    });
  },

  selectFlow: (id) => {
    set({ selectedFlowId: id });
  },

  setShowSupplementDiff: (show) => {
    set({ showSupplementDiff: show });
  },

  addSupplementRecord: (paymentFlowId, remark, reason) => {
    const state = get();
    const flow = state.paymentFlows.find(f => f.id === paymentFlowId);
    if (!flow) return;

    const existingSupplement = state.supplementRecords.find(
      s => s.paymentFlowId === paymentFlowId
    );

    const beforeRemark = existingSupplement ? existingSupplement.afterRemark : flow.remark;

    const newRecord: SupplementRecord = {
      id: `supp-${Date.now()}`,
      paymentFlowId,
      operatorName: '客服-阿宁',
      beforeRemark,
      afterRemark: remark,
      operateTime: new Date().toISOString(),
      reason
    };

    const updatedFlows = state.paymentFlows.map(f =>
      f.id === paymentFlowId
        ? { ...f, remark, paymentRemarkDate: new Date().toISOString().split('T')[0] }
        : f
    );

    const newState = {
      supplementRecords: [...state.supplementRecords, newRecord],
      paymentFlows: updatedFlows,
      filteredFlows: state.filteredFlows.map(f =>
        f.id === paymentFlowId
          ? { ...f, remark, paymentRemarkDate: new Date().toISOString().split('T')[0] }
          : f
      )
    };

    set(newState);
    saveToStorage({ ...state, ...newState });
  },

  simulateImport: () => {
    const state = get();
    const incomingData = generateMockImportData(state.paymentFlows);
    return checkForDuplicates(incomingData, state.paymentFlows);
  },

  confirmImport: (validNew) => {
    const state = get();
    const history: ImportHistory = {
      id: `import-${Date.now()}`,
      fileName: `快充账单_${new Date().toISOString().split('T')[0]}.xlsx`,
      importTime: new Date().toISOString(),
      operator: '资产台账专员',
      totalRecords: validNew.length,
      duplicateRecords: 0,
      validNewRecords: validNew.length,
      returnedRecords: 0,
      status: 'completed',
      returnedReasons: []
    };

    const newFlows = [...state.paymentFlows, ...validNew];
    const newState = {
      paymentFlows: newFlows,
      filteredFlows: newFlows,
      importHistories: [...state.importHistories, history],
      filters: initialFilters,
      chartFiltersApplied: true,
      unappliedFilterReasons: []
    };

    set(newState);
    saveToStorage({ ...state, ...newState });
  },

  returnForMaterials: (returned, reasons) => {
    const state = get();
    const history: ImportHistory = {
      id: `import-${Date.now()}`,
      fileName: `快充账单_${new Date().toISOString().split('T')[0]}.xlsx`,
      importTime: new Date().toISOString(),
      operator: '资产台账专员',
      totalRecords: returned.length,
      duplicateRecords: 0,
      validNewRecords: 0,
      returnedRecords: returned.length,
      status: 'returned',
      returnedReasons: reasons
    };

    const newState = {
      importHistories: [...state.importHistories, history]
    };

    set(newState);
    saveToStorage({ ...state, ...newState });
  }
}));
