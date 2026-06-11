import { create } from 'zustand';
import type { BladeCheck, WearLevel } from '../types';
import { INITIAL_CHECKS, CURRENT_SESSION_ID, CURRENT_EVENT_ID, lastCheckFor } from '../data/checks';
import { ATHLETES, ATHLETES_BY_QR } from '../data/athletes';
import { r1, DIFF_THRESHOLD, diffAngle } from '../utils/station';

export interface RosterRow {
  athleteId: string;
  athleteName: string;
  country: string;
  flag: string;
  isuId: string;
  bladeQr: string;
  lastCheck: BladeCheck | null;
  currentCheck: BladeCheck | null;
  overLimit: boolean;
  pending: boolean;
}

export interface CaptureState {
  selectedAthleteId: string | null;
  angleLeft: number;
  angleRight: number;
  wear: WearLevel;
  anchor1: [number, number];
  anchor2: [number, number];
  calibrated: boolean;
  isLive: boolean;
  error: string | null;
  pendingPostpone: boolean;
}

interface Store {
  readonly sessionId: string;
  readonly eventId: string;
  checks: BladeCheck[];
  roster: RosterRow[];
  capture: CaptureState;
  init: () => void;
  selectAthlete: (id: string) => void;
  setAngles: (l: number, r: number) => void;
  setWear: (w: WearLevel) => void;
  setAnchors: (a1: [number, number], a2: [number, number]) => void;
  setCaptureLive: (on: boolean) => void;
  submitCapture: () => { ok: boolean; reason?: string };
  togglePostpone: (athleteId: string) => void;
  togglePendingPostpone: () => void;
  removeCurrentCheck: (athleteId: string) => void;
  setCalibrated: (ok: boolean) => void;
  isOverLimitFor: (curL: number, curR: number, prev: BladeCheck | null) => boolean;
  postponeActiveFor: (athleteId: string, pendingOverLimit: boolean) => boolean;
}

function buildInitialRoster(checks: BladeCheck[]): RosterRow[] {
  const session = CURRENT_SESSION_ID;
  return ATHLETES.map(a => {
    const cur = checks.find(c => c.athleteId === a.id && c.sessionId === session) || null;
    const prev = lastCheckFor(a.id, session, checks) || null;
    return {
      athleteId: a.id,
      athleteName: a.name,
      country: a.country,
      flag: a.flag,
      isuId: a.isuId,
      bladeQr: a.bladeQr,
      lastCheck: prev,
      currentCheck: cur,
      overLimit: !!(cur && prev && (diffAngle(cur.angleLeft, prev.angleLeft) > DIFF_THRESHOLD || diffAngle(cur.angleRight, prev.angleRight) > DIFF_THRESHOLD)),
      pending: !cur
    };
  });
}

export const useStationStore = create<Store>((set, get) => ({
  sessionId: CURRENT_SESSION_ID,
  eventId: CURRENT_EVENT_ID,
  checks: INITIAL_CHECKS,
  roster: buildInitialRoster(INITIAL_CHECKS),
  capture: {
    selectedAthleteId: null,
    angleLeft: 89.0,
    angleRight: 88.5,
    wear: 'normal',
    anchor1: [60, 340],
    anchor2: [580, 300],
    calibrated: false,
    isLive: false,
    error: null,
    pendingPostpone: false
  },

  init() {
    try {
      const raw = localStorage.getItem('blade-station.checks');
      if (raw) {
        const saved = JSON.parse(raw) as BladeCheck[];
        const merged = [
          ...INITIAL_CHECKS.filter(c => c.sessionId !== CURRENT_SESSION_ID),
          ...saved.filter(c => c.sessionId === CURRENT_SESSION_ID)
        ];
        set({ checks: merged, roster: buildInitialRoster(merged) });
      }
      const cal = localStorage.getItem('blade-station.calibration');
      if (cal) {
        set(state => ({ capture: { ...state.capture, calibrated: true } }));
      }
    } catch {}
  },

  selectAthlete(id) {
    set(state => {
      const row = state.roster.find(r => r.athleteId === id);
      const prev = row?.lastCheck;
      return {
        capture: {
          ...state.capture,
          selectedAthleteId: id,
          angleLeft: r1(prev ? prev.angleLeft + (Math.random() - 0.5) * 1.2 : 88.5 + Math.random()),
          angleRight: r1(prev ? prev.angleRight + (Math.random() - 0.5) * 1.2 : 88.0 + Math.random()),
          wear: prev?.wear || 'normal',
          pendingPostpone: row?.currentCheck?.postponeTag || false,
          error: null
        }
      };
    });
  },

  setAngles(l, r) {
    set(state => ({ capture: { ...state.capture, angleLeft: r1(l), angleRight: r1(r) } }));
  },

  setWear(w) { set(state => ({ capture: { ...state.capture, wear: w } })); },

  setAnchors(a1, a2) { set(state => ({ capture: { ...state.capture, anchor1: a1, anchor2: a2 } })); },

  setCaptureLive(on) { set(state => ({ capture: { ...state.capture, isLive: on } })); },

  setCalibrated(ok) { set(state => ({ capture: { ...state.capture, calibrated: ok } })); },

  isOverLimitFor(curL, curR, prev) {
    if (!prev) return false;
    return diffAngle(curL, prev.angleLeft) > DIFF_THRESHOLD || diffAngle(curR, prev.angleRight) > DIFF_THRESHOLD;
  },

  postponeActiveFor(athleteId, pendingOverLimit) {
    const s = get();
    const row = s.roster.find(r => r.athleteId === athleteId);
    if (!row) return false;
    if (row.currentCheck) return !!row.currentCheck.postponeTag;
    return pendingOverLimit && s.capture.pendingPostpone;
  },

  submitCapture() {
    const s = get();
    const { capture, checks, roster } = s;
    if (!capture.selectedAthleteId) return { ok: false, reason: '未选中运动员' };
    const row = roster.find(r => r.athleteId === capture.selectedAthleteId)!;
    const overLimit = s.isOverLimitFor(capture.angleLeft, capture.angleRight, row.lastCheck);

    const postponeTag = row.currentCheck
      ? !!row.currentCheck.postponeTag
      : (overLimit ? capture.pendingPostpone : false);

    if (overLimit && !postponeTag) {
      return { ok: false, reason: '刃角差值超限，请教练先勾选「暂缓参赛」标签' };
    }

    const auth = JSON.parse(localStorage.getItem('blade-station.auth') || '{}');
    const newCheck: BladeCheck = {
      id: `c-${row.athleteId}-${Date.now()}`,
      athleteId: row.athleteId,
      bladeQr: row.bladeQr,
      eventId: s.eventId,
      sessionId: s.sessionId,
      angleLeft: capture.angleLeft,
      angleRight: capture.angleRight,
      wear: capture.wear,
      checkerId: auth.userId || 'u-checker-01',
      checkedAt: new Date().toISOString(),
      postponeTag,
      difference: row.lastCheck ? {
        left: diffAngle(capture.angleLeft, row.lastCheck.angleLeft),
        right: diffAngle(capture.angleRight, row.lastCheck.angleRight)
      } : undefined
    };
    const others = checks.filter(c => !(c.athleteId === row.athleteId && c.sessionId === s.sessionId));
    const nextChecks = [...others, newCheck];
    localStorage.setItem('blade-station.checks', JSON.stringify(nextChecks.filter(c => c.sessionId === s.sessionId)));
    set({
      checks: nextChecks,
      roster: buildInitialRoster(nextChecks),
      capture: { ...capture, selectedAthleteId: null, pendingPostpone: false }
    });
    return { ok: true };
  },

  togglePostpone(athleteId) {
    const s = get();
    const roster = s.roster.map(r => {
      if (r.athleteId !== athleteId) return r;
      const cc = r.currentCheck ? { ...r.currentCheck, postponeTag: !r.currentCheck.postponeTag } : null;
      return { ...r, currentCheck: cc };
    });
    const checks = s.checks.map(c =>
      c.athleteId === athleteId && c.sessionId === s.sessionId
        ? { ...c, postponeTag: !c.postponeTag }
        : c
    );
    localStorage.setItem('blade-station.checks', JSON.stringify(checks.filter(c => c.sessionId === s.sessionId)));
    set({ roster, checks });
  },

  togglePendingPostpone() {
    set(state => ({ capture: { ...state.capture, pendingPostpone: !state.capture.pendingPostpone } }));
  },

  removeCurrentCheck(athleteId) {
    const s = get();
    const checks = s.checks.filter(c => !(c.athleteId === athleteId && c.sessionId === s.sessionId));
    localStorage.setItem('blade-station.checks', JSON.stringify(checks.filter(c => c.sessionId === s.sessionId)));
    set({ checks, roster: buildInitialRoster(checks) });
  }
}));

export function athleteFromQR(qr: string) { return ATHLETES_BY_QR[qr] || null; }
