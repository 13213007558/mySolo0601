export interface Fencer {
    id: string;
    name: string;
    country?: string;
    score: number;
    redCards: number;
    yellowCards: number;
    blackCard: boolean;
    priority?: boolean;
}
export interface TouchRecord {
    id: string;
    timestamp: number;
    fencerId: 'left' | 'right';
    type: 'valid' | 'off-target' | 'simultaneous' | 'no-touch';
    lightColor: 'green' | 'red' | 'white' | 'none';
    modified?: boolean;
    modifiedBy?: string[];
    note?: string;
}
export interface CardRecord {
    id: string;
    timestamp: number;
    fencerId: 'left' | 'right';
    type: 'yellow' | 'red' | 'black';
    reason?: string;
}
export interface BoutConfig {
    id: string;
    competitionName: string;
    event: string;
    round: string;
    stripNumber: number;
    targetScore: number;
    periodDuration: number;
    breakDuration: number;
    leftFencer: Fencer;
    rightFencer: Fencer;
    referee1Name: string;
    referee2Name: string;
}
export interface BoutState {
    config: BoutConfig;
    currentPeriod: number;
    periodTimeRemaining: number;
    breakTimeRemaining: number;
    isBreak: boolean;
    isPaused: boolean;
    isControversy: boolean;
    isSealed: boolean;
    touches: TouchRecord[];
    cards: CardRecord[];
    startedAt?: number;
    endedAt?: number;
    sealedAt?: number;
    annotations: {
        touchId: string;
        text: string;
        by: string;
        at: number;
    }[];
}
export type KeyboardAction = 'LEFT_VALID' | 'RIGHT_VALID' | 'LEFT_OFFTARGET' | 'RIGHT_OFFTARGET' | 'SIMULTANEOUS' | 'NO_TOUCH' | 'LEFT_YELLOW' | 'RIGHT_YELLOW' | 'LEFT_RED' | 'RIGHT_RED' | 'LEFT_BLACK' | 'RIGHT_BLACK' | 'UNDO_LAST' | 'PAUSE_PERIOD' | 'START_BREAK' | 'CONTROVERSY_TOGGLE' | 'REQUEST_SCORE_EDIT' | 'SEAL_BOUT';
export interface KeyboardMapping {
    [key: string]: KeyboardAction;
}
export declare const DEFAULT_KEYBOARD_MAP: KeyboardMapping;
