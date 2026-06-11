export interface MeasurementPoint {
  id: string;
  x: number;
  y: number;
  thickness: number;
  quadrant: 1 | 2 | 3 | 4;
  isThin: boolean;
  batchId: string | null;
  timestamp: number;
  isRechecked: boolean;
  recheckedBy: string | null;
  recheckedAt: number | null;
}

export interface Mussel {
  id: string;
  poolId: string;
  batchId: string;
  label: string;
  points: MeasurementPoint[];
  grade: string | null;
  canGrade: boolean;
  gradeReason: string;
  createdAt: number;
}

export interface ReInspectionOrder {
  id: string;
  musselId: string;
  pointId: string;
  reason: string;
  originalValue: number;
  recheckValue: number | null;
  originalOperator: string;
  recheckOperator: string | null;
  status: 'pending' | 'completed';
  createdAt: number;
  completedAt: number | null;
}

export interface PoolHistoryEntry {
  date: string;
  avgThickness: number;
  minThickness: number;
  maxThickness: number;
  pointCount: number;
  sampleCount: number;
}

export interface NucleusBatch {
  id: string;
  label: string;
  implantDate: string;
  poolId: string;
}

export interface Operator {
  id: string;
  name: string;
  shift: 'A' | 'B' | 'C';
}

export type Quadrant = 1 | 2 | 3 | 4;

export interface ThicknessStats {
  avg: number;
  min: number;
  max: number;
  stdDev: number;
  count: number;
  thinCount: number;
  coveredQuadrants: number[];
}

export interface GradingResult {
  grade: 'AAA' | 'AA' | 'A' | 'B' | 'C' | null;
  canGrade: boolean;
  reason: string;
}
