export interface Manuscript {
  id: string;
  code: string;
  title: string;
  totalPages: number;
  createdAt: number;
}

export interface CaptureRecord {
  id: string;
  manuscriptId: string;
  pageNum: number;
  imageBlobKey: string;
  targetAngle: number;
  actualAngle: number;
  angleDeviation: number;
  needsRetake: boolean;
  lowBlueMode: boolean;
  capturedBy: string;
  capturedAt: number;
  version: number;
  exifJson: string;
}

export interface FiberArrow {
  id: string;
  captureId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  angle: number;
  snappedTo15: boolean;
  color: string;
}

export type RepairType = '补缺' | '托裱' | '接笔' | '全色' | '其他';

export interface RepairPolygon {
  id: string;
  captureId: string;
  points: Array<{ x: number; y: number }>;
  note: string;
  repairType: RepairType;
}

export interface AnnotationLayer {
  captureId: string;
  arrows: FiberArrow[];
  polygons: RepairPolygon[];
  updatedAt: number;
  updatedBy: string;
}

export interface ImageBlobEntity {
  id: string;
  blob: Blob;
}

export interface UserPreferences {
  lowBlueMode: boolean;
  lowBlueIntensity: number;
  snapTo15: boolean;
  operatorId: string;
  showGrid: boolean;
}

export interface CaptureWithBlob extends CaptureRecord {
  imageBlob?: Blob;
  imageUrl?: string;
}

export const REPAIR_TYPES: RepairType[] = ['补缺', '托裱', '接笔', '全色', '其他'];
