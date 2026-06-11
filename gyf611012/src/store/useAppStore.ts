import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppSettings,
  BatchInfo,
  ColorCard,
  Language,
  ReturnOrder,
  SaffronGrade,
  SilkRecord,
  User,
} from '@/types';
import { SaffronGrade as Grade } from '@/types';
import { COLOR_CARDS, MOCK_BATCHES, MOCK_RETURN_ORDERS, USERS } from '@/data/seedData';
import { dayjs, genId } from '@/utils/helpers';

const GRADE_ORDER: SaffronGrade[] = [
  Grade.GRADE_S,
  Grade.GRADE_A,
  Grade.GRADE_B,
  Grade.GRADE_C,
  Grade.GRADE_D,
  Grade.GRADE_E,
  Grade.GRADE_F,
];

interface AppState {
  users: User[];
  currentUser: User;
  colorCards: ColorCard[];
  batches: BatchInfo[];
  silkRecords: SilkRecord[];
  returnOrders: ReturnOrder[];
  activeBatchId: string | null;
  settings: AppSettings;

  setCurrentUser: (id: string) => void;
  setActiveBatch: (id: string | null) => void;
  toggleDarkbox: () => void;
  setLanguage: (lang: Language) => void;
  updateSetting: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  updateColorCardThreshold: (grade: SaffronGrade, maxDeltaE: number) => void;

  getBatchRecords: (batchId: string) => SilkRecord[];
  getBatchById: (id: string) => BatchInfo | undefined;
  getReturnOrderById: (id: string) => ReturnOrder | undefined;
  getReturnOrdersForBatch: (batchId: string) => ReturnOrder[];

  addSilkRecord: (
    record: Omit<SilkRecord, 'id' | 'inspectedAt' | 'inspectorId' | 'inspectorName'>
  ) => SilkRecord;
  setBatchRecords: (batchId: string, records: SilkRecord[]) => void;

  applyReturnOrder: (
    params: Omit<
      ReturnOrder,
      | 'id'
      | 'returnNo'
      | 'status'
      | 'createdAt'
      | 'irrevocableUntil'
      | 'applicantId'
      | 'applicantName'
    > & { applicantSignDataUrl?: string; degradationReason: string }
  ) => ReturnOrder;

  approveReturnOrderLevel: (
    returnId: string,
    level: 1 | 2,
    approver: User,
    signDataUrl?: string
  ) => { success: boolean; error?: string; order?: ReturnOrder };

  rejectReturnOrder: (
    returnId: string,
    approver: User,
    reason: string
  ) => { success: boolean; error?: string };

  refreshReturnOrderStatuses: () => void;
}

function tryAutoCreateReturnOrder(
  state: {
    returnOrders: ReturnOrder[];
    colorCards: ColorCard[];
    batches: BatchInfo[];
  },
  batchId: string,
  applicantId: string,
  applicantName: string
): ReturnOrder | null {
  const batch = state.batches.find((b) => b.id === batchId);
  if (!batch) return null;
  if (batch.outOfThresholdCount <= batch.totalQuantity * 0.2) return null;
  const existingActive = state.returnOrders.some(
    (r) =>
      r.batchId === batchId &&
      ['PENDING_APPROVAL', 'FIRST_APPROVED', 'FINAL_APPROVED', 'LOCKED', 'EFFECTIVE'].includes(
        r.status
      )
  );
  if (existingActive) return null;

  const expectedCard = state.colorCards.find((c) => c.grade === batch.expectedGrade);
  const threshold = expectedCard?.maxDeltaE ?? 3;
  let degradedToGrade: SaffronGrade = Grade.GRADE_C;
  for (const g of GRADE_ORDER) {
    const card = state.colorCards.find((c) => c.grade === g);
    if (card && batch.avgDeltaE <= card.maxDeltaE) {
      degradedToGrade = g;
      break;
    }
  }
  const newOrder: ReturnOrder = {
    id: genId('ro'),
    returnNo: `RT-${dayjs().format('YYYYMMDD')}-${String(
      state.returnOrders.length + 1
    ).padStart(3, '0')}`,
    batchId: batch.id,
    batchNo: batch.batchNo,
    supplierName: batch.supplierName,
    originalGrade: batch.expectedGrade,
    degradedToGrade,
    degradationReason: `系统自动检测：批次 ${batch.batchNo} 共 ${batch.totalQuantity} 条，超阈 ${batch.outOfThresholdCount} 条（占比 ${(
      (batch.outOfThresholdCount / batch.totalQuantity) *
      100
    ).toFixed(1)}%），平均ΔE ${batch.avgDeltaE}，最大ΔE ${batch.maxDeltaE}，超出合同等级 ${batch.expectedGrade} 阈值 ${threshold}，自动触发降级退货申请，待双人确认。`,
    avgDeltaE: batch.avgDeltaE,
    maxDeltaE: batch.maxDeltaE,
    outOfThresholdCount: batch.outOfThresholdCount,
    totalCount: batch.totalQuantity,
    applicantId,
    applicantName,
    status: 'PENDING_APPROVAL',
    createdAt: dayjs().toISOString(),
    irrevocableUntil: dayjs().add(1, 'year').toISOString(),
  };
  return newOrder;
}

function emptyDist(): Record<SaffronGrade, number> {
  return {
    [Grade.GRADE_S]: 0,
    [Grade.GRADE_A]: 0,
    [Grade.GRADE_B]: 0,
    [Grade.GRADE_C]: 0,
    [Grade.GRADE_D]: 0,
    [Grade.GRADE_E]: 0,
    [Grade.GRADE_F]: 0,
  };
}

function recomputeBatchStats(
  batch: BatchInfo,
  records: SilkRecord[]
): Partial<BatchInfo> {
  const dist = emptyDist();
  let sumDelta = 0;
  let maxDelta = 0;
  let outOf = 0;
  records.forEach((r) => {
    dist[r.actualGrade] += 1;
    sumDelta += r.deltaE;
    if (r.deltaE > maxDelta) maxDelta = r.deltaE;
    if (!r.isWithinThreshold) outOf += 1;
  });
  let status = batch.status;
  if (records.length === batch.totalQuantity) {
    if (outOf > batch.totalQuantity * 0.2) status = 'DEGRADED';
    else status = 'INSPECTED';
  } else if (records.length > 0) {
    status = 'INSPECTING';
  }
  return {
    inspectedCount: records.length,
    gradeDistribution: dist,
    avgDeltaE: records.length ? Number((sumDelta / records.length).toFixed(2)) : 0,
    maxDeltaE: Number(maxDelta.toFixed(2)),
    outOfThresholdCount: outOf,
    status,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: USERS,
      currentUser: USERS[0],
      colorCards: COLOR_CARDS,
      batches: MOCK_BATCHES,
      silkRecords: [],
      returnOrders: MOCK_RETURN_ORDERS,
      activeBatchId: null,
      settings: {
        darkboxMode: false,
        language: 'zh',
        screenBrightness: 92,
        ambientLightAlertThreshold: 80,
        requireDualApproval: true,
        lockHours: 24,
      },

      setCurrentUser: (id) => {
        const u = get().users.find((x) => x.id === id);
        if (u) set({ currentUser: u });
      },
      setActiveBatch: (id) => set({ activeBatchId: id }),
      toggleDarkbox: () =>
        set((s) => ({
          settings: { ...s.settings, darkboxMode: !s.settings.darkboxMode },
        })),
      setLanguage: (lang) =>
        set((s) => ({ settings: { ...s.settings, language: lang } })),
      updateSetting: (k, v) =>
        set((s) => ({ settings: { ...s.settings, [k]: v } })),
      updateColorCardThreshold: (grade, maxDeltaE) =>
        set((s) => ({
          colorCards: s.colorCards.map((c) =>
            c.grade === grade ? { ...c, maxDeltaE } : c
          ),
        })),

      getBatchRecords: (batchId) =>
        get().silkRecords.filter((r) => r.batchId === batchId),

      getBatchById: (id) => get().batches.find((b) => b.id === id),

      getReturnOrderById: (id) => get().returnOrders.find((r) => r.id === id),

      getReturnOrdersForBatch: (batchId) =>
        get().returnOrders.filter((r) => r.batchId === batchId),

      addSilkRecord: (partial) => {
        const user = get().currentUser;
        const rec: SilkRecord = {
          ...partial,
          id: genId('sr'),
          inspectedAt: dayjs().toISOString(),
          inspectorId: user.id,
          inspectorName: user.name,
        };
        set((s) => {
          const records = [...s.silkRecords, rec];
          const batch = s.batches.find((b) => b.id === rec.batchId);
          const batches = batch
            ? s.batches.map((b) =>
                b.id === batch.id
                  ? { ...b, ...recomputeBatchStats(b, records.filter((r) => r.batchId === b.id)) }
                  : b
              )
            : s.batches;
          const nextState = { ...s, batches };
          const autoOrder = tryAutoCreateReturnOrder(
            nextState,
            rec.batchId,
            user.id,
            user.name
          );
          return {
            silkRecords: records,
            batches,
            returnOrders: autoOrder ? [...s.returnOrders, autoOrder] : s.returnOrders,
          };
        });
        return rec;
      },

      setBatchRecords: (batchId, records) =>
        set((s) => {
          const other = s.silkRecords.filter((r) => r.batchId !== batchId);
          const allRecords = [...other, ...records];
          const batch = s.batches.find((b) => b.id === batchId);
          const batches = batch
            ? s.batches.map((b) =>
                b.id === batchId
                  ? { ...b, ...recomputeBatchStats(b, records) }
                  : b
              )
            : s.batches;
          const nextState = { ...s, batches };
          const autoOrder = tryAutoCreateReturnOrder(
            nextState,
            batchId,
            s.currentUser.id,
            s.currentUser.name
          );
          return {
            silkRecords: allRecords,
            batches,
            returnOrders: autoOrder ? [...s.returnOrders, autoOrder] : s.returnOrders,
          };
        }),

      applyReturnOrder: (params) => {
        const user = get().currentUser;
        const order: ReturnOrder = {
          ...params,
          id: genId('ro'),
          returnNo: `RT-${dayjs().format('YYYYMMDD')}-${String(
            get().returnOrders.length + 1
          ).padStart(3, '0')}`,
          status: 'PENDING_APPROVAL',
          createdAt: dayjs().toISOString(),
          irrevocableUntil: dayjs().add(1, 'year').toISOString(),
          applicantId: user.id,
          applicantName: user.name,
        };
        set((s) => ({ returnOrders: [...s.returnOrders, order] }));
        return order;
      },

      approveReturnOrderLevel: (returnId, level, approver, signDataUrl) => {
        const s = get();
        const order = s.returnOrders.find((r) => r.id === returnId);
        if (!order) return { success: false, error: '退货单不存在' };
        if (level === 1) {
          if (order.status !== 'PENDING_APPROVAL')
            return { success: false, error: '当前状态不可进行一级确认' };
          const updated: ReturnOrder = {
            ...order,
            status: 'FIRST_APPROVED',
            approverId: approver.id,
            approverName: approver.name,
            approverSignDataUrl: signDataUrl,
            firstApprovedAt: dayjs().toISOString(),
          };
          set((st) => ({
            returnOrders: st.returnOrders.map((r) =>
              r.id === returnId ? updated : r
            ),
          }));
          return { success: true, order: updated };
        } else {
          if (order.status !== 'FIRST_APPROVED')
            return { success: false, error: '需先完成一级确认' };
          const now = dayjs();
          const updated: ReturnOrder = {
            ...order,
            status: 'FINAL_APPROVED',
            secondApproverId: approver.id,
            secondApproverName: approver.name,
            secondApproverSignDataUrl: signDataUrl,
            finalApprovedAt: now.toISOString(),
            irrevocableUntil: now.add(s.settings.lockHours, 'hour').toISOString(),
          };
          set((st) => ({
            returnOrders: st.returnOrders.map((r) =>
              r.id === returnId ? updated : r
            ),
            batches: st.batches.map((b) =>
              b.id === updated.batchId
                ? { ...b, status: 'RETURNED' as const }
                : b
            ),
          }));
          return { success: true, order: updated };
        }
      },

      rejectReturnOrder: (returnId, approver, reason) => {
        const s = get();
        const order = s.returnOrders.find((r) => r.id === returnId);
        if (!order) return { success: false, error: '退货单不存在' };
        if (!['PENDING_APPROVAL', 'FIRST_APPROVED'].includes(order.status)) {
          return { success: false, error: '当前状态不可驳回' };
        }
        const updated: ReturnOrder = {
          ...order,
          status: 'REJECTED',
          rejectReason: reason,
        };
        set((st) => ({
          returnOrders: st.returnOrders.map((r) =>
            r.id === returnId ? updated : r
          ),
        }));
        return { success: true };
      },

      refreshReturnOrderStatuses: () =>
        set((s) => {
          const now = dayjs();
          return {
            returnOrders: s.returnOrders.map((r) => {
              if (
                (r.status === 'FINAL_APPROVED' || r.status === 'LOCKED') &&
                now.isAfter(r.irrevocableUntil)
              ) {
                return { ...r, status: 'EFFECTIVE' as const, effectiveAt: r.irrevocableUntil };
              }
              if (
                r.status === 'FINAL_APPROVED' &&
                now.isBefore(r.irrevocableUntil)
              ) {
                return { ...r, status: 'LOCKED' as const };
              }
              return r;
            }),
          };
        }),
    }),
    {
      name: 'saffron-qc-store',
      partialize: (s) => ({
        settings: s.settings,
        colorCards: s.colorCards,
        silkRecords: s.silkRecords,
        returnOrders: s.returnOrders,
        currentUserId: s.currentUser.id,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // @ts-expect-error migration
          const uid = state.currentUserId;
          if (uid) {
            const match = USERS.find((u) => u.id === uid);
            if (match) state.currentUser = match;
          }
          setTimeout(() => state.refreshReturnOrderStatuses(), 50);
        }
      },
    }
  )
);
