import type { RoofShadowRecord, AerialAnnotation, AnnotationShape } from '@/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateRecord = (record: Partial<RoofShadowRecord>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (record.shadowHours !== undefined) {
    if (typeof record.shadowHours !== 'number' || isNaN(record.shadowHours)) {
      errors.push('阴影时长必须是数字');
    } else if (record.shadowHours < 0) {
      errors.push('阴影时长不能为负数');
    } else if (record.shadowHours > 24) {
      errors.push('阴影时长不能超过24小时');
    } else if (record.shadowHours > 12) {
      warnings.push('阴影时长超过12小时，请确认数据是否正确');
    }
  }

  if (record.powerEfficiency !== undefined) {
    if (typeof record.powerEfficiency !== 'number' || isNaN(record.powerEfficiency)) {
      errors.push('发电效率必须是数字');
    } else if (record.powerEfficiency < 0) {
      errors.push('发电效率不能为负数');
    } else if (record.powerEfficiency > 100) {
      errors.push('发电效率不能超过100%');
    } else if (record.powerEfficiency < 30) {
      warnings.push('发电效率低于30%，数据可能异常');
    }
  }

  if (record.buildingName !== undefined && !record.buildingName.trim()) {
    errors.push('建筑名称不能为空');
  }

  if (record.recordDate !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(record.recordDate)) {
      errors.push('日期格式必须为YYYY-MM-DD');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateRecords = (records: RoofShadowRecord[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (records.length === 0) {
    return { valid: true, errors: [], warnings: ['数据集为空'] };
  }

  const uniqueIds = new Set<string>();
  const duplicateDates = new Map<string, Set<string>>();

  records.forEach((record, index) => {
    const result = validateRecord(record);
    result.errors.forEach(err => errors.push(`第${index + 1}行: ${err}`));
    result.warnings.forEach(warn => warnings.push(`第${index + 1}行: ${warn}`));

    if (uniqueIds.has(record.id)) {
      errors.push(`第${index + 1}行: 重复的记录ID ${record.id}`);
    }
    uniqueIds.add(record.id);

    const dateKey = `${record.roofId}-${record.recordDate}`;
    if (!duplicateDates.has(record.roofId)) {
      duplicateDates.set(record.roofId, new Set());
    }
    if (duplicateDates.get(record.roofId)!.has(record.recordDate)) {
      warnings.push(`第${index + 1}行: 屋顶${record.roofId}在${record.recordDate}已有记录`);
    }
    duplicateDates.get(record.roofId)!.add(record.recordDate);
  });

  return { valid: errors.length === 0, errors, warnings };
};

export const validateAnnotationShape = (shape: Partial<AnnotationShape>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (shape.x === undefined || shape.y === undefined) {
    errors.push('形状位置不能为空');
  }
  if (shape.width === undefined || shape.height === undefined) {
    errors.push('形状尺寸不能为空');
  }
  if (shape.width !== undefined && shape.width <= 0) {
    errors.push('宽度必须大于0');
  }
  if (shape.height !== undefined && shape.height <= 0) {
    errors.push('高度必须大于0');
  }
  if (!shape.label?.trim()) {
    warnings.push('建议为遮挡区域添加标签说明');
  }
  if (shape.shadowHours !== undefined && shape.shadowHours < 0) {
    errors.push('预估阴影时长不能为负数');
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const validateAnnotation = (annotation: AerialAnnotation): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!annotation.roofId) {
    errors.push('屋顶ID不能为空');
  }
  if (!annotation.recordedBy) {
    errors.push('补录人不能为空');
  }
  if (annotation.shapes.length === 0) {
    warnings.push('当前未绘制任何遮挡框');
  }

  annotation.shapes.forEach((shape, index) => {
    const result = validateAnnotationShape(shape);
    result.errors.forEach(err => errors.push(`遮挡框${index + 1}: ${err}`));
    result.warnings.forEach(warn => warnings.push(`遮挡框${index + 1}: ${warn}`));
  });

  return { valid: errors.length === 0, errors, warnings };
};

export const checkEmptyState = (
  allRecords: RoofShadowRecord[],
  filteredRecords: RoofShadowRecord[]
): 'no-data' | 'filter-too-narrow' | 'data-corrupted' | null => {
  const validation = validateRecords(allRecords);
  if (!validation.valid) {
    return 'data-corrupted';
  }
  if (allRecords.length === 0) {
    return 'no-data';
  }
  if (filteredRecords.length === 0 && allRecords.length > 0) {
    return 'filter-too-narrow';
  }
  return null;
};
