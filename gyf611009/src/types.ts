export type WineStatus = 'pending' | 'active' | 'locked';

export type AuditAction =
  | 'SPIT_RECORDED'
  | 'SCORE_SUBMITTED'
  | 'WINE_LOCKED_AUTO'
  | 'SUPERVISOR_UNLOCK'
  | 'SIP_LIMIT_EXCEEDED'
  | 'SENSOR_MISMATCH'
  | 'SENSOR_VERIFIED'
  | 'JUDGE_LOGIN'
  | 'WINE_ACTIVATED';

export interface Wine {
  readonly blindId: string;
  readonly realName: string;
  readonly realProducer: string;
  readonly realVintage: number;
  readonly sipLimit: number;
}

export interface ScoreBreakdown {
  appearance: number;
  aroma: number;
  taste: number;
  finish: number;
}

export interface SpitRecord {
  readonly id: string;
  readonly timestamp: number;
  readonly judgeId: string;
  readonly blindId: string;
  readonly sipNumber: number;
  readonly sensorLevelDelta: number | null;
}

export interface JudgeWineState {
  readonly blindId: string;
  status: WineStatus;
  sipCount: number;
  score: ScoreBreakdown | null;
  totalScore: number | null;
  lockedAt: number | null;
  unlockedBySupervisor: boolean;
  readonly spitRecords: SpitRecord[];
}

export interface Judge {
  readonly id: string;
  readonly name: string;
  readonly seatNumber: number;
  readonly currentBlindId: string | null;
  readonly wines: ReadonlyMap<string, JudgeWineState>;
}

export interface AuditLogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly action: AuditAction;
  readonly judgeId: string | null;
  readonly supervisorId: string | null;
  readonly blindId: string | null;
  readonly detail: string;
}

export interface Supervisor {
  readonly id: string;
  readonly name: string;
  readonly pinHash: string;
}

export interface SpittoonSensor {
  readonly id: string;
  readonly judgeId: string;
  readonly currentLevel: number;
  readonly lastReading: number;
}

export interface CompetitionConfig {
  readonly competitionName: string;
  readonly sipLimitPerWine: number;
  readonly maxScorePerDimension: number;
  readonly supervisors: ReadonlyArray<Supervisor>;
  readonly wines: ReadonlyArray<Wine>;
  readonly judges: ReadonlyArray<Omit<Judge, 'currentBlindId' | 'wines'>>;
  readonly sensorEnabled: boolean;
  readonly sensorTolerance: number;
}

export interface AppState {
  readonly config: CompetitionConfig;
  readonly judges: Map<string, Judge>;
  readonly auditLog: AuditLogEntry[];
  readonly sensors: Map<string, SpittoonSensor>;
  readonly currentView: AppView;
  readonly activeJudgeId: string | null;
  readonly pinModalOpen: boolean;
  readonly pinModalContext: PinModalContext | null;
  readonly bigscreenJudgeId: string | null;
}

export type AppView =
  | 'judge'
  | 'supervisor'
  | 'bigscreen'
  | 'report';

export interface PinModalContext {
  readonly judgeId: string;
  readonly blindId: string;
  readonly reason: string;
  readonly onSuccess: () => void;
}

export type StoreListener = (state: AppState) => void;

export const SCORE_DIMENSIONS = ['appearance', 'aroma', 'taste', 'finish'] as const;
export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  appearance: '外观',
  aroma: '香气',
  taste: '口感',
  finish: '余韵',
};
