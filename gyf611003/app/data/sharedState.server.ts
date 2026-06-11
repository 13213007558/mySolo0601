import type { DiveState } from "~/data/types";

let globalDiveState: DiveState = {
  mode: "login",
  currentStepId: null,
  plan: null,
  alerts: [],
};

let lastUpdatedAt = 0;

export function getSharedDiveState(): DiveState {
  return globalDiveState;
}

export function setSharedDiveState(state: DiveState): void {
  globalDiveState = state;
  lastUpdatedAt = Date.now();
}

export function getLastUpdatedAt(): number {
  return lastUpdatedAt;
}

export function resetSharedDiveState(): void {
  globalDiveState = {
    mode: "login",
    currentStepId: null,
    plan: null,
    alerts: [],
  };
  lastUpdatedAt = Date.now();
}
