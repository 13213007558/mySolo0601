import type { CircuitRecord, ProblemRecord, ThresholdConfig } from '../types';

export const getPlainThresholdHint = (field: string, value: number, thresholds: ThresholdConfig): string => {
  const hints: Record<string, { low: string; high: string; unit: string; min: number; max: number }> = {
    voltage: {
      low: '电压偏低，可能导致灯光昏暗甚至不亮',
      high: '电压偏高，容易烧坏灯泡和线路',
      unit: 'V',
      min: thresholds.voltageMin,
      max: thresholds.voltageMax,
    },
    current: {
      low: '电流太小，回路可能有松动或者灯泡快坏了',
      high: '电流太大，线路发热严重，有起火风险',
      unit: 'A',
      min: thresholds.currentMin,
      max: thresholds.currentMax,
    },
    power: {
      low: '功率太低，照明效果肯定好不了',
      high: '功率太高，既费电又不安全',
      unit: 'W',
      min: thresholds.powerMin,
      max: thresholds.powerMax,
    },
    illumination: {
      low: '照度不够，现场太暗，巡检不安全',
      high: '照度过高，晃眼睛还浪费电',
      unit: 'lux',
      min: thresholds.illuminationMin,
      max: thresholds.illuminationMax,
    },
  };

  const hint = hints[field];
  if (!hint) return '';

  if (value < hint.min) {
    return `${hint.low}（正常范围 ${hint.min}-${hint.max}${hint.unit}，当前 ${value}${hint.unit}）`;
  }
  if (value > hint.max) {
    return `${hint.high}（正常范围 ${hint.min}-${hint.max}${hint.unit}，当前 ${value}${hint.unit}）`;
  }
  return '数值正常';
};

export const checkThresholds = (record: CircuitRecord, thresholds: ThresholdConfig): string[] => {
  const warnings: string[] = [];
  const fields = ['voltage', 'current', 'power', 'illumination'] as const;

  fields.forEach(field => {
    const value = record[field];
    const hint = getPlainThresholdHint(field, value, thresholds);
    if (hint !== '数值正常') {
      warnings.push(hint);
    }
  });

  return warnings;
};

export const validateRecord = (record: Partial<CircuitRecord>, thresholds: ThresholdConfig): {
  isValid: boolean;
  problems: ProblemRecord[];
} => {
  const problems: ProblemRecord[] = [];
  const badReasons: string[] = [];
  let problemType: ProblemRecord['problemType'] | null = null;
  let suggestedFix = '';

  if (!record.circuitName || record.circuitName.trim() === '') {
    badReasons.push('回路名称不能为空');
    problemType = 'missing';
    suggestedFix = '请填写回路的完整名称';
  }

  if (!record.circuitCode || record.circuitCode.trim() === '') {
    badReasons.push('回路编号不能为空');
    problemType = 'missing';
    suggestedFix = suggestedFix || '请填写回路编号';
  } else if (!/^[A-Za-z0-9-]+$/.test(record.circuitCode)) {
    badReasons.push('回路编号只能包含字母、数字和横线');
    problemType = 'format';
    suggestedFix = '请修改回路编号，去掉特殊字符';
  }

  if (!record.inspectionDate || record.inspectionDate.trim() === '') {
    badReasons.push('检查日期不能为空');
    problemType = problemType || 'missing';
  }

  if (record.current !== undefined && record.current < 0) {
    badReasons.push('电流不能是负数');
    problemType = problemType || 'logic';
    suggestedFix = suggestedFix || '请检查电流数值的正负号';
  }

  if (record.power !== undefined && record.power < 0) {
    badReasons.push('功率不能是负数');
    problemType = problemType || 'logic';
    suggestedFix = suggestedFix || '请检查功率数值的正负号';
  }

  if (record.voltage !== undefined && record.current !== undefined) {
    const expectedPower = record.voltage * record.current;
    if (record.power !== undefined && Math.abs(record.power - expectedPower) > expectedPower * 0.3) {
      badReasons.push(`功率（${record.power}W）和电压×电流（${expectedPower.toFixed(0)}W）差距太大`);
      problemType = problemType || 'logic';
      suggestedFix = suggestedFix || '请核对电压、电流和功率的读数';
    }
  }

  const allFields = ['voltage', 'current', 'power', 'illumination'] as const;
  const outOfRange = allFields.filter(field => {
    const value = record[field];
    if (value === undefined) return false;
    const min = thresholds[`${field}Min` as keyof ThresholdConfig] as number;
    const max = thresholds[`${field}Max` as keyof ThresholdConfig] as number;
    return value < min || value > max;
  });

  if (outOfRange.length >= 3) {
    badReasons.push('大部分数值都超出正常范围，很可能是抄错了');
    problemType = problemType || 'range';
    suggestedFix = suggestedFix || '请回到现场重新核对所有读数';
  }

  if (badReasons.length > 0) {
    problems.push({
      ...record,
      id: record.id || `BAD-${Date.now()}`,
      circuitName: record.circuitName || '',
      circuitCode: record.circuitCode || '',
      location: record.location || '',
      status: 'unknown',
      voltage: record.voltage || 0,
      current: record.current || 0,
      power: record.power || 0,
      illumination: record.illumination || 0,
      inspectionDate: record.inspectionDate || '',
      inspector: record.inspector || '',
      source: record.source || 'handwritten',
      isBad: true,
      badReason: badReasons.join('；'),
      problemType: problemType || 'format',
      suggestedFix: suggestedFix || '请检查并修正记录',
    } as ProblemRecord);
  }

  return {
    isValid: problems.length === 0,
    problems,
  };
};

export const validateHandwrittenImport = (
  records: Partial<CircuitRecord>[],
  thresholds: ThresholdConfig
): {
  validRecords: CircuitRecord[];
  problemRecords: ProblemRecord[];
} => {
  const validRecords: CircuitRecord[] = [];
  const problemRecords: ProblemRecord[] = [];

  records.forEach(record => {
    const { isValid, problems } = validateRecord(record, thresholds);
    if (isValid) {
      validRecords.push(record as CircuitRecord);
    } else {
      problemRecords.push(...problems);
    }
  });

  return { validRecords, problemRecords };
};
