export interface Zone {
  id: string;
  name: string;
  drainageDirection: 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';
  minSlopePercent: number;
  gridRows: number;
  gridCols: number;
  gridSpacingMm: number;
}

export interface MeasurePoint {
  id: string;
  zoneId: string;
  row: number;
  col: number;
  elevationMm: number | null;
  isSupplemented: boolean;
  createdAt: string;
  label: string;
}

export interface Evidence {
  id: string;
  zoneId: string;
  photoUrl: string;
  description: string;
  timestamp: string;
  isSupplemented: boolean;
}

export interface Suggestion {
  id: string;
  zoneId: string;
  currentContent: string;
  updatedAt: string;
}

export interface SuggestionVersion {
  id: string;
  suggestionId: string;
  content: string;
  versionNumber: number;
  createdAt: string;
  changeNote: string;
}

export type RiskLevel = 'safe' | 'warning' | 'critical';

export interface SlopeResult {
  fromPoint: string;
  toPoint: string;
  slopePercent: number;
  direction: 'horizontal' | 'vertical';
  riskLevel: RiskLevel;
  involvesSupplemented: boolean;
}

export type UnitMode = 'mm' | 'cm';

export interface FilterState {
  riskLevels: RiskLevel[];
}
