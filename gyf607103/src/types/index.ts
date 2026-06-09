export interface RoofShadowRecord {
  id: string;
  roofId: string;
  buildingName: string;
  recordDate: string;
  shadowHours: number;
  originalShadowHours: number;
  powerEfficiency: number;
  originalPowerEfficiency: number;
  status: 'normal' | 'warning' | 'danger';
  markedBy?: string;
  markedAt?: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationShape {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
  shadowHours: number;
}

export interface AerialAnnotation {
  id: string;
  roofId: string;
  recordedBy: string;
  recordedAt: string;
  shapes: AnnotationShape[];
  estimatedShadowImpact: number;
  notes?: string;
  sourceImage?: string;
}

export interface ThresholdConfig {
  warningShadowHours: number;
  dangerShadowHours: number;
  warningEfficiency: number;
  dangerEfficiency: number;
}

export interface ThresholdAlert {
  type: 'normal' | 'warning' | 'danger';
  title: string;
  description: string;
  affectedCount: number;
}

export type EmptyStateType = 'no-data' | 'filter-too-narrow' | 'data-corrupted';

export interface ExportAudit {
  id: string;
  exportedAt: string;
  exportedBy: string;
  exportType: 'raw' | 'modified';
  recordCount: number;
  checksum: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
