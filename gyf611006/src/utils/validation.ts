import type { ValidationResult, AppMode, CorrectedDistances, WindData, LeakSource } from '../types';

const MIN_REQUIRED_DISTANCE = 500;

export function validateSubmission(
  mode: AppMode,
  correctedDistances: CorrectedDistances,
  windData: WindData,
  hasWindReading: boolean,
  leakSource: LeakSource
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (correctedDistances.min < MIN_REQUIRED_DISTANCE) {
    errors.push(`隔离距离不足：最小修正距离 ${correctedDistances.min} 米，安全阈值 ${MIN_REQUIRED_DISTANCE} 米`);
  }

  if (mode === 'real' && !hasWindReading) {
    errors.push('实盘模式必须上传风向读数');
  }

  if (!leakSource.point) {
    errors.push('请在照片上标记泄漏源点');
  }

  if (mode === 'real' && !leakSource.photoUrl) {
    errors.push('实盘模式必须上传现场照片');
  }

  if (windData.speed < 1) {
    warnings.push('风速较低，泄漏扩散可能较慢，请持续监测');
  }

  if (windData.speed > 10) {
    warnings.push('风速较高，扩散范围可能快速扩大，请加强警戒');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    minRequiredDistance: MIN_REQUIRED_DISTANCE,
    actualMinDistance: correctedDistances.min,
  };
}

export function formatValidationMessage(result: ValidationResult): string {
  if (result.isValid) {
    return `✓ 距离合规，最小修正距离 ${result.actualMinDistance} 米`;
  }
  return result.errors[0] || '校验未通过';
}
