import type { RoofShadowRecord, AnnotationShape, AerialAnnotation } from '@/types';

export interface RecordDiff {
  field: string;
  originalValue: number | string | undefined;
  modifiedValue: number | string | undefined;
  difference: number | string;
  percentageChange?: number;
}

export const calculateRecordDiff = (record: RoofShadowRecord): RecordDiff[] => {
  const diffs: RecordDiff[] = [];

  if (record.shadowHours !== record.originalShadowHours) {
    const diff = record.shadowHours - record.originalShadowHours;
    diffs.push({
      field: '阴影时长',
      originalValue: record.originalShadowHours,
      modifiedValue: record.shadowHours,
      difference: diff,
      percentageChange: record.originalShadowHours > 0
        ? Math.round((diff / record.originalShadowHours) * 10000) / 100
        : undefined,
    });
  }

  if (record.powerEfficiency !== record.originalPowerEfficiency) {
    const diff = record.powerEfficiency - record.originalPowerEfficiency;
    diffs.push({
      field: '发电效率',
      originalValue: record.originalPowerEfficiency,
      modifiedValue: record.powerEfficiency,
      difference: diff,
      percentageChange: record.originalPowerEfficiency > 0
        ? Math.round((diff / record.originalPowerEfficiency) * 10000) / 100
        : undefined,
    });
  }

  return diffs;
};

export const hasRecordChanges = (record: RoofShadowRecord): boolean => {
  return record.shadowHours !== record.originalShadowHours ||
         record.powerEfficiency !== record.originalPowerEfficiency;
};

export const getModifiedRecords = (records: RoofShadowRecord[]): RoofShadowRecord[] => {
  return records.filter(hasRecordChanges);
};

export const calculateAnnotationImpact = (annotation: AerialAnnotation): {
  totalShadowHours: number;
  estimatedEfficiencyLoss: number;
  shapeBreakdown: { label: string; shadowHours: number; percentage: number }[];
} => {
  const totalShadowHours = annotation.shapes.reduce(
    (sum, shape) => sum + shape.shadowHours, 0
  );
  
  const shapeBreakdown = annotation.shapes.map(shape => ({
    label: shape.label,
    shadowHours: shape.shadowHours,
    percentage: totalShadowHours > 0
      ? Math.round((shape.shadowHours / totalShadowHours) * 10000) / 100
      : 0,
  }));

  const estimatedEfficiencyLoss = Math.round(totalShadowHours * 6.5 * 10) / 10;

  return {
    totalShadowHours,
    estimatedEfficiencyLoss,
    shapeBreakdown,
  };
};

export const compareAnnotations = (
  oldAnnotation: AerialAnnotation | null,
  newAnnotation: AerialAnnotation
): {
  addedShapes: AnnotationShape[];
  removedShapes: AnnotationShape[];
  modifiedShapes: { old: AnnotationShape; new: AnnotationShape }[];
  totalShadowHoursChange: number;
  efficiencyImpactChange: number;
} => {
  if (!oldAnnotation) {
    return {
      addedShapes: newAnnotation.shapes,
      removedShapes: [],
      modifiedShapes: [],
      totalShadowHoursChange: newAnnotation.shapes.reduce((s, sh) => s + sh.shadowHours, 0),
      efficiencyImpactChange: newAnnotation.estimatedShadowImpact,
    };
  }

  const oldShapeMap = new Map(oldAnnotation.shapes.map(s => [s.id, s]));
  const newShapeMap = new Map(newAnnotation.shapes.map(s => [s.id, s]));

  const addedShapes = newAnnotation.shapes.filter(s => !oldShapeMap.has(s.id));
  const removedShapes = oldAnnotation.shapes.filter(s => !newShapeMap.has(s.id));
  
  const modifiedShapes: { old: AnnotationShape; new: AnnotationShape }[] = [];
  oldAnnotation.shapes.forEach(oldShape => {
    const newShape = newShapeMap.get(oldShape.id);
    if (newShape && JSON.stringify(oldShape) !== JSON.stringify(newShape)) {
      modifiedShapes.push({ old: oldShape, new: newShape });
    }
  });

  const oldTotal = oldAnnotation.shapes.reduce((s, sh) => s + sh.shadowHours, 0);
  const newTotal = newAnnotation.shapes.reduce((s, sh) => s + sh.shadowHours, 0);

  return {
    addedShapes,
    removedShapes,
    modifiedShapes,
    totalShadowHoursChange: Math.round((newTotal - oldTotal) * 10) / 10,
    efficiencyImpactChange: Math.round((newAnnotation.estimatedShadowImpact - oldAnnotation.estimatedShadowImpact) * 10) / 10,
  };
};

export const calculateChecksum = (data: unknown): string => {
  const jsonStr = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

export const formatDiffValue = (value: number | string, isPositiveGood: boolean = false): string => {
  if (typeof value === 'number') {
    const sign = value > 0 ? '+' : '';
    const formatted = `${sign}${value}`;
    return formatted;
  }
  return String(value);
};

export const getDiffColorClass = (
  diff: number,
  isPositiveGood: boolean = false
): string => {
  if (diff === 0) return 'text-gray-600';
  const isGood = isPositiveGood ? diff > 0 : diff < 0;
  return isGood ? 'text-success-600' : 'text-danger-600';
};
