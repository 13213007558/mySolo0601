import { create } from 'zustand';
import { UserPreferences } from '../types';

const PREF_KEY = 'msl_user_prefs_v1';

const loadPrefs = (): UserPreferences => {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    lowBlueMode: false,
    lowBlueIntensity: 40,
    snapTo15: true,
    operatorId: '修复师-001',
    showGrid: true,
  };
};

export const usePreferences = create<UserPreferences & {
  set: (patch: Partial<UserPreferences>) => void;
}>((set, get) => ({
  ...loadPrefs(),
  set: (patch) => {
    const next = { ...get(), ...patch };
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    set(next);
  },
}));
