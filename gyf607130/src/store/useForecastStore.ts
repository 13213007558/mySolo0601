import { create } from 'zustand';
import { ForecastRecord, FilterParams, ModalState, ForecastVersion, Remark } from '../types';
import { mockRecords, mockForecastVersions } from '../data/mockData';
import { generateId, calculateDeviation } from '../utils/calculation';

interface ForecastState {
  records: ForecastRecord[];
  versions: ForecastVersion[];
  currentVersionId: string;
  filters: FilterParams;
  modals: ModalState;
  selectedRecordIds: string[];
  chartRecordId: string | null;

  setRecords: (records: ForecastRecord[]) => void;
  addRecord: (record: Partial<ForecastRecord>) => void;
  updateRecord: (id: string, updates: Partial<ForecastRecord>) => void;
  deleteRecord: (id: string) => void;

  setCurrentVersion: (versionId: string) => void;

  setFilters: (filters: Partial<FilterParams>) => void;
  resetFilters: () => void;
  getFilteredRecords: () => ForecastRecord[];

  openModal: (modal: keyof ModalState, record: ForecastRecord | null) => void;
  closeModal: (modal: keyof ModalState) => void;

  toggleSelectRecord: (id: string) => void;
  clearSelection: () => void;

  withdrawRecord: (id: string, reason: string) => void;
  resubmitRecord: (id: string, newRemark: string) => void;
  reviewRecord: (id: string) => void;
  approveRecord: (id: string) => void;

  reviseRecord: (id: string, revisedValue: number, remark: string) => void;
  addManualEntry: (record: Partial<ForecastRecord>) => void;

  setChartRecordId: (id: string | null) => void;
}

const defaultFilters: FilterParams = {
  dateRange: null,
  deviceNo: '',
  status: '',
  isAbnormal: null,
  hasStatusConflict: null,
  deviationSort: null,
};

const defaultModals: ModalState = {
  detail: { open: false, record: null },
  withdraw: { open: false, record: null },
  revise: { open: false, record: null },
};

export const useForecastStore = create<ForecastState>((set, get) => ({
  records: [...mockRecords],
  versions: mockForecastVersions,
  currentVersionId: mockForecastVersions.find(v => v.isCurrent)?.id || 'v3',
  filters: defaultFilters,
  modals: defaultModals,
  selectedRecordIds: [],
  chartRecordId: null,

  setRecords: (records) => set({ records }),

  addRecord: (record) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newRecord: ForecastRecord = {
      id: generateId(),
      deviceNo: record.deviceNo || '',
      deviceName: record.deviceName || '',
      forecastDate: record.forecastDate || new Date().toISOString().split('T')[0],
      forecastValue: record.forecastValue || 0,
      revisedValue: record.revisedValue,
      actualValue: record.actualValue || 0,
      deviationRate: record.deviationRate ?? calculateDeviation(record.forecastValue || 0, record.actualValue || 0),
      status: record.status || 'pending',
      isAbnormal: record.isAbnormal || false,
      hasStatusConflict: record.hasStatusConflict || false,
      createdBy: record.createdBy || '钟姐',
      updatedAt: now,
      remarks: record.remarks || [],
      sourceMaterial: record.sourceMaterial,
      isManualEntry: record.isManualEntry,
    };
    set(state => ({ records: [...state.records, newRecord] }));
  },

  updateRecord: (id, updates) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    set(state => ({
      records: state.records.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: now } : r
      ),
    }));
  },

  deleteRecord: (id) => {
    set(state => ({
      records: state.records.filter(r => r.id !== id),
    }));
  },

  setCurrentVersion: (versionId) => set({ currentVersionId: versionId }),

  setFilters: (filters) => {
    set(state => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  resetFilters: () => set({ filters: defaultFilters }),

  getFilteredRecords: () => {
    const { records, filters } = get();
    let result = [...records];

    if (filters.deviceNo) {
      result = result.filter(r => r.deviceNo.includes(filters.deviceNo));
    }

    if (filters.status) {
      result = result.filter(r => r.status === filters.status);
    }

    if (filters.isAbnormal !== null) {
      result = result.filter(r => r.isAbnormal === filters.isAbnormal);
    }

    if (filters.hasStatusConflict !== null) {
      result = result.filter(r => r.hasStatusConflict === filters.hasStatusConflict);
    }

    if (filters.deviationSort) {
      result.sort((a, b) =>
        filters.deviationSort === 'asc'
          ? Math.abs(a.deviationRate) - Math.abs(b.deviationRate)
          : Math.abs(b.deviationRate) - Math.abs(a.deviationRate)
      );
    }

    return result;
  },

  openModal: (modal, record) => {
    set(state => ({
      modals: {
        ...state.modals,
        [modal]: { open: true, record },
      },
    }));
  },

  closeModal: (modal) => {
    set(state => ({
      modals: {
        ...state.modals,
        [modal]: { open: false, record: null },
      },
    }));
  },

  toggleSelectRecord: (id) => {
    set(state => ({
      selectedRecordIds: state.selectedRecordIds.includes(id)
        ? state.selectedRecordIds.filter(i => i !== id)
        : [...state.selectedRecordIds, id],
    }));
  },

  clearSelection: () => set({ selectedRecordIds: [] }),

  withdrawRecord: (id, reason) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    set(state => ({
      records: state.records.map(r => {
        if (r.id !== id) return r;
        const updatedRemarks: Remark[] = r.remarks.map(rm => ({
          ...rm,
          type: 'original' as const,
        }));
        if (reason.trim()) {
          updatedRemarks.push({
            id: generateId(),
            content: reason,
            author: '主管',
            createdAt: now,
            type: 'new',
          });
        }
        return {
          ...r,
          status: 'withdrawn' as const,
          remarks: updatedRemarks,
          updatedBy: '主管',
          updatedAt: now,
        };
      }),
    }));
  },

  resubmitRecord: (id, newRemark) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    set(state => ({
      records: state.records.map(r => {
        if (r.id !== id) return r;
        const updatedRemarks = [...r.remarks];
        if (newRemark.trim()) {
          updatedRemarks.push({
            id: generateId(),
            content: newRemark,
            author: '钟姐',
            createdAt: now,
            type: 'new',
          });
        }
        return {
          ...r,
          status: 'pending' as const,
          remarks: updatedRemarks,
          updatedBy: '钟姐',
          updatedAt: now,
        };
      }),
    }));
  },

  reviewRecord: (id) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    set(state => ({
      records: state.records.map(r =>
        r.id === id
          ? { ...r, status: 'reviewed' as const, updatedBy: '钟姐', updatedAt: now }
          : r
      ),
    }));
  },

  approveRecord: (id) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    set(state => ({
      records: state.records.map(r =>
        r.id === id
          ? { ...r, status: 'approved' as const, updatedBy: '主管', updatedAt: now }
          : r
      ),
    }));
  },

  reviseRecord: (id, revisedValue, remark) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    set(state => ({
      records: state.records.map(r => {
        if (r.id !== id) return r;
        const newDeviation = calculateDeviation(revisedValue, r.actualValue);
        const updatedRemarks = [...r.remarks];
        if (remark.trim()) {
          updatedRemarks.push({
            id: generateId(),
            content: remark,
            author: '钟姐',
            createdAt: now,
            type: 'new',
          });
        }
        return {
          ...r,
          revisedValue,
          deviationRate: newDeviation,
          remarks: updatedRemarks,
          updatedBy: '钟姐',
          updatedAt: now,
        };
      }),
    }));
  },

  addManualEntry: (record) => {
    get().addRecord({
      ...record,
      createdBy: '钟姐',
      isManualEntry: true,
      status: 'pending',
    });
  },

  setChartRecordId: (id) => set({ chartRecordId: id }),
}));
