import type { CheeseWheel, CellarPosition, YeastBatch, AnomalyEvent, HACCPReport } from '../types';

export interface CriticalControlPoint {
  point: string;
  status: string;
  description: string;
}

export function generateHACCPReportData(
  wheelId: string,
  wheels: CheeseWheel[],
  cellars: CellarPosition[],
  yeasts: YeastBatch[],
  anomalies: AnomalyEvent[],
  operatorName: string
): HACCPReport {
  const wheel = wheels.find(w => w.id === wheelId);
  if (!wheel) {
    throw new Error(`奶酪轮不存在: ${wheelId}`);
  }

  const cellar = cellars.find(c => c.id === wheel.cellarPositionId);
  const yeast = yeasts.find(y => y.id === wheel.yeastBatchId);
  const wheelAnomalies = anomalies.filter(a => a.recordId === wheelId);

  return {
    wheelId: wheel.id,
    wheelNumber: wheel.wheelNumber,
    cellarPosition: cellar
      ? `${cellar.positionCode} (${cellar.zone}区 ${cellar.shelf}层)`
      : '未知位置',
    yeastBatch: yeast
      ? `${yeast.batchNumber} - ${yeast.strain}`
      : '未知批次',
    temperatureCurve: wheel.temperatureHistory,
    targetRange: wheel.targetTempRange,
    anomalies: wheelAnomalies,
    operator: operatorName,
    generatedAt: new Date(),
  };
}

export function validateHACCPData(
  report: HACCPReport
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!report.wheelId || report.wheelId.trim() === '') {
    issues.push('奶酪轮ID不能为空');
  }

  if (!report.wheelNumber || report.wheelNumber.trim() === '') {
    issues.push('奶酪轮编号不能为空');
  }

  if (!report.cellarPosition || report.cellarPosition.trim() === '') {
    issues.push('酒窖位置不能为空');
  }

  if (!report.yeastBatch || report.yeastBatch.trim() === '') {
    issues.push('酵母批次信息不能为空');
  }

  if (!report.temperatureCurve || report.temperatureCurve.length === 0) {
    issues.push('温度曲线数据不能为空');
  } else {
    const hasInvalidPoint = report.temperatureCurve.some(
      p => !(p.timestamp instanceof Date) || isNaN(p.temperature)
    );
    if (hasInvalidPoint) {
      issues.push('温度曲线包含无效数据点');
    }
  }

  if (!report.targetRange || !Array.isArray(report.targetRange) || report.targetRange.length !== 2) {
    issues.push('目标温度范围必须是包含两个数值的数组');
  } else if (report.targetRange[0] >= report.targetRange[1]) {
    issues.push('最低温度必须小于最高温度');
  }

  if (!report.anomalies || !Array.isArray(report.anomalies)) {
    issues.push('异常事件列表格式不正确');
  }

  if (!report.operator || report.operator.trim() === '') {
    issues.push('操作员信息不能为空');
  }

  if (!report.generatedAt || !(report.generatedAt instanceof Date)) {
    issues.push('报告生成时间无效');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function calculateCriticalControlPoints(
  report: HACCPReport
): CriticalControlPoint[] {
  const ccps: CriticalControlPoint[] = [];

  const yeastValid = report.yeastBatch !== '未知批次' && report.yeastBatch.includes('-');
  ccps.push({
    point: 'CCP1',
    status: yeastValid ? '通过' : '未通过',
    description: yeastValid
      ? `原料验收：酵母批次验证通过 (${report.yeastBatch})`
      : '原料验收：酵母批次信息缺失或无效',
  });

  const tempPoints = report.temperatureCurve;
  const [minTemp, maxTemp] = report.targetRange;
  let tempOutOfRangeCount = 0;
  for (const point of tempPoints) {
    if (point.temperature < minTemp || point.temperature > maxTemp) {
      tempOutOfRangeCount++;
    }
  }
  const tempPassRate = tempPoints.length > 0
    ? ((tempPoints.length - tempOutOfRangeCount) / tempPoints.length) * 100
    : 0;
  const tempValid = tempPassRate >= 95;
  ccps.push({
    point: 'CCP2',
    status: tempValid ? '通过' : '未通过',
    description: tempValid
      ? `熟成温度监控：温度合规率 ${tempPassRate.toFixed(1)}% (目标≥95%)`
      : `熟成温度监控：温度合规率仅 ${tempPassRate.toFixed(1)}%，存在 ${tempOutOfRangeCount} 个异常点`,
  });

  let interruptedCount = 0;
  let forgedCount = 0;
  for (const point of tempPoints) {
    if (point.status === 'interrupted') interruptedCount++;
    if (point.status === 'forged') forgedCount++;
  }
  const dataIntegrity = tempPoints.length > 0
    ? ((tempPoints.length - interruptedCount - forgedCount) / tempPoints.length) * 100
    : 0;
  const dataValid = dataIntegrity >= 98 && forgedCount === 0;
  ccps.push({
    point: 'CCP3',
    status: dataValid ? '通过' : '未通过',
    description: dataValid
      ? `数据完整性验证：完整性评分 ${dataIntegrity.toFixed(1)}%，无伪造数据`
      : forgedCount > 0
        ? `数据完整性验证：检测到 ${forgedCount} 个伪造数据点`
        : `数据完整性验证：完整性评分仅 ${dataIntegrity.toFixed(1)}%，存在 ${interruptedCount} 个中断点`,
  });

  const hasAnomalies = report.anomalies.length > 0;
  const unacknowledged = report.anomalies.filter(a => !a.acknowledged).length;
  const labelValid = report.wheelNumber.trim() !== '' && unacknowledged === 0;
  ccps.push({
    point: 'CCP4',
    status: labelValid ? '通过' : '未通过',
    description: labelValid
      ? `出库标签验证：标签编号 ${report.wheelNumber}，无未确认异常`
      : hasAnomalies
        ? `出库标签验证：存在 ${unacknowledged} 个未确认异常事件，暂不可出库`
        : '出库标签验证：标签编号无效',
  });

  return ccps;
}
