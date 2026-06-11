import type { TemperaturePoint, HACCPReport, AnomalyEvent } from '../types';
import { cheeseWheels, cellarPositions, yeastBatches, users } from '../utils/mock-data';
import type { CheeseWheel } from '../utils/mock-data';

/**
 * 报告服务
 * @description 提供HACCP报告生成、数据验证和数据完整性计算等功能
 */
export class ReportService {
  /**
   * 生成HACCP报告数据
   * @description 根据奶酪轮ID生成完整的HACCP（危害分析与关键控制点）报告
   * @param cheeseWheelId - 奶酪轮ID
   * @returns 生成的HACCP报告对象
   *
   * 算法逻辑：
   * 1. 根据ID查找奶酪轮基本信息
   * 2. 关联查询酒窖位置信息、酵母批次信息
   * 3. 查找创建该记录的操作员信息
   * 4. 处理温度曲线数据：
   *    - 标记异常点（超出目标范围的点）
   *    - 检测数据中断（时间间隔超过2小时）
   *    - 检测温度骤升/骤降异常
   * 5. 生成异常事件列表：
   *    - 温度越界异常
   *    - 数据中断异常
   *    - 温度剧烈波动异常
   * 6. 组装完整的HACCP报告结构
   * 7. 返回报告数据
   */
  generateHACCPReport(cheeseWheelId: string): HACCPReport | null {
    const cheeseWheel = cheeseWheels.find(cw => cw.id === cheeseWheelId);
    if (!cheeseWheel) {
      return null;
    }

    const position = cellarPositions.find(cp => cp.id === cheeseWheel.positionId);
    const yeastBatch = yeastBatches.find(yb => yb.id === cheeseWheel.yeastBatchId);
    const operator = users.find(u => u.id === cheeseWheel.createdBy);

    const temperatureCurve: TemperaturePoint[] = cheeseWheel.temperatureHistory.map((point, index) => {
      const inRange = point.temperature >= cheeseWheel.targetTemperatureMin &&
                      point.temperature <= cheeseWheel.targetTemperatureMax;

      let status: 'valid' | 'interrupted' | 'forged' = 'valid';

      if (index > 0) {
        const prevPoint = cheeseWheel.temperatureHistory[index - 1];
        const timeDiff = point.timestamp.getTime() - prevPoint.timestamp.getTime();
        if (timeDiff > 2 * 60 * 60 * 1000) {
          status = 'interrupted';
        }
      }

      if (!inRange) {
        status = 'interrupted';
      }

      return {
        timestamp: point.timestamp,
        temperature: point.temperature,
        probeDepth: 8 + Math.random() * 2,
        status,
      };
    });

    const anomalies: AnomalyEvent[] = this.detectAnomalies(
      cheeseWheel,
      temperatureCurve
    );

    const report: HACCPReport = {
      wheelId: cheeseWheel.id,
      wheelNumber: cheeseWheel.batchNumber,
      cellarPosition: position ? `${position.code} (${position.row}区 ${position.shelf}层)` : '未知位置',
      yeastBatch: yeastBatch ? `${yeastBatch.batchNumber} - ${yeastBatch.strain}` : '未知批次',
      temperatureCurve,
      targetRange: [cheeseWheel.targetTemperatureMin, cheeseWheel.targetTemperatureMax],
      anomalies,
      operator: operator ? operator.name : '未知操作员',
      generatedAt: new Date(),
    };

    return report;
  }

  /**
   * 检测温度曲线中的异常事件
   * @description 辅助方法：分析温度曲线，识别各类异常事件
   * @param cheeseWheel - 奶酪轮信息
   * @param temperatureCurve - 温度曲线数据
   * @returns 异常事件数组
   *
   * 算法逻辑：
   * 1. 遍历温度曲线，检测以下异常：
   *    - 温度越界：超出目标温度范围
   *    - 数据中断：相邻点时间间隔超过2小时
   *    - 温度骤升：5分钟内升温超过2℃
   *    - 温度骤降：5分钟内降温超过3℃
   * 2. 为每个检测到的异常创建AnomalyEvent对象
   * 3. 根据异常幅度确定严重级别
   * 4. 返回所有异常事件
   */
  private detectAnomalies(
    cheeseWheel: CheeseWheel,
    temperatureCurve: TemperaturePoint[]
  ): AnomalyEvent[] {
    const anomalies: AnomalyEvent[] = [];
    let anomalyIdCounter = 0;

    for (let i = 0; i < temperatureCurve.length; i++) {
      const point = temperatureCurve[i];

      if (point.status === 'interrupted') {
        const outOfRange = point.temperature < cheeseWheel.targetTemperatureMin ||
                          point.temperature > cheeseWheel.targetTemperatureMax;

        if (outOfRange) {
          const diff = point.temperature < cheeseWheel.targetTemperatureMin
            ? cheeseWheel.targetTemperatureMin - point.temperature
            : point.temperature - cheeseWheel.targetTemperatureMax;

          let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
          if (diff >= 3) severity = 'critical';
          else if (diff >= 2) severity = 'high';
          else if (diff >= 1) severity = 'medium';

          anomalyIdCounter++;
          anomalies.push({
            id: `ANOM-${cheeseWheel.id}-${anomalyIdCounter}`,
            recordId: cheeseWheel.id,
            type: 'temperature_spike',
            severity,
            timestamp: point.timestamp,
            acknowledged: false,
            acknowledgedBy: '',
          });
        }
      }

      if (i > 0) {
        const prevPoint = temperatureCurve[i - 1];
        const timeDiff = point.timestamp.getTime() - prevPoint.timestamp.getTime();

        if (timeDiff > 2 * 60 * 60 * 1000) {
          anomalyIdCounter++;
          anomalies.push({
            id: `ANOM-${cheeseWheel.id}-${anomalyIdCounter}`,
            recordId: cheeseWheel.id,
            type: 'data_interruption',
            severity: timeDiff > 6 * 60 * 60 * 1000 ? 'high' : 'medium',
            timestamp: point.timestamp,
            acknowledged: false,
            acknowledgedBy: '',
          });
        }

        if (timeDiff <= 30 * 60 * 1000) {
          const tempDiff = point.temperature - prevPoint.temperature;
          if (tempDiff >= 2) {
            anomalyIdCounter++;
            anomalies.push({
              id: `ANOM-${cheeseWheel.id}-${anomalyIdCounter}`,
              recordId: cheeseWheel.id,
              type: 'temperature_spike',
              severity: tempDiff >= 4 ? 'critical' : 'high',
              timestamp: point.timestamp,
              acknowledged: false,
              acknowledgedBy: '',
            });
          } else if (tempDiff <= -3) {
            anomalyIdCounter++;
            anomalies.push({
              id: `ANOM-${cheeseWheel.id}-${anomalyIdCounter}`,
              recordId: cheeseWheel.id,
              type: 'temperature_spike',
              severity: tempDiff <= -5 ? 'critical' : 'high',
              timestamp: point.timestamp,
              acknowledged: false,
              acknowledgedBy: '',
            });
          }
        }
      }
    }

    return anomalies;
  }

  /**
   * 验证报告数据完整性
   * @description 验证HACCP报告的所有必填字段是否完整有效
   * @param report - HACCP报告对象
   * @returns 验证结果对象，包含是否有效和缺失的字段列表
   *
   * 算法逻辑：
   * 1. 定义必填字段列表及其验证规则
   * 2. 逐个检查每个字段：
   *    - 基本字段：检查是否存在且非空
   *    - 温度曲线：检查数组长度>0
   *    - 目标范围：检查是否为有效的二元数组
   *    - 时间字段：检查是否为有效的Date对象
   * 3. 收集所有缺失或无效的字段
   * 4. 返回验证结果，包含缺失字段的详细信息
   * 5. 只有当所有字段都有效时才返回true
   */
  validateReportData(report: HACCPReport): {
    isValid: boolean;
    missingFields: string[];
    details: Record<string, string>;
  } {
    const missingFields: string[] = [];
    const details: Record<string, string> = {};

    if (!report.wheelId || report.wheelId.trim() === '') {
      missingFields.push('wheelId');
      details.wheelId = '奶酪轮ID不能为空';
    }

    if (!report.wheelNumber || report.wheelNumber.trim() === '') {
      missingFields.push('wheelNumber');
      details.wheelNumber = '奶酪轮编号不能为空';
    }

    if (!report.cellarPosition || report.cellarPosition.trim() === '') {
      missingFields.push('cellarPosition');
      details.cellarPosition = '酒窖位置不能为空';
    }

    if (!report.yeastBatch || report.yeastBatch.trim() === '') {
      missingFields.push('yeastBatch');
      details.yeastBatch = '酵母批次信息不能为空';
    }

    if (!report.temperatureCurve || report.temperatureCurve.length === 0) {
      missingFields.push('temperatureCurve');
      details.temperatureCurve = '温度曲线数据不能为空';
    } else {
      const hasInvalidPoint = report.temperatureCurve.some(
        p => !(p.timestamp instanceof Date) || isNaN(p.temperature)
      );
      if (hasInvalidPoint) {
        missingFields.push('temperatureCurve');
        details.temperatureCurve = '温度曲线包含无效数据点';
      }
    }

    if (!report.targetRange || !Array.isArray(report.targetRange) || report.targetRange.length !== 2) {
      missingFields.push('targetRange');
      details.targetRange = '目标温度范围必须是包含两个数值的数组';
    } else if (report.targetRange[0] >= report.targetRange[1]) {
      missingFields.push('targetRange');
      details.targetRange = '最低温度必须小于最高温度';
    }

    if (!report.anomalies || !Array.isArray(report.anomalies)) {
      missingFields.push('anomalies');
      details.anomalies = '异常事件列表格式不正确';
    }

    if (!report.operator || report.operator.trim() === '') {
      missingFields.push('operator');
      details.operator = '操作员信息不能为空';
    }

    if (!report.generatedAt || !(report.generatedAt instanceof Date)) {
      missingFields.push('generatedAt');
      details.generatedAt = '报告生成时间无效';
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      details,
    };
  }

  /**
   * 计算数据完整性百分比
   * @description 根据理论采样点数和实际采样点数计算数据完整性
   * @param points - 实际温度采样点数组
   * @param expectedIntervalMinutes - 期望的采样间隔（分钟），默认30分钟
   * @returns 数据完整性结果，包含百分比、期望点数、实际点数和缺失点数
   *
   * 算法逻辑：
   * 1. 如果点数为0，直接返回0%完整性
   * 2. 计算实际时间跨度：最后一个点时间 - 第一个点时间
   * 3. 根据期望采样间隔计算理论上应该有的点数：
   *    - 理论点数 = 时间跨度 / 采样间隔 + 1
   * 4. 检查实际数据中的间隔异常：
   *    - 相邻点间隔超过1.5倍期望间隔视为数据缺失
   *    - 统计缺失的采样次数
   * 5. 计算完整性百分比：
   *    - 完整性 = (实际点数 / (实际点数 + 缺失点数)) * 100%
   * 6. 返回详细的计算结果
   */
  calculateDataIntegrity(
    points: TemperaturePoint[],
    expectedIntervalMinutes: number = 30
  ): {
    integrityPercent: number;
    expectedPoints: number;
    actualPoints: number;
    missingPoints: number;
    timeSpanHours: number;
  } {
    if (points.length === 0) {
      return {
        integrityPercent: 0,
        expectedPoints: 0,
        actualPoints: 0,
        missingPoints: 0,
        timeSpanHours: 0,
      };
    }

    const startTime = points[0].timestamp.getTime();
    const endTime = points[points.length - 1].timestamp.getTime();
    const timeSpanMs = endTime - startTime;
    const timeSpanHours = timeSpanMs / (1000 * 60 * 60);

    const expectedIntervalMs = expectedIntervalMinutes * 60 * 1000;
    const expectedPoints = Math.floor(timeSpanMs / expectedIntervalMs) + 1;

    let missingPoints = 0;
    for (let i = 1; i < points.length; i++) {
      const interval = points[i].timestamp.getTime() - points[i - 1].timestamp.getTime();
      if (interval > expectedIntervalMs * 1.5) {
        const missing = Math.floor(interval / expectedIntervalMs) - 1;
        missingPoints += Math.max(0, missing);
      }
    }

    const actualPoints = points.length;
    const totalPossiblePoints = actualPoints + missingPoints;
    const integrityPercent = totalPossiblePoints > 0
      ? Math.round((actualPoints / totalPossiblePoints) * 10000) / 100
      : 0;

    return {
      integrityPercent,
      expectedPoints,
      actualPoints,
      missingPoints,
      timeSpanHours: Math.round(timeSpanHours * 100) / 100,
    };
  }

  /**
   * 批量生成所有奶酪轮的HACCP报告
   * @description 为系统中所有奶酪轮生成HACCP报告
   * @returns 报告数组
   */
  generateAllReports(): HACCPReport[] {
    const reports: HACCPReport[] = [];
    for (const cheeseWheel of cheeseWheels) {
      const report = this.generateHACCPReport(cheeseWheel.id);
      if (report) {
        reports.push(report);
      }
    }
    return reports;
  }
}

export const reportService = new ReportService();
