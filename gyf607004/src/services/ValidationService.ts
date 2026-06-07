import { RescheduleRecord, AnomalyDetail } from '@/types';

const REQUIRED_FIELDS: Array<keyof RescheduleRecord> = [
  'babyName',
  'babyId',
  'originalShift',
  'originalDate',
  'targetShift',
  'targetDate',
  'reason',
];

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const isoPattern = /^\d{4}-\d{2}-\d{2}/;
  return isoPattern.test(dateStr);
}

export const ValidationService = {
  validateRecord(
    data: Partial<RescheduleRecord>,
    existingRecords: RescheduleRecord[]
  ): { valid: boolean; errors: string[]; anomaly: AnomalyDetail | null } {
    const errors: string[] = [];
    let anomaly: AnomalyDetail | null = null;

    for (const field of REQUIRED_FIELDS) {
      const value = data[field];
      if (value === undefined || value === null || value === '') {
        const labelMap: Record<string, string> = {
          babyName: '宝宝姓名',
          babyId: '宝宝ID',
          originalShift: '原班次',
          originalDate: '原日期',
          targetShift: '目标班次',
          targetDate: '目标日期',
          reason: '换班原因',
        };
        errors.push(`${labelMap[field]}为必填项`);
      }
    }

    if (data.originalDate && !isValidDate(data.originalDate)) {
      errors.push('原日期格式无效，需为 YYYY-MM-DD');
    }
    if (data.targetDate && !isValidDate(data.targetDate)) {
      errors.push('目标日期格式无效，需为 YYYY-MM-DD');
    }

    if (errors.length > 0 && !anomaly) {
      anomaly = {
        type: 'missing_required',
        message: errors.join('；'),
      };
    }

    if (
      data.babyId &&
      data.targetDate &&
      data.targetShift &&
      !anomaly
    ) {
      const crossConflict = ValidationService.detectCrossShiftConflict(
        data.babyId,
        data.targetDate,
        data.targetShift,
        existingRecords,
        data.id
      );
      if (crossConflict) {
        anomaly = crossConflict;
        errors.push(crossConflict.message);
      }
    }

    if (data.targetDate && data.targetShift && !anomaly) {
      const approvedSameSlot = existingRecords.filter(
        (r) =>
          r.id !== data.id &&
          r.targetDate === data.targetDate &&
          r.targetShift === data.targetShift &&
          r.status === 'approved'
      );
      if (approvedSameSlot.length >= 2) {
        anomaly = {
          type: 'slot_occupied',
          message: `目标日期${data.targetDate}${data.targetShift}名额已满（最多2条已通过记录）`,
        };
        errors.push(anomaly.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      anomaly,
    };
  },

  detectCrossShiftConflict(
    babyId: string,
    targetDate: string,
    targetShift: string,
    existingRecords: RescheduleRecord[],
    excludeId?: string
  ): AnomalyDetail | null {
    const sameBabySameSlot = existingRecords.find(
      (r) =>
        r.id !== excludeId &&
        r.babyId === babyId &&
        r.targetDate === targetDate &&
        r.targetShift === targetShift &&
        r.status !== 'rejected' &&
        r.status !== 'archived'
    );
    if (sameBabySameSlot) {
      return {
        type: 'duplicate_baby',
        message: `同一宝宝${sameBabySameSlot.babyName}(${babyId})在${targetDate}${targetShift}已存在换班记录`,
        conflictingRecordId: sameBabySameSlot.id,
      };
    }

    const sameBabySameDayOtherShift = existingRecords.find(
      (r) =>
        r.id !== excludeId &&
        r.babyId === babyId &&
        r.targetDate === targetDate &&
        r.targetShift !== targetShift &&
        r.status !== 'rejected' &&
        r.status !== 'archived'
    );
    if (sameBabySameDayOtherShift) {
      return {
        type: 'cross_shift_conflict',
        message: `宝宝${sameBabySameDayOtherShift.babyName}(${babyId})在${targetDate}已有${sameBabySameDayOtherShift.targetShift}换班记录，存在跨班冲突`,
        conflictingRecordId: sameBabySameDayOtherShift.id,
      };
    }

    return null;
  },
};
