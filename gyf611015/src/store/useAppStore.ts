import { create } from 'zustand';
import type { Mussel, ReInspectionOrder, Operator } from '@/types';
import { calcStats, computeGrade, isAnomalous, getQuadrant } from '@/utils/statistics';
import {
  createEmptyMussel,
  createPoint,
  createReInspectionOrder,
  exportCertificate as genCert,
  OPERATORS,
  POOL_HISTORY,
} from '@/mock/data';

const STORAGE_KEY = 'pearl-gauge-store-v1';

interface PersistState {
  mussels: Mussel[];
  currentMusselId: string | null;
  reInspectionOrders: ReInspectionOrder[];
  currentOperatorId: string;
}

function loadPersisted(): PersistState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistState;
    return parsed;
  } catch {
    return null;
  }
}

function savePersisted(state: PersistState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

interface AppState {
  mussels: Mussel[];
  currentMusselId: string | null;
  reInspectionOrders: ReInspectionOrder[];
  currentOperatorId: string;
  thinThreshold: number;
  requiredPoints: number;
  requiredQuadrants: number;
  editingPointId: string | null;

  currentMussel: () => Mussel | null;
  currentStats: () => ReturnType<typeof calcStats>;
  currentOrders: () => ReInspectionOrder[];
  currentOperator: () => Operator;
  allOperators: () => Operator[];
  poolHistory: (poolId: string) => typeof POOL_HISTORY[string];

  addMussel: (poolId: string, batchId: string) => void;
  selectMussel: (id: string) => void;
  addPoint: (x: number, y: number, thickness: number) => void;
  updatePoint: (pointId: string, thickness: number) => void;
  removePoint: (pointId: string) => void;
  setEditingPoint: (id: string | null) => void;
  completeReInspection: (orderId: string, recheckValue: number, operatorId: string) => void;
  setOperator: (id: string) => void;
  exportCertificate: () => string | null;
  resetAll: () => void;
}

const persisted = loadPersisted();

export const useAppStore = create<AppState>((set, get) => ({
  mussels: persisted?.mussels ?? [],
  currentMusselId: persisted?.currentMusselId ?? null,
  reInspectionOrders: persisted?.reInspectionOrders ?? [],
  currentOperatorId: persisted?.currentOperatorId ?? OPERATORS[0].id,
  thinThreshold: 1.2,
  requiredPoints: 8,
  requiredQuadrants: 3,
  editingPointId: null,

  currentMussel: () => {
    const state = get();
    return state.mussels.find((m) => m.id === state.currentMusselId) ?? null;
  },

  currentStats: () => {
    const mussel = get().currentMussel();
    if (!mussel) return calcStats([]);
    return calcStats(mussel.points);
  },

  currentOrders: () => {
    const mussel = get().currentMussel();
    if (!mussel) return [];
    return get().reInspectionOrders.filter((o) => o.musselId === mussel.id);
  },

  currentOperator: () => {
    const op = OPERATORS.find((o) => o.id === get().currentOperatorId);
    return op ?? OPERATORS[0];
  },

  allOperators: () => OPERATORS,

  poolHistory: (poolId: string) => POOL_HISTORY[poolId] ?? [],

  addMussel: (poolId, batchId) => {
    const mussel = createEmptyMussel(poolId, batchId);
    set((s) => {
      const next = { mussels: [...s.mussels, mussel], currentMusselId: mussel.id };
      savePersisted({
        mussels: next.mussels,
        currentMusselId: next.currentMusselId,
        reInspectionOrders: s.reInspectionOrders,
        currentOperatorId: s.currentOperatorId,
      });
      return next;
    });
  },

  selectMussel: (id) =>
    set((s) => {
      const next = { currentMusselId: id };
      savePersisted({
        mussels: s.mussels,
        currentMusselId: id,
        reInspectionOrders: s.reInspectionOrders,
        currentOperatorId: s.currentOperatorId,
      });
      return next;
    }),

  addPoint: (x, y, thickness) => {
    const state = get();
    const mussel = state.currentMussel();
    if (!mussel) return;

    const quadrant = getQuadrant(x, y, 250, 200);
    const batchId = mussel.batchId;
    const point = createPoint(x, y, thickness, quadrant, batchId);
    const newPoints = [...mussel.points, point];
    const stats = calcStats(newPoints);
    const gradeResult = computeGrade(stats, state.requiredPoints, state.requiredQuadrants);

    const updatedMussel: Mussel = {
      ...mussel,
      points: newPoints,
      grade: gradeResult.grade,
      canGrade: gradeResult.canGrade,
      gradeReason: gradeResult.reason,
    };

    const newOrders: ReInspectionOrder[] = [];
    for (const p of newPoints) {
      if (isAnomalous(p, stats) && !p.isRechecked) {
        const existingOrder = state.reInspectionOrders.find(
          (o) => o.pointId === p.id && o.status === 'pending',
        );
        if (!existingOrder) {
          newOrders.push(
            createReInspectionOrder(
              mussel.id,
              p.id,
              `厚度${p.thickness.toFixed(2)}mm偏离均值${stats.avg.toFixed(2)}mm超过2倍标准差(${stats.stdDev.toFixed(2)}mm)`,
              p.thickness,
              state.currentOperator().name,
            ),
          );
        }
      }
    }

    set((s) => {
      const nextMussels = s.mussels.map((m) => (m.id === mussel.id ? updatedMussel : m));
      const nextOrders = [...s.reInspectionOrders, ...newOrders];
      savePersisted({
        mussels: nextMussels,
        currentMusselId: s.currentMusselId,
        reInspectionOrders: nextOrders,
        currentOperatorId: s.currentOperatorId,
      });
      return { mussels: nextMussels, reInspectionOrders: nextOrders };
    });
  },

  updatePoint: (pointId, thickness) => {
    const state = get();
    const mussel = state.currentMussel();
    if (!mussel) return;

    const newPoints = mussel.points.map((p) => {
      if (p.id !== pointId) return p;
      const isThin = thickness < state.thinThreshold;
      return {
        ...p,
        thickness,
        isThin,
        batchId: isThin ? mussel.batchId : null,
        timestamp: Date.now(),
      };
    });
    const stats = calcStats(newPoints);
    const gradeResult = computeGrade(stats, state.requiredPoints, state.requiredQuadrants);

    const updatedMussel: Mussel = {
      ...mussel,
      points: newPoints,
      grade: gradeResult.grade,
      canGrade: gradeResult.canGrade,
      gradeReason: gradeResult.reason,
    };

    set((s) => {
      const nextMussels = s.mussels.map((m) => (m.id === mussel.id ? updatedMussel : m));
      savePersisted({
        mussels: nextMussels,
        currentMusselId: s.currentMusselId,
        reInspectionOrders: s.reInspectionOrders,
        currentOperatorId: s.currentOperatorId,
      });
      return { mussels: nextMussels };
    });
  },

  removePoint: (pointId) => {
    const state = get();
    const mussel = state.currentMussel();
    if (!mussel) return;

    const newPoints = mussel.points.filter((p) => p.id !== pointId);
    const stats = calcStats(newPoints);
    const gradeResult = computeGrade(stats, state.requiredPoints, state.requiredQuadrants);

    const updatedMussel: Mussel = {
      ...mussel,
      points: newPoints,
      grade: gradeResult.grade,
      canGrade: gradeResult.canGrade,
      gradeReason: gradeResult.reason,
    };

    set((s) => {
      const nextMussels = s.mussels.map((m) => (m.id === mussel.id ? updatedMussel : m));
      const nextOrders = s.reInspectionOrders.filter((o) => o.pointId !== pointId);
      savePersisted({
        mussels: nextMussels,
        currentMusselId: s.currentMusselId,
        reInspectionOrders: nextOrders,
        currentOperatorId: s.currentOperatorId,
      });
      return { mussels: nextMussels, reInspectionOrders: nextOrders };
    });
  },

  setEditingPoint: (id) => set({ editingPointId: id }),

  completeReInspection: (orderId, recheckValue, operatorId) => {
    const state = get();
    const order = state.reInspectionOrders.find((o) => o.id === orderId);
    if (!order) return;

    const operator = OPERATORS.find((o) => o.id === operatorId);
    if (!operator) return;

    const currentOp = state.currentOperator();
    if (operator.shift === currentOp.shift) return;

    const updatedOrder: ReInspectionOrder = {
      ...order,
      recheckValue,
      recheckOperator: operator.name,
      status: 'completed',
      completedAt: Date.now(),
    };

    const mussel = state.mussels.find((m) => m.id === order.musselId);
    let updatedMussels = state.mussels;
    if (mussel) {
      const newPoints = mussel.points.map((p) => {
        if (p.id !== order.pointId) return p;
        return {
          ...p,
          thickness: recheckValue,
          isThin: recheckValue < state.thinThreshold,
          isRechecked: true,
          recheckedBy: operator.name,
          recheckedAt: Date.now(),
        };
      });
      const stats = calcStats(newPoints);
      const gradeResult = computeGrade(stats, state.requiredPoints, state.requiredQuadrants);
      updatedMussels = updatedMussels.map((m) =>
        m.id === mussel.id
          ? { ...m, points: newPoints, grade: gradeResult.grade, canGrade: gradeResult.canGrade, gradeReason: gradeResult.reason }
          : m,
      );
    }

    set((s) => {
      const nextOrders = s.reInspectionOrders.map((o) => (o.id === orderId ? updatedOrder : o));
      savePersisted({
        mussels: updatedMussels,
        currentMusselId: s.currentMusselId,
        reInspectionOrders: nextOrders,
        currentOperatorId: s.currentOperatorId,
      });
      return { reInspectionOrders: nextOrders, mussels: updatedMussels };
    });
  },

  setOperator: (id) =>
    set((s) => {
      const next = { currentOperatorId: id };
      savePersisted({
        mussels: s.mussels,
        currentMusselId: s.currentMusselId,
        reInspectionOrders: s.reInspectionOrders,
        currentOperatorId: id,
      });
      return next;
    }),

  exportCertificate: () => {
    const state = get();
    const mussel = state.currentMussel();
    if (!mussel || mussel.points.length === 0) return null;
    return genCert(mussel, state.currentOperator().name);
  },

  resetAll: () => {
    set({
      mussels: [],
      currentMusselId: null,
      reInspectionOrders: [],
      editingPointId: null,
    });
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  },
}));
