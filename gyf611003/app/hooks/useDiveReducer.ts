import { useReducer, useRef, useEffect, useCallback } from "react";
import type { DiveState, DiveAction, DecompressionStep, DiveAlert } from "~/data/types";

const initialState: DiveState = {
  mode: "login",
  currentStepId: null,
  plan: null,
  alerts: [],
};

function unlockNextStep(steps: DecompressionStep[]): DecompressionStep[] {
  const sorted = [...steps].sort((a, b) => a.index - b.index);
  const idx = sorted.findIndex(s => s.status !== "completed" && s.status !== "skipped");
  if (idx > 0 && sorted[idx].status === "locked") {
    sorted[idx] = { ...sorted[idx], status: "unlocked" };
  }
  return steps.map(orig => {
    const updated = sorted.find(s => s.id === orig.id);
    return updated ?? orig;
  });
}

function allCompletedOrSkipped(steps: DecompressionStep[]) {
  return steps.every(s => s.status === "completed" || s.status === "skipped");
}

export function diveReducer(state: DiveState, action: DiveAction): DiveState {
  switch (action.type) {
    case "START_DIVE": {
      return {
        ...state,
        mode: "underway",
        plan: { ...action.plan, plannedStartTime: Date.now() },
        currentStepId: action.plan.steps.find(s => s.status === "unlocked")?.id ?? null,
        alerts: [],
      };
    }
    case "CHECKIN": {
      if (!state.plan) return state;
      const steps = state.plan.steps.map(s => {
        if (s.id !== action.stepId) return s;
        return {
          ...s,
          status: "arrived" as const,
          actualArrivalTime: action.time,
          gpsLat: action.lat,
          gpsLng: action.lng,
          startedAt: action.time,
        };
      });
      return {
        ...state,
        plan: { ...state.plan, steps },
        currentStepId: action.stepId,
      };
    }
    case "START_COUNTING": {
      if (!state.plan) return state;
      const steps = state.plan.steps.map(s =>
        s.id === action.stepId ? { ...s, status: "counting" as const } : s
      );
      return { ...state, plan: { ...state.plan, steps } };
    }
    case "DIVER_SIGN": {
      if (!state.plan) return state;
      const steps = state.plan.steps.map(s => {
        if (s.id !== action.stepId) return s;
        if (s.assignedDiverId !== action.diverId) return s;
        return {
          ...s,
          status: "diverSigned" as const,
          diverSignature: action.signature,
          diverSignTime: action.time,
        };
      });
      return { ...state, plan: { ...state.plan, steps } };
    }
    case "INSTRUCTOR_SIGN": {
      if (!state.plan) return state;
      let steps = state.plan.steps.map(s => {
        if (s.id !== action.stepId) return s;
        return {
          ...s,
          status: "completed" as const,
          instructorSignature: action.signature,
          instructorSignTime: action.time,
        };
      });
      steps = unlockNextStep(steps);
      const nextCurrent = steps.find(
        s => s.status !== "completed" && s.status !== "skipped"
      );
      return {
        ...state,
        plan: { ...state.plan, steps },
        currentStepId: nextCurrent?.id ?? state.currentStepId,
      };
    }
    case "UPDATE_DEVIATION": {
      if (!state.plan) return state;
      const steps = state.plan.steps.map(s =>
        s.id === action.stepId
          ? {
              ...s,
              deviationSeconds: action.seconds,
              hasAlert: s.hasAlert || action.seconds > 180,
            }
          : s
      );
      return { ...state, plan: { ...state.plan, steps } };
    }
    case "TRIGGER_ALERT": {
      const alert: DiveAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "deviation",
        stepId: action.stepId,
        message: action.message,
        createdAt: Date.now(),
        acknowledged: false,
      };
      return { ...state, alerts: [...state.alerts, alert] };
    }
    case "ACK_ALERT": {
      const alerts = state.alerts.map(a =>
        a.id === action.alertId ? { ...a, acknowledged: true } : a
      );
      return { ...state, alerts };
    }
    case "EMERGENCY_ASCENT": {
      if (!state.plan) return state;
      const steps = state.plan.steps.map(s =>
        s.status === "completed" || s.status === "skipped" ? s : { ...s, status: "skipped" as const }
      );
      const emergencyAlert: DiveAlert = {
        id: `alert_emg_${Date.now()}}`,
        type: "emergency",
        stepId: state.currentStepId ?? "",
        message: `紧急上升启动：${action.reason}`,
        createdAt: Date.now(),
        acknowledged: false,
      };
      return {
        ...state,
        mode: "emergency",
        emergencyReason: action.reason,
        plan: { ...state.plan, steps },
        alerts: [...state.alerts, emergencyAlert],
      };
    }
    case "CONFIRM_SURFACE": {
      const canSurface = state.plan && allCompletedOrSkipped(state.plan.steps);
      if (!state.plan || !canSurface) return state;
      return {
        ...state,
        mode: "completed",
        surfacedAt: action.time,
        tokenId: action.tokenId,
      };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const STORAGE_KEY = "dive_checkstation_state_v1";

export function useDiveReducer(initialFromLoader?: Partial<DiveState>) {
  const [state, dispatch] = useReducer(diveReducer, {
    ...initialState,
    ...(initialFromLoader ?? {}),
  });

  useEffect(() => {
    if (typeof window !== "undefined" && state.mode !== "login") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const reset = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "RESET" });
  }, []);

  return { state, dispatch, reset };
}
