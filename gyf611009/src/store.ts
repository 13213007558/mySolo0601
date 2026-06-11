import type {
  AppState,
  Judge,
  JudgeWineState,
  SpitRecord,
  ScoreBreakdown,
  AuditLogEntry,
  AuditAction,
  AppView,
  PinModalContext,
  SpittoonSensor,
} from './types.js';
import type { StoreListener } from './types.js';
import { DEFAULT_CONFIG } from './config.js';

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createJudgeWineState(blindId: string): JudgeWineState {
  return {
    blindId,
    status: 'pending',
    sipCount: 0,
    score: null,
    totalScore: null,
    lockedAt: null,
    unlockedBySupervisor: false,
    spitRecords: [],
  };
}

function createInitialState(): AppState {
  const judges = new Map<string, Judge>();
  const sensors = new Map<string, SpittoonSensor>();

  for (const cfg of DEFAULT_CONFIG.judges) {
    const wines = new Map<string, JudgeWineState>();
    for (const w of DEFAULT_CONFIG.wines) {
      wines.set(w.blindId, createJudgeWineState(w.blindId));
    }
    const firstBlindId = DEFAULT_CONFIG.wines[0]?.blindId ?? null;
    if (firstBlindId) {
      const first = wines.get(firstBlindId);
      if (first) first.status = 'active';
    }
    judges.set(cfg.id, {
      ...cfg,
      currentBlindId: firstBlindId,
      wines,
    });
    sensors.set(cfg.id, {
      id: `sen_${cfg.id}`,
      judgeId: cfg.id,
      currentLevel: 0,
      lastReading: Date.now(),
    });
  }

  return {
    config: DEFAULT_CONFIG,
    judges,
    auditLog: [],
    sensors,
    currentView: 'judge',
    activeJudgeId: DEFAULT_CONFIG.judges[0]?.id ?? null,
    pinModalOpen: false,
    pinModalContext: null,
    bigscreenJudgeId: null,
  };
}

export class Store {
  private state: AppState;
  private listeners: Set<StoreListener> = new Set();

  constructor() {
    this.state = createInitialState();
  }

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) l(this.state);
  }

  private setState(updater: (s: AppState) => AppState): void {
    this.state = updater(this.state);
    this.notify();
  }

  private addAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    this.state.auditLog.push({
      ...entry,
      id: uid('audit'),
      timestamp: Date.now(),
    });
  }

  private writeAudit(
    action: AuditAction,
    opts: {
      judgeId?: string | null;
      supervisorId?: string | null;
      blindId?: string | null;
      detail?: string;
    } = {},
  ): void {
    this.addAudit({
      action,
      judgeId: opts.judgeId ?? null,
      supervisorId: opts.supervisorId ?? null,
      blindId: opts.blindId ?? null,
      detail: opts.detail ?? '',
    });
  }

  setView(view: AppView): void {
    this.setState((s) => ({ ...s, currentView: view }));
  }

  setActiveJudge(judgeId: string): void {
    this.setState((s) => ({ ...s, activeJudgeId: judgeId }));
  }

  setBigscreenJudge(judgeId: string | null): void {
    this.setState((s) => ({ ...s, bigscreenJudgeId: judgeId }));
  }

  activateWine(judgeId: string, blindId: string): boolean {
    const judge = this.state.judges.get(judgeId);
    if (!judge) return false;
    const target = judge.wines.get(blindId);
    if (!target) return false;

    const wasActive = target.status === 'active';
    const willActivate = target.status === 'pending';

    this.setState((s) => {
      const j = s.judges.get(judgeId);
      if (!j) return s;
      const newWines = new Map(j.wines);
      for (const [bid, ws] of newWines) {
        if (ws.status === 'active') {
          newWines.set(bid, { ...ws, status: 'pending' });
        }
      }
      const tgt = newWines.get(blindId);
      if (tgt && tgt.status === 'pending') {
        newWines.set(blindId, { ...tgt, status: 'active' });
      }
      const newJudge: Judge = { ...j, wines: newWines, currentBlindId: blindId };
      const newJudges = new Map(s.judges);
      newJudges.set(judgeId, newJudge);
      return { ...s, judges: newJudges };
    });

    if (willActivate && !wasActive) {
      this.writeAudit('WINE_ACTIVATED', { judgeId, blindId, detail: `激活酒款 ${blindId}` });
    }
    return true;
  }

  recordSpit(judgeId: string, blindId: string): void {
    const judge = this.state.judges.get(judgeId);
    if (!judge) return;
    const ws = judge.wines.get(blindId);
    if (!ws || ws.status === 'locked') return;

    const nextSip = ws.sipCount + 1;
    const sipLimit = this.state.config.sipLimitPerWine;
    const willLock = nextSip >= sipLimit;

    let sensorDelta: number | null = null;
    if (this.state.config.sensorEnabled) {
      sensorDelta = 15 + Math.random() * 10;
      const sensor = this.state.sensors.get(judgeId);
      if (sensor) {
        this.state.sensors.set(judgeId, {
          ...sensor,
          currentLevel: sensor.currentLevel + sensorDelta,
          lastReading: Date.now(),
        });
      }
    }

    const record: SpitRecord = {
      id: uid('spit'),
      timestamp: Date.now(),
      judgeId,
      blindId,
      sipNumber: nextSip,
      sensorLevelDelta: sensorDelta,
    };

    this.setState((s) => {
      const j = s.judges.get(judgeId);
      if (!j) return s;
      const newWines = new Map(j.wines);
      const target = newWines.get(blindId);
      if (!target) return s;

      const newRecords = [...target.spitRecords, record];
      let newStatus = target.status;
      let lockedAt: number | null = target.lockedAt;
      if (willLock) {
        newStatus = 'locked';
        lockedAt = Date.now();
      }

      newWines.set(blindId, {
        ...target,
        sipCount: nextSip,
        status: newStatus,
        lockedAt,
        spitRecords: newRecords,
      });

      const newJudge: Judge = { ...j, wines: newWines };
      const newJudges = new Map(s.judges);
      newJudges.set(judgeId, newJudge);
      return { ...s, judges: newJudges };
    });

    this.writeAudit('SPIT_RECORDED', {
      judgeId,
      blindId,
      detail: `第 ${nextSip} 口吐酒${willLock ? '（达到上限，自动锁定）' : ''}`,
    });

    if (willLock) {
      this.writeAudit('WINE_LOCKED_AUTO', {
        judgeId,
        blindId,
        detail: `达到 ${sipLimit} 口上限，系统自动锁定评分`,
      });
    }
  }

  reportSipExceeded(judgeId: string, blindId: string): void {
    const judge = this.state.judges.get(judgeId);
    if (!judge) return;
    const ws = judge.wines.get(blindId);
    if (!ws || ws.status !== 'locked') return;

    const sipLimit = this.state.config.sipLimitPerWine;
    const attemptSip = ws.sipCount + 1;

    this.writeAudit('SIP_LIMIT_EXCEEDED', {
      judgeId,
      blindId,
      detail: `评委尝试第 ${attemptSip} 口，超出赛规上限 ${sipLimit} 口，触发监审 PIN`,
    });

    this.requestUnlock(
      judgeId,
      blindId,
      `异常口数告警：第 ${attemptSip} 口超出赛规上限 ${sipLimit} 口`,
      () => {},
    );
  }

  private getNextUnlockedWine(judgeId: string): string | null {
    const judge = this.state.judges.get(judgeId);
    if (!judge) return null;
    for (const w of this.state.config.wines) {
      const ws = judge.wines.get(w.blindId);
      if (ws && ws.status !== 'locked' && ws.blindId !== judge.currentBlindId) {
        return w.blindId;
      }
    }
    return null;
  }

  submitScore(judgeId: string, blindId: string, score: ScoreBreakdown): boolean {
    const judge = this.state.judges.get(judgeId);
    if (!judge) return false;
    const ws = judge.wines.get(blindId);
    if (!ws || ws.status !== 'locked') return false;
    if (ws.totalScore !== null) return false;

    const total = score.appearance + score.aroma + score.taste + score.finish;

    this.setState((s) => {
      const j = s.judges.get(judgeId);
      if (!j) return s;
      const newWines = new Map(j.wines);
      const target = newWines.get(blindId);
      if (!target) return s;
      newWines.set(blindId, {
        ...target,
        score,
        totalScore: total,
      });
      const newJudge: Judge = { ...j, wines: newWines };
      const newJudges = new Map(s.judges);
      newJudges.set(judgeId, newJudge);
      return { ...s, judges: newJudges };
    });

    this.writeAudit('SCORE_SUBMITTED', {
      judgeId,
      blindId,
      detail: `提交评分：外观${score.appearance}/香气${score.aroma}/口感${score.taste}/余韵${score.finish}，总分 ${total}`,
    });

    const nextWine = this.getNextUnlockedWine(judgeId);
    if (nextWine) {
      setTimeout(() => this.activateWine(judgeId, nextWine), 500);
    }
    return true;
  }

  requestUnlock(judgeId: string, blindId: string, reason: string, onSuccess: () => void): void {
    this.setState((s) => ({
      ...s,
      pinModalOpen: true,
      pinModalContext: { judgeId, blindId, reason, onSuccess },
    }));
  }

  closePinModal(): void {
    this.setState((s) => ({ ...s, pinModalOpen: false, pinModalContext: null }));
  }

  supervisorUnlock(
    supervisorId: string,
    judgeId: string,
    blindId: string,
    reason: string,
  ): boolean {
    const judge = this.state.judges.get(judgeId);
    if (!judge) return false;
    const ws = judge.wines.get(blindId);
    if (!ws || ws.status !== 'locked') return false;

    this.setState((s) => {
      const j = s.judges.get(judgeId);
      if (!j) return s;
      const newWines = new Map(j.wines);
      const target = newWines.get(blindId);
      if (!target) return s;
      newWines.set(blindId, {
        ...target,
        status: 'active',
        lockedAt: null,
        unlockedBySupervisor: true,
      });
      const newJudge: Judge = { ...j, wines: newWines, currentBlindId: blindId };
      const newJudges = new Map(s.judges);
      newJudges.set(judgeId, newJudge);
      return { ...s, judges: newJudges };
    });

    this.writeAudit('SUPERVISOR_UNLOCK', {
      judgeId,
      supervisorId,
      blindId,
      detail: reason || '监审人工解锁',
    });
    return true;
  }

  openPinModalForContext(ctx: PinModalContext): void {
    this.setState((s) => ({ ...s, pinModalOpen: true, pinModalContext: ctx }));
  }

  getWineByBlindId(blindId: string) {
    return this.state.config.wines.find((w) => w.blindId === blindId) ?? null;
  }

  getJudgeWineState(judgeId: string, blindId: string): JudgeWineState | null {
    return this.state.judges.get(judgeId)?.wines.get(blindId) ?? null;
  }

  computeScores(judgeId: string): {
    completed: number;
    totalWines: number;
    avgScore: number;
    totalSips: number;
  } {
    const judge = this.state.judges.get(judgeId);
    if (!judge) return { completed: 0, totalWines: 0, avgScore: 0, totalSips: 0 };
    let completed = 0;
    let total = 0;
    let sips = 0;
    for (const ws of judge.wines.values()) {
      sips += ws.sipCount;
      if (ws.totalScore !== null) {
        completed++;
        total += ws.totalScore;
      }
    }
    return {
      completed,
      totalWines: judge.wines.size,
      avgScore: completed > 0 ? total / completed : 0,
      totalSips: sips,
    };
  }
}

export const store = new Store();
