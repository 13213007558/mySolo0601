import type { AppState, JudgeWineState, ScoreBreakdown, AppView, PinModalContext } from './types.js';
import type { StoreListener } from './types.js';
export declare class Store {
    private state;
    private listeners;
    constructor();
    getState(): AppState;
    subscribe(listener: StoreListener): () => void;
    private notify;
    private setState;
    private addAudit;
    private writeAudit;
    setView(view: AppView): void;
    setActiveJudge(judgeId: string): void;
    setBigscreenJudge(judgeId: string | null): void;
    activateWine(judgeId: string, blindId: string): boolean;
    recordSpit(judgeId: string, blindId: string): void;
    private getNextUnlockedWine;
    submitScore(judgeId: string, blindId: string, score: ScoreBreakdown): boolean;
    requestUnlock(judgeId: string, blindId: string, reason: string, onSuccess: () => void): void;
    closePinModal(): void;
    supervisorUnlock(supervisorId: string, judgeId: string, blindId: string, reason: string): boolean;
    openPinModalForContext(ctx: PinModalContext): void;
    getWineByBlindId(blindId: string): import("./types.js").Wine | null;
    getJudgeWineState(judgeId: string, blindId: string): JudgeWineState | null;
    computeScores(judgeId: string): {
        completed: number;
        totalWines: number;
        avgScore: number;
        totalSips: number;
    };
}
export declare const store: Store;
