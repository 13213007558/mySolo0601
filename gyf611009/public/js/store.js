import { DEFAULT_CONFIG } from './config.js';
function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function createJudgeWineState(blindId) {
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
function createInitialState() {
    const judges = new Map();
    const sensors = new Map();
    for (const cfg of DEFAULT_CONFIG.judges) {
        const wines = new Map();
        for (const w of DEFAULT_CONFIG.wines) {
            wines.set(w.blindId, createJudgeWineState(w.blindId));
        }
        const firstBlindId = DEFAULT_CONFIG.wines[0]?.blindId ?? null;
        if (firstBlindId) {
            const first = wines.get(firstBlindId);
            if (first)
                first.status = 'active';
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
    state;
    listeners = new Set();
    constructor() {
        this.state = createInitialState();
    }
    getState() {
        return this.state;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notify() {
        for (const l of this.listeners)
            l(this.state);
    }
    setState(updater) {
        this.state = updater(this.state);
        this.notify();
    }
    addAudit(entry) {
        this.state.auditLog.push({
            ...entry,
            id: uid('audit'),
            timestamp: Date.now(),
        });
    }
    writeAudit(action, opts = {}) {
        this.addAudit({
            action,
            judgeId: opts.judgeId ?? null,
            supervisorId: opts.supervisorId ?? null,
            blindId: opts.blindId ?? null,
            detail: opts.detail ?? '',
        });
    }
    setView(view) {
        this.setState((s) => ({ ...s, currentView: view }));
    }
    setActiveJudge(judgeId) {
        this.setState((s) => ({ ...s, activeJudgeId: judgeId }));
    }
    setBigscreenJudge(judgeId) {
        this.setState((s) => ({ ...s, bigscreenJudgeId: judgeId }));
    }
    activateWine(judgeId, blindId) {
        const judge = this.state.judges.get(judgeId);
        if (!judge)
            return false;
        const target = judge.wines.get(blindId);
        if (!target)
            return false;
        if (target.status === 'locked')
            return false;
        this.setState((s) => {
            const j = s.judges.get(judgeId);
            if (!j)
                return s;
            const newWines = new Map(j.wines);
            for (const [bid, ws] of newWines) {
                if (ws.status === 'active') {
                    newWines.set(bid, { ...ws, status: 'pending' });
                }
            }
            const tgt = newWines.get(blindId);
            if (tgt && tgt.status !== 'locked') {
                newWines.set(blindId, { ...tgt, status: 'active' });
            }
            const newJudge = { ...j, wines: newWines, currentBlindId: blindId };
            const newJudges = new Map(s.judges);
            newJudges.set(judgeId, newJudge);
            return { ...s, judges: newJudges };
        });
        this.writeAudit('WINE_ACTIVATED', { judgeId, blindId, detail: `激活酒款 ${blindId}` });
        return true;
    }
    recordSpit(judgeId, blindId) {
        const judge = this.state.judges.get(judgeId);
        if (!judge)
            return;
        const ws = judge.wines.get(blindId);
        if (!ws || ws.status === 'locked')
            return;
        const nextSip = ws.sipCount + 1;
        const sipLimit = this.state.config.sipLimitPerWine;
        const willLock = nextSip >= sipLimit;
        let sensorDelta = null;
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
        const record = {
            id: uid('spit'),
            timestamp: Date.now(),
            judgeId,
            blindId,
            sipNumber: nextSip,
            sensorLevelDelta: sensorDelta,
        };
        this.setState((s) => {
            const j = s.judges.get(judgeId);
            if (!j)
                return s;
            const newWines = new Map(j.wines);
            const target = newWines.get(blindId);
            if (!target)
                return s;
            const newRecords = [...target.spitRecords, record];
            let newStatus = target.status;
            let lockedAt = target.lockedAt;
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
            const newJudge = { ...j, wines: newWines };
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
        if (willLock) {
            const remaining = this.getNextUnlockedWine(judgeId);
            if (remaining) {
                setTimeout(() => this.activateWine(judgeId, remaining), 600);
            }
        }
    }
    getNextUnlockedWine(judgeId) {
        const judge = this.state.judges.get(judgeId);
        if (!judge)
            return null;
        for (const w of this.state.config.wines) {
            const ws = judge.wines.get(w.blindId);
            if (ws && ws.status !== 'locked' && ws.blindId !== judge.currentBlindId) {
                return w.blindId;
            }
        }
        return null;
    }
    submitScore(judgeId, blindId, score) {
        const judge = this.state.judges.get(judgeId);
        if (!judge)
            return false;
        const ws = judge.wines.get(blindId);
        if (!ws || ws.status !== 'locked')
            return false;
        if (ws.totalScore !== null)
            return false;
        const total = score.appearance + score.aroma + score.taste + score.finish;
        this.setState((s) => {
            const j = s.judges.get(judgeId);
            if (!j)
                return s;
            const newWines = new Map(j.wines);
            const target = newWines.get(blindId);
            if (!target)
                return s;
            newWines.set(blindId, {
                ...target,
                score,
                totalScore: total,
            });
            const newJudge = { ...j, wines: newWines };
            const newJudges = new Map(s.judges);
            newJudges.set(judgeId, newJudge);
            return { ...s, judges: newJudges };
        });
        this.writeAudit('SCORE_SUBMITTED', {
            judgeId,
            blindId,
            detail: `提交评分：外观${score.appearance}/香气${score.aroma}/口感${score.taste}/余韵${score.finish}，总分 ${total}`,
        });
        return true;
    }
    requestUnlock(judgeId, blindId, reason, onSuccess) {
        this.setState((s) => ({
            ...s,
            pinModalOpen: true,
            pinModalContext: { judgeId, blindId, reason, onSuccess },
        }));
    }
    closePinModal() {
        this.setState((s) => ({ ...s, pinModalOpen: false, pinModalContext: null }));
    }
    supervisorUnlock(supervisorId, judgeId, blindId, reason) {
        const judge = this.state.judges.get(judgeId);
        if (!judge)
            return false;
        const ws = judge.wines.get(blindId);
        if (!ws || ws.status !== 'locked')
            return false;
        this.setState((s) => {
            const j = s.judges.get(judgeId);
            if (!j)
                return s;
            const newWines = new Map(j.wines);
            const target = newWines.get(blindId);
            if (!target)
                return s;
            newWines.set(blindId, {
                ...target,
                status: 'active',
                lockedAt: null,
                unlockedBySupervisor: true,
            });
            const newJudge = { ...j, wines: newWines, currentBlindId: blindId };
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
    openPinModalForContext(ctx) {
        this.setState((s) => ({ ...s, pinModalOpen: true, pinModalContext: ctx }));
    }
    getWineByBlindId(blindId) {
        return this.state.config.wines.find((w) => w.blindId === blindId) ?? null;
    }
    getJudgeWineState(judgeId, blindId) {
        return this.state.judges.get(judgeId)?.wines.get(blindId) ?? null;
    }
    computeScores(judgeId) {
        const judge = this.state.judges.get(judgeId);
        if (!judge)
            return { completed: 0, totalWines: 0, avgScore: 0, totalSips: 0 };
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
//# sourceMappingURL=store.js.map