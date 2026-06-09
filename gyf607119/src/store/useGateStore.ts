import { create } from 'zustand';
import { GateStore, FilterType, EmptyStateType, GateInspection } from '../types';
import { mockGates } from '../data/mockData';
import { saveToStorage, loadFromStorage, validateGateData } from '../utils/storage';

const initialGates = loadFromStorage() || mockGates;

export const useGateStore = create<GateStore>((set, get) => ({
  gates: initialGates,
  filter: 'all',
  emptyStateType: null,
  showEmptyState: false,
  activeTab: 'dashboard',
  selectedGateId: null,
  showAmountIssuePanel: false,
  showThresholdIssuePanel: false,
  showDiffViewer: false,

  setFilter: (filter: FilterType) => set({ filter }),

  setActiveTab: (tab: 'dashboard' | 'pass-info') => set({ activeTab: tab }),

  setSelectedGateId: (id: string | null) => set({ selectedGateId: id }),

  setShowAmountIssuePanel: (show: boolean) => set({ showAmountIssuePanel: show }),

  setShowThresholdIssuePanel: (show: boolean) => set({ showThresholdIssuePanel: show }),

  setShowDiffViewer: (show: boolean) => set({ showDiffViewer: show }),

  setShowEmptyState: (show: boolean, type?: EmptyStateType) => 
    set({ showEmptyState: show, emptyStateType: type || null }),

  updatePassDescription: (gateId: string, description: string, operator: string) => {
    set((state) => {
      const now = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      
      const updatedGates = state.gates.map((gate) => {
        if (gate.id === gateId) {
          const newDescription = `${now} ${operator}补录：${description}。补录人：${operator}`;
          return {
            ...gate,
            originalPassDescription: gate.passDescription,
            passDescription: newDescription,
            operator,
            isManualEntry: true,
            manualEntryTime: now,
          };
        }
        return gate;
      });
      
      saveToStorage(updatedGates);
      return { gates: updatedGates };
    });
  },

  exportData: () => {
    const { gates } = get();
    return JSON.stringify(gates, null, 2);
  },

  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (validateGateData(data)) {
        set({ gates: data });
        saveToStorage(data);
        return { success: true, message: `成功导入 ${data.length} 条道闸数据` };
      }
      return { success: false, message: '数据格式不正确，请检查 JSON 结构' };
    } catch (error) {
      return { success: false, message: `JSON 解析失败：${error instanceof Error ? error.message : '未知错误'}` };
    }
  },

  resetData: () => {
    set({ gates: mockGates, filter: 'all', showEmptyState: false, emptyStateType: null });
    saveToStorage(mockGates);
  },
}));
