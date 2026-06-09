import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contract, ContractHistory, FilterState, ValidationResult, AnomalyType, DateRange } from '../types/contract';
import { mockContracts, mockHistory } from '../data/mockData';

interface ContractState {
  contracts: Contract[];
  history: ContractHistory[];
  selectedIds: string[];
  editingId: string | null;
  filters: FilterState;
  isDataLoaded: boolean;
  isCorrupted: boolean;
  currentUser: string;
}

interface ContractActions {
  initializeData: () => void;
  setEditingId: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  batchUpdateStatus: (ids: string[], status: Contract['status']) => void;
  batchMarkAnomaly: (ids: string[], anomaly: AnomalyType) => void;
  batchRemoveAnomaly: (ids: string[], anomaly: AnomalyType) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  validateContract: (contract: Contract) => ValidationResult;
  validateAll: () => void;
  addContract: (contract: Contract) => void;
  deleteContract: (id: string) => void;
  importContracts: (contracts: Contract[]) => void;
  exportContracts: (ids?: string[]) => Contract[];
  getContractsByDevice: (deviceId: string) => Contract[];
  getSupplementContracts: () => Contract[];
  compareContracts: (id1: string, id2: string) => Array<{ field: string; oldVal: string; newVal: string }>;
  resetToMock: () => void;
  clearAllData: () => void;
  getFilteredContracts: () => Contract[];
  getStats: () => {
    total: number;
    byStatus: Record<string, number>;
    byManager: Record<string, number>;
    totalAmount: number;
    anomalyCount: number;
    attachmentMissing: number;
  };
  getMonthlyStats: (dateRange?: DateRange) => Array<{ month: string; count: number; amount: number }>;
  markAsCorrupted: () => void;
  addHistory: (history: ContractHistory) => void;
}

const initialFilters: FilterState = {
  status: '',
  customerManager: '',
  hasAnomaly: null,
  dateRange: null,
  searchKeyword: '',
};

export const useContractStore = create<ContractState & ContractActions>()(
  persist(
    (set, get) => ({
      contracts: [],
      history: [],
      selectedIds: [],
      editingId: null,
      filters: initialFilters,
      isDataLoaded: false,
      isCorrupted: false,
      currentUser: '当前用户',

      initializeData: () => {
        if (!get().isDataLoaded) {
          set({
            contracts: [...mockContracts],
            history: [...mockHistory],
            isDataLoaded: true,
          });
        }
      },

      setEditingId: (id) => set({ editingId: id }),

      toggleSelect: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((i) => i !== id)
            : [...state.selectedIds, id],
        })),

      selectAll: (ids) => set({ selectedIds: ids }),

      clearSelection: () => set({ selectedIds: [] }),

      updateContract: (id, updates) => {
        const now = new Date().toISOString();
        const oldContract = get().contracts.find((c) => c.id === id);
        
        if (oldContract) {
          Object.entries(updates).forEach(([key, value]) => {
            if (oldContract[key as keyof Contract] !== value) {
              get().addHistory({
                contractId: id,
                fieldName: key,
                oldValue: String(oldContract[key as keyof Contract]),
                newValue: String(value),
                changedBy: get().currentUser,
                changedAt: now,
              });
            }
          });
        }

        set((state) => ({
          contracts: state.contracts.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...updates,
                  updatedAt: now,
                  updatedBy: get().currentUser,
                }
              : c
          ),
        }));
        get().validateAll();
      },

      batchUpdateStatus: (ids, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          contracts: state.contracts.map((c) =>
            ids.includes(c.id)
              ? { ...c, status, updatedAt: now, updatedBy: get().currentUser }
              : c
          ),
        }));
        ids.forEach((id) => {
          get().addHistory({
            contractId: id,
            fieldName: 'status',
            oldValue: '',
            newValue: status,
            changedBy: get().currentUser,
            changedAt: now,
          });
        });
      },

      batchMarkAnomaly: (ids, anomaly) => {
        set((state) => ({
          contracts: state.contracts.map((c) =>
            ids.includes(c.id)
              ? {
                  ...c,
                  anomalies: c.anomalies.includes(anomaly)
                    ? c.anomalies
                    : [...c.anomalies, anomaly],
                }
              : c
          ),
        }));
      },

      batchRemoveAnomaly: (ids, anomaly) => {
        set((state) => ({
          contracts: state.contracts.map((c) =>
            ids.includes(c.id)
              ? {
                  ...c,
                  anomalies: c.anomalies.filter((a) => a !== anomaly),
                }
              : c
          ),
        }));
      },

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () => set({ filters: initialFilters }),

      validateContract: (contract): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const anomalies: AnomalyType[] = [];

        if (!contract.contractNo) errors.push('合同编号不能为空');
        if (!contract.customerName) errors.push('客户名称不能为空');
        if (contract.contractAmount <= 0) {
          errors.push('合同金额必须大于0');
          anomalies.push('金额异常');
        }
        if (new Date(contract.effectiveDate) >= new Date(contract.expiryDate)) {
          errors.push('生效日期必须早于到期日期');
          anomalies.push('日期错误');
        }
        if (!contract.hasAttachment) {
          warnings.push('缺少合同附件');
          anomalies.push('附件缺失');
        }

        const sameDevice = get()
          .contracts.filter(
            (c) =>
              c.deviceId === contract.deviceId &&
              c.id !== contract.id &&
              c.status !== '已退回' &&
              c.status !== '异常'
          );
        if (sameDevice.length > 0) {
          warnings.push(`设备 ${contract.deviceId} 存在 ${sameDevice.length} 个有效合同，可能存在状态冲突`);
          anomalies.push('设备重复');
          anomalies.push('状态冲突');
        }

        const statusByDevice = new Map<string, Set<string>>();
        get().contracts.forEach((c) => {
          if (c.id !== contract.id && c.status !== '已退回') {
            if (!statusByDevice.has(c.deviceId)) {
              statusByDevice.set(c.deviceId, new Set());
            }
            statusByDevice.get(c.deviceId)!.add(c.status);
          }
        });
        const deviceStatuses = statusByDevice.get(contract.deviceId);
        if (deviceStatuses && deviceStatuses.size > 1) {
          anomalies.push('状态冲突');
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      },

      validateAll: () => {
        set((state) => ({
          contracts: state.contracts.map((c) => {
            const anomalies: AnomalyType[] = [];
            
            if (c.contractAmount <= 0) anomalies.push('金额异常');
            if (new Date(c.effectiveDate) >= new Date(c.expiryDate)) anomalies.push('日期错误');
            if (!c.hasAttachment) anomalies.push('附件缺失');

            const sameDevice = state.contracts.filter(
              (other) =>
                other.deviceId === c.deviceId &&
                other.id !== c.id &&
                other.status !== '已退回' &&
                other.status !== '异常'
            );
            if (sameDevice.length > 0) {
              anomalies.push('设备重复');
            }

            const deviceStatuses = new Set(
              state.contracts
                .filter((other) => other.deviceId === c.deviceId && other.id !== c.id && other.status !== '已退回')
                .map((other) => other.status)
            );
            if (deviceStatuses.size > 1 || (sameDevice.length > 0 && c.status !== sameDevice[0].status)) {
              if (!anomalies.includes('状态冲突')) {
                anomalies.push('状态冲突');
              }
            }

            return { ...c, anomalies: [...new Set(anomalies)] };
          }),
        }));
      },

      addContract: (contract) =>
        set((state) => ({
          contracts: [...state.contracts, contract],
        })),

      deleteContract: (id) =>
        set((state) => ({
          contracts: state.contracts.filter((c) => c.id !== id),
          selectedIds: state.selectedIds.filter((i) => i !== id),
        })),

      importContracts: (contracts) =>
        set((state) => ({
          contracts: [...state.contracts, ...contracts],
          isDataLoaded: true,
        })),

      exportContracts: (ids) => {
        const { contracts } = get();
        if (ids && ids.length > 0) {
          return contracts.filter((c) => ids.includes(c.id));
        }
        return contracts;
      },

      getContractsByDevice: (deviceId) =>
        get().contracts.filter((c) => c.deviceId === deviceId),

      getSupplementContracts: () =>
        get().contracts.filter((c) => c.isSupplement),

      compareContracts: (id1, id2) => {
        const c1 = get().contracts.find((c) => c.id === id1);
        const c2 = get().contracts.find((c) => c.id === id2);
        if (!c1 || !c2) return [];

        const fields: (keyof Contract)[] = [
          'contractNo', 'customerName', 'deviceId', 'deviceName',
          'contractAmount', 'electricityPrice', 'contractDate',
          'effectiveDate', 'expiryDate', 'status', 'hasAttachment',
          'customerManager',
        ];

        return fields
          .filter((f) => String(c1[f]) !== String(c2[f]))
          .map((f) => ({
            field: f,
            oldVal: String(c1[f]),
            newVal: String(c2[f]),
          }));
      },

      resetToMock: () =>
        set({
          contracts: [...mockContracts],
          history: [...mockHistory],
          isDataLoaded: true,
          isCorrupted: false,
          selectedIds: [],
          editingId: null,
          filters: initialFilters,
        }),

      clearAllData: () =>
        set({
          contracts: [],
          history: [],
          isDataLoaded: false,
          isCorrupted: false,
          selectedIds: [],
          editingId: null,
          filters: initialFilters,
        }),

      getFilteredContracts: () => {
        const { contracts, filters } = get();
        return contracts.filter((c) => {
          if (filters.status && c.status !== filters.status) return false;
          if (filters.customerManager && c.customerManager !== filters.customerManager) return false;
          if (filters.hasAnomaly !== null) {
            if (filters.hasAnomaly && c.anomalies.length === 0) return false;
            if (!filters.hasAnomaly && c.anomalies.length > 0) return false;
          }
          if (filters.dateRange) {
            const contractDate = new Date(c.contractDate);
            const start = new Date(filters.dateRange.start);
            const end = new Date(filters.dateRange.end);
            if (contractDate < start || contractDate > end) return false;
          }
          if (filters.searchKeyword) {
            const keyword = filters.searchKeyword.toLowerCase();
            return (
              c.contractNo.toLowerCase().includes(keyword) ||
              c.customerName.toLowerCase().includes(keyword) ||
              c.deviceName.toLowerCase().includes(keyword) ||
              c.customerManager.toLowerCase().includes(keyword)
            );
          }
          return true;
        });
      },

      getStats: () => {
        const { contracts } = get();
        const byStatus: Record<string, number> = {};
        const byManager: Record<string, number> = {};
        let totalAmount = 0;
        let anomalyCount = 0;
        let attachmentMissing = 0;

        contracts.forEach((c) => {
          byStatus[c.status] = (byStatus[c.status] || 0) + 1;
          byManager[c.customerManager] = (byManager[c.customerManager] || 0) + 1;
          if (c.contractAmount > 0) totalAmount += c.contractAmount;
          if (c.anomalies.length > 0) anomalyCount++;
          if (!c.hasAttachment) attachmentMissing++;
        });

        return {
          total: contracts.length,
          byStatus,
          byManager,
          totalAmount,
          anomalyCount,
          attachmentMissing,
        };
      },

      getMonthlyStats: (dateRange) => {
        const { contracts } = get();
        const monthlyData: Record<string, { count: number; amount: number }> = {};

        contracts.forEach((c) => {
          if (dateRange) {
            const contractDate = new Date(c.contractDate);
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            if (contractDate < start || contractDate > end) return;
          }

          const month = c.contractDate.substring(0, 7);
          if (!monthlyData[month]) {
            monthlyData[month] = { count: 0, amount: 0 };
          }
          monthlyData[month].count++;
          if (c.contractAmount > 0) {
            monthlyData[month].amount += c.contractAmount;
          }
        });

        return Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, data]) => ({ month, ...data }));
      },

      markAsCorrupted: () => set({ isCorrupted: true }),

      addHistory: (history) =>
        set((state) => ({
          history: [...state.history, history],
        })),
    }),
    {
      name: 'contract-review-storage',
      partialize: (state) => ({
        contracts: state.contracts,
        history: state.history,
        isDataLoaded: state.isDataLoaded,
        isCorrupted: state.isCorrupted,
        filters: state.filters,
      }),
    }
  )
);
