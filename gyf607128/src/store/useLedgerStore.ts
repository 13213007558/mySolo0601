import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CarbonLedger,
  LedgerStore,
  LedgerStatus,
  OperationHistory,
  EmissionFactorNote,
} from '@/types';
import { generateMockLedgers, mockEmissionFactorNote, mockOperationHistories } from '@/data/mockData';
import { WITHDRAW_REASON_TIP_MAP } from '@/types';

function generatePlainTip(reason: string): string {
  return WITHDRAW_REASON_TIP_MAP[reason] || WITHDRAW_REASON_TIP_MAP['默认'];
}

function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useLedgerStore = create<LedgerStore>()(
  persist(
    (set, get) => ({
      ledgers: generateMockLedgers(20),
      operationHistories: mockOperationHistories,
      emissionFactorNote: mockEmissionFactorNote,
      highlightedRowId: null,
      currentUser: '节能顾问-李经理',

      setLedgers: (ledgers: CarbonLedger[]) => set({ ledgers }),

      toggleSelected: (id: string) =>
        set((state) => ({
          ledgers: state.ledgers.map((l) => (l.id === id ? { ...l, selected: !l.selected } : l)),
        })),

      selectAll: (selected: boolean) =>
        set((state) => ({
          ledgers: state.ledgers.map((l) => ({ ...l, selected })),
        })),

      updateWithdrawReason: (id: string, reason: string) => {
        const state = get();
        const ledger = state.ledgers.find((l) => l.id === id);
        if (!ledger) return;

        const originalValues: Record<string, Partial<CarbonLedger>> = {
          [id]: {
            withdrawReason: ledger.withdrawReason,
            plainTip: ledger.plainTip,
            updatedAt: ledger.updatedAt,
          },
        };

        const newPlainTip = generatePlainTip(reason);
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const newValues: Record<string, Partial<CarbonLedger>> = {
          [id]: {
            withdrawReason: reason,
            plainTip: newPlainTip,
            updatedAt: now,
          },
        };

        const history: OperationHistory = {
          id: generateId(),
          operationType: 'single_edit',
          affectedIds: [id],
          operator: state.currentUser,
          operationTime: now,
          reason: `撤回原因更新: ${ledger.withdrawReason || '(空)'} → ${reason}`,
          originalValues,
          newValues,
          canRollback: false,
        };

        set({
          ledgers: state.ledgers.map((l) =>
            l.id === id ? { ...l, withdrawReason: reason, plainTip: newPlainTip, updatedAt: now } : l
          ),
          operationHistories: [history, ...state.operationHistories],
        });
      },

      updateStatus: (id: string, status: LedgerStatus) =>
        set((state) => ({
          ledgers: state.ledgers.map((l) => (l.id === id ? { ...l, status } : l)),
        })),

      batchWithdraw: (ids: string[], reason: string) => {
        const state = get();
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const newPlainTip = generatePlainTip(reason);

        const originalValues: Record<string, Partial<CarbonLedger>> = {};
        const newValues: Record<string, Partial<CarbonLedger>> = {};

        ids.forEach((id) => {
          const ledger = state.ledgers.find((l) => l.id === id);
          if (ledger) {
            originalValues[id] = {
              status: ledger.status,
              withdrawReason: ledger.withdrawReason,
              plainTip: ledger.plainTip,
              updatedAt: ledger.updatedAt,
            };
            newValues[id] = {
              status: 'withdrawn',
              withdrawReason: reason,
              plainTip: newPlainTip,
              updatedAt: now,
            };
          }
        });

        const history: OperationHistory = {
          id: generateId(),
          operationType: 'batch_withdraw',
          affectedIds: ids,
          operator: state.currentUser,
          operationTime: now,
          reason,
          originalValues,
          newValues,
          canRollback: false,
        };

        set({
          ledgers: state.ledgers.map((l) =>
            ids.includes(l.id)
              ? {
                  ...l,
                  status: 'withdrawn',
                  withdrawReason: reason,
                  plainTip: newPlainTip,
                  updatedAt: now,
                  selected: false,
                }
              : l
          ),
          operationHistories: [history, ...state.operationHistories],
        });
      },

      batchModifyEmission: (ids: string[], factor: string, emission: number) => {
        const state = get();
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const originalValues: Record<string, Partial<CarbonLedger>> = {};
        const newValues: Record<string, Partial<CarbonLedger>> = {};

        ids.forEach((id) => {
          const ledger = state.ledgers.find((l) => l.id === id);
          if (ledger) {
            originalValues[id] = {
              emissionFactor: ledger.emissionFactor,
              carbonEmission: ledger.carbonEmission,
              originalCarbonEmission: ledger.originalCarbonEmission,
              originalEmissionFactor: ledger.originalEmissionFactor,
              isManualEntry: ledger.isManualEntry,
              manualEntryNote: ledger.manualEntryNote,
              updatedAt: ledger.updatedAt,
            };
            newValues[id] = {
              emissionFactor: factor,
              carbonEmission: emission,
              originalCarbonEmission: ledger.carbonEmission,
              originalEmissionFactor: ledger.emissionFactor,
              isManualEntry: true,
              manualEntryNote: `韩工手工补录，排放因子从${ledger.emissionFactor}更新为${factor}，碳排放量调整${ledger.carbonEmission} → ${emission} tCO2`,
              updatedAt: now,
            };
          }
        });

        const history: OperationHistory = {
          id: generateId(),
          operationType: 'batch_modify',
          affectedIds: ids,
          operator: '韩工',
          operationTime: now,
          reason: '排放因子更新，手工补录修正',
          originalValues,
          newValues,
          canRollback: false,
        };

        set({
          ledgers: state.ledgers.map((l) =>
            ids.includes(l.id)
              ? {
                  ...l,
                  emissionFactor: factor,
                  carbonEmission: emission,
                  originalCarbonEmission: l.carbonEmission,
                  originalEmissionFactor: l.emissionFactor,
                  isManualEntry: true,
                  manualEntryNote: `韩工手工补录，排放因子从${l.emissionFactor}更新为${factor}，碳排放量调整${l.carbonEmission} → ${emission} tCO2`,
                  updatedAt: now,
                  selected: false,
                }
              : l
          ),
          operationHistories: [history, ...state.operationHistories],
        });
      },

      setHighlightedRowId: (id: string | null) => set({ highlightedRowId: id }),

      addOperationHistory: (history: OperationHistory) =>
        set((state) => ({
          operationHistories: [history, ...state.operationHistories],
        })),

      importLedgers: (ledgers: CarbonLedger[]) => set({ ledgers }),
    }),
    {
      name: 'carbon-ledger-store',
      partialize: (state) => ({
        ledgers: state.ledgers,
        operationHistories: state.operationHistories,
        emissionFactorNote: state.emissionFactorNote,
      }),
    }
  )
);
