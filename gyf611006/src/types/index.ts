export type Direction = 'north' | 'south' | 'east' | 'west';

export type AppMode = 'drill' | 'real';

export interface Point {
  x: number;
  y: number;
}

export interface DiamondPoint extends Point {
  direction: Direction;
}

export interface Distances {
  north: number;
  south: number;
  east: number;
  west: number;
  average: number;
  min: number;
  max: number;
}

export interface DiamondMeasure {
  center: Point;
  north: DiamondPoint;
  south: DiamondPoint;
  east: DiamondPoint;
  west: DiamondPoint;
  distances: Distances;
}

export interface WindData {
  angle: number;
  speed: number;
  fanAngle: number;
}

export interface CorrectionFactors {
  upwind: number;
  downwind: number;
  crosswind: number;
}

export interface CorrectedDistances {
  north: number;
  south: number;
  east: number;
  west: number;
  min: number;
  average: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  minRequiredDistance: number;
  actualMinDistance: number;
}

export interface LeakSource {
  point: Point | null;
  photoUrl: string | null;
  photoName: string | null;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  mode: AppMode;
  location: string;
  leakSource: Point;
  diamond: DiamondMeasure;
  wind: WindData;
  correctedDistances: CorrectedDistances;
  isCompliant: boolean;
  photoUrl?: string;
}

export interface Enterprise {
  id: string;
  name: string;
  contact: string;
  phone: string;
  distance: number;
  direction: string;
}

export interface SmsPushStatus {
  isPushing: boolean;
  lastPushTime: number | null;
  pushedCount: number;
  totalCount: number;
}
