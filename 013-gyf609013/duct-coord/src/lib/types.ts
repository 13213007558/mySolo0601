export interface DuctZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floorRef: string;
  originalElevationMm: number;
  currentElevationMm: number;
  ductSize: string;
  affectedDisciplines: string[];
  status: 'normal' | 'conflict' | 'resolved';
  createdAt: number;
  updatedAt: number;
}

export interface ElevationChange {
  id: string;
  zoneId: string;
  oldElevationMm: number;
  newElevationMm: number;
  reason: string;
  operator: string;
  timestamp: number;
  reverted: boolean;
}

export interface FieldRemark {
  id: string;
  zoneId: string;
  content: string;
  author: string;
  discipline: string;
  timestamp: number;
}

export interface CoordIssue {
  id: string;
  zoneId: string;
  type: 'elevation_conflict' | 'ceiling_change' | 'field_yield' | 'other';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: number;
  resolvedAt: number | null;
}

export type ElevationUnit = 'mm' | 'm';

export interface ExportMinutes {
  title: string;
  date: string;
  zones: DuctZone[];
  changes: ElevationChange[];
  issues: CoordIssue[];
  remarks: FieldRemark[];
}
