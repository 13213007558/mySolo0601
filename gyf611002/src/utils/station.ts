import type { WearLevel } from '../types';

export const r1 = (n: number) => Math.round(n * 10) / 10;

export const DIFF_THRESHOLD = 5;

export function diffAngle(cur: number, prev: number): number {
  return r1(Math.abs(cur - prev));
}

export function isOverLimit(curL: number, prevL: number, curR: number, prevR: number): boolean {
  return diffAngle(curL, prevL) > DIFF_THRESHOLD || diffAngle(curR, prevR) > DIFF_THRESHOLD;
}

export const SESSION_STORAGE_KEYS = {
  auth: 'blade-station.auth',
  checks: 'blade-station.checks',
  calibration: 'blade-station.calibration',
  lock: 'blade-station.lock'
};

export interface AuthSession {
  userId: string;
  username: string;
  displayName: string;
  role: 'checker' | 'coach';
  loginAt: string;
}

export function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEYS.auth);
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthSession;
    return s?.role ? s : null;
  } catch { return null; }
}

export function writeSession(s: AuthSession) {
  localStorage.setItem(SESSION_STORAGE_KEYS.auth, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEYS.auth);
}

export function formatCountdown(targetISO: string): {
  totalMs: number; h: number; m: number; s: number; text: string; inLockWindow: boolean; locked: boolean;
} {
  const total = +new Date(targetISO) - Date.now();
  const clamped = Math.max(0, total);
  const h = Math.floor(clamped / 3600000);
  const m = Math.floor((clamped % 3600000) / 60000);
  const s = Math.floor((clamped % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const inLockWindow = total > 0 && total <= 30 * 60000;
  const locked = total <= 0;
  return { totalMs: total, h, m, s, text: `${pad(h)}:${pad(m)}:${pad(s)}`, inLockWindow, locked };
}

export function computeLineAngle(p1: [number, number], p2: [number, number]): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  if (dx === 0) return 90;
  return r1(Math.abs(Math.atan2(dy, dx) * 180 / Math.PI));
}

export const WEAR_ORDER: WearLevel[] = ['normal', 'mild', 'moderate', 'severe'];

export function wearBadgeColor(w: WearLevel) {
  switch (w) {
    case 'normal':   return { bg: 'bg-emerald-500/20', border: 'border-emerald-400/40', text: 'text-emerald-300' };
    case 'mild':     return { bg: 'bg-sky-500/20',     border: 'border-sky-400/40',     text: 'text-sky-300' };
    case 'moderate': return { bg: 'bg-amber-500/20',   border: 'border-amber-400/50',   text: 'text-amber-300' };
    case 'severe':   return { bg: 'bg-rose-500/25',    border: 'border-rose-400/60',     text: 'text-rose-300' };
  }
}

export function flagFromCountry(c: string) {
  return c;
}
