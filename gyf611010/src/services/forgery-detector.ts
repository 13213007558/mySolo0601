import type { TemperaturePoint } from '../types';

/**
 * 伪造检测服务
 * @description 提供多种算法检测温度数据是否被人工伪造，包括线性伪造、时间戳异常和物理异常检测
 */
export class ForgeryDetector {
  /**
   * 检测线性伪造（人工直线）
   * @description 检测连续温度点的方差是否过小，判断是否为人工绘制的直线数据
   * @param points - 温度采样点数组
   * @param minWindowSize - 最小窗口大小，默认10个连续点
   * @returns 检测结果，包含是否伪造、最大连续伪造段、方差值等
   *
   * 算法逻辑：
   * 1. 检查点数是否足够（至少需要minWindowSize个点）
   * 2. 使用滑动窗口遍历所有连续的minWindowSize个点：
   *    - 计算窗口内温度值的均值
   *    - 计算方差：Σ((x - 均值)²) / n
   *    - 如果方差 < 0.01，说明温度几乎没有波动，可能是人工直线
   * 3. 检测完美线性相关：
   *    - 计算皮尔逊相关系数r（时间与温度的线性相关度）
   *    - 如果 |r| > 0.999，说明几乎完美线性，极可能是伪造
   * 4. 跟踪最长的连续伪造段
   * 5. 返回综合检测结果
   */
  detectLinearForgery(
    points: TemperaturePoint[],
    minWindowSize: number = 10
  ): {
    isForged: boolean;
    maxForgedLength: number;
    maxForgedStartIndex: number;
    maxForgedEndIndex: number;
    minVariance: number;
    maxCorrelation: number;
  } {
    if (points.length < minWindowSize) {
      return {
        isForged: false,
        maxForgedLength: 0,
        maxForgedStartIndex: -1,
        maxForgedEndIndex: -1,
        minVariance: Infinity,
        maxCorrelation: 0,
      };
    }

    let minVariance = Infinity;
    let maxCorrelation = 0;
    let currentForgedStart = -1;
    let maxForgedLength = 0;
    let maxForgedStart = -1;
    let maxForgedEnd = -1;

    for (let i = 0; i <= points.length - minWindowSize; i++) {
      const window = points.slice(i, i + minWindowSize);
      const temps = window.map(p => p.temperature);
      const timestamps = window.map(p => p.timestamp.getTime());

      const mean = temps.reduce((sum, t) => sum + t, 0) / temps.length;
      const variance = temps.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / temps.length;

      if (variance < minVariance) {
        minVariance = variance;
      }

      const meanTime = timestamps.reduce((sum, t) => sum + t, 0) / timestamps.length;
      const covariance = timestamps.reduce((sum, t, idx) => {
        return sum + (t - meanTime) * (temps[idx] - mean);
      }, 0) / timestamps.length;

      const varianceTime = timestamps.reduce((sum, t) => sum + Math.pow(t - meanTime, 2), 0) / timestamps.length;
      const varianceTemp = temps.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / temps.length;

      let correlation = 0;
      if (varianceTime > 0 && varianceTemp > 0) {
        correlation = covariance / Math.sqrt(varianceTime * varianceTemp);
      }
      const absCorrelation = Math.abs(correlation);
      if (absCorrelation > maxCorrelation) {
        maxCorrelation = absCorrelation;
      }

      const isLinearForgery = variance < 0.01 || absCorrelation > 0.999;

      if (isLinearForgery) {
        if (currentForgedStart === -1) {
          currentForgedStart = i;
        }

        const currentLength = i + minWindowSize - currentForgedStart;
        if (currentLength > maxForgedLength) {
          maxForgedLength = currentLength;
          maxForgedStart = currentForgedStart;
          maxForgedEnd = i + minWindowSize - 1;
        }
      } else {
        currentForgedStart = -1;
      }
    }

    return {
      isForged: maxForgedLength >= minWindowSize,
      maxForgedLength,
      maxForgedStartIndex: maxForgedStart,
      maxForgedEndIndex: maxForgedEnd,
      minVariance: Math.round(minVariance * 1000000) / 1000000,
      maxCorrelation: Math.round(maxCorrelation * 10000) / 10000,
    };
  }

  /**
   * 检测时间戳异常
   * @description 检查时间戳是否符合预期的采样间隔，检测是否存在时间造假
   * @param points - 温度采样点数组
   * @param expectedInterval - 期望的采样间隔（毫秒），默认30分钟
   * @returns 检测结果，包含是否异常、异常点列表等
   *
   * 算法逻辑：
   * 1. 检查点数是否足够（至少需要2个点）
   * 2. 计算所有相邻点之间的时间间隔
   * 3. 统计以下异常情况：
   *    - 间隔为0或负数：时间倒退或重复
   *    - 间隔与期望间隔偏差超过50%：间隔异常
   *    - 间隔完全相同（精确到毫秒）：可能是批量生成的伪造数据
   * 4. 检测时间戳模式：
   *    - 所有时间戳都是整分钟/整小时：可疑
   *    - 时间戳呈现规律性模式（如每30分钟整点）：可疑
   * 5. 统计异常比例，超过阈值则判定为异常
   */
  detectTimestampAnomaly(
    points: TemperaturePoint[],
    expectedInterval: number = 30 * 60 * 1000
  ): {
    isAnomalous: boolean;
    anomalyCount: number;
    anomalyPercent: number;
    zeroIntervals: number;
    negativeIntervals: number;
    exactSameIntervals: number;
    suspiciousPatterns: number;
    averageInterval: number;
    intervalStdDev: number;
    anomalousIndices: number[];
  } {
    if (points.length < 2) {
      return {
        isAnomalous: false,
        anomalyCount: 0,
        anomalyPercent: 0,
        zeroIntervals: 0,
        negativeIntervals: 0,
        exactSameIntervals: 0,
        suspiciousPatterns: 0,
        averageInterval: 0,
        intervalStdDev: 0,
        anomalousIndices: [],
      };
    }

    const intervals: number[] = [];
    const anomalousIndices: number[] = [];
    let zeroIntervals = 0;
    let negativeIntervals = 0;
    let exactSameIntervals = 0;
    let suspiciousPatterns = 0;

    for (let i = 1; i < points.length; i++) {
      const interval = points[i].timestamp.getTime() - points[i - 1].timestamp.getTime();
      intervals.push(interval);

      if (interval === 0) {
        zeroIntervals++;
        anomalousIndices.push(i);
      } else if (interval < 0) {
        negativeIntervals++;
        anomalousIndices.push(i);
      }

      const deviation = Math.abs(interval - expectedInterval) / expectedInterval;
      if (deviation > 0.5) {
        if (!anomalousIndices.includes(i)) {
          anomalousIndices.push(i);
        }
      }

      const minutes = points[i].timestamp.getMinutes();
      const seconds = points[i].timestamp.getSeconds();
      const milliseconds = points[i].timestamp.getMilliseconds();
      if (seconds === 0 && milliseconds === 0 && (minutes === 0 || minutes === 30)) {
        suspiciousPatterns++;
      }
    }

    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i] === intervals[i - 1] && intervals[i] > 0) {
        exactSameIntervals++;
      }
    }

    const meanInterval = intervals.reduce((sum, iv) => sum + iv, 0) / intervals.length;
    const variance = intervals.reduce((sum, iv) => sum + Math.pow(iv - meanInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    const anomalyCount = anomalousIndices.length;
    const anomalyPercent = (anomalyCount / (points.length - 1)) * 100;

    const sameIntervalRatio = exactSameIntervals / intervals.length;
    const suspiciousPatternRatio = suspiciousPatterns / points.length;

    const isAnomalous = anomalyPercent > 20 ||
                        sameIntervalRatio > 0.8 ||
                        suspiciousPatternRatio > 0.9 ||
                        negativeIntervals > 0;

    return {
      isAnomalous,
      anomalyCount,
      anomalyPercent: Math.round(anomalyPercent * 100) / 100,
      zeroIntervals,
      negativeIntervals,
      exactSameIntervals,
      suspiciousPatterns,
      averageInterval: Math.round(meanInterval),
      intervalStdDev: Math.round(stdDev),
      anomalousIndices,
    };
  }

  /**
   * 检测物理异常
   * @description 根据热力学原理检测温度变化速率是否超出物理可能范围
   * @param points - 温度采样点数组
   * @returns 检测结果，包含是否异常、最大升温/降温速率等
   *
   * 算法逻辑：
   * 1. 基于热力学原理，奶酪等固体的温度变化速率有物理极限
   * 2. 正常情况下，奶酪中心温度变化速率不会超过：
   *    - 升温：0.5℃/分钟（环境温度显著高于奶酪时）
   *    - 降温：0.3℃/分钟（环境温度显著低于奶酪时）
   * 3. 检测逻辑：
   *    - 计算每个采样间隔内的温度变化速率（℃/分钟）
   *    - 检测是否有超出物理极限的速率
   *    - 检测温度变化是否缺乏惯性（频繁方向突变）
   *    - 检测温度是否完全恒定（不符合真实物理过程）
   * 4. 统计异常点数量和比例
   */
  detectPhysicalAnomaly(points: TemperaturePoint[]): {
    isAnomalous: boolean;
    maxHeatingRate: number;
    maxCoolingRate: number;
    excessiveRateCount: number;
    directionChanges: number;
    constantTemperatureCount: number;
    anomalyPercent: number;
    anomalousIndices: number[];
  } {
    if (points.length < 3) {
      return {
        isAnomalous: false,
        maxHeatingRate: 0,
        maxCoolingRate: 0,
        excessiveRateCount: 0,
        directionChanges: 0,
        constantTemperatureCount: 0,
        anomalyPercent: 0,
        anomalousIndices: [],
      };
    }

    const MAX_HEATING_RATE = 0.5;
    const MAX_COOLING_RATE = 0.3;

    let maxHeatingRate = 0;
    let maxCoolingRate = 0;
    let excessiveRateCount = 0;
    let directionChanges = 0;
    let constantTemperatureCount = 0;
    const anomalousIndices: number[] = [];

    let lastDirection = 0;

    for (let i = 1; i < points.length; i++) {
      const timeDiffMinutes = (points[i].timestamp.getTime() - points[i - 1].timestamp.getTime()) / 60000;
      const tempDiff = points[i].temperature - points[i - 1].temperature;

      if (timeDiffMinutes <= 0) {
        continue;
      }

      const rate = tempDiff / timeDiffMinutes;

      if (tempDiff === 0) {
        constantTemperatureCount++;
      }

      if (rate > maxHeatingRate) {
        maxHeatingRate = rate;
      }
      if (rate < maxCoolingRate) {
        maxCoolingRate = rate;
      }

      if (rate > MAX_HEATING_RATE || rate < -MAX_COOLING_RATE) {
        excessiveRateCount++;
        anomalousIndices.push(i);
      }

      const currentDirection = tempDiff > 0 ? 1 : (tempDiff < 0 ? -1 : 0);
      if (currentDirection !== 0 && lastDirection !== 0 && currentDirection !== lastDirection) {
        directionChanges++;
      }
      if (currentDirection !== 0) {
        lastDirection = currentDirection;
      }
    }

    const totalIntervals = points.length - 1;
    const anomalyCount = excessiveRateCount + Math.floor(directionChanges / 2);
    const anomalyPercent = totalIntervals > 0 ? (anomalyCount / totalIntervals) * 100 : 0;

    const directionChangeRate = totalIntervals > 1 ? directionChanges / (totalIntervals - 1) : 0;
    const constantTempRatio = totalIntervals > 0 ? constantTemperatureCount / totalIntervals : 0;

    const isAnomalous = anomalyPercent > 10 ||
                        directionChangeRate > 0.5 ||
                        constantTempRatio > 0.5 ||
                        maxHeatingRate > MAX_HEATING_RATE * 2 ||
                        maxCoolingRate < -MAX_COOLING_RATE * 2;

    return {
      isAnomalous,
      maxHeatingRate: Math.round(maxHeatingRate * 1000) / 1000,
      maxCoolingRate: Math.round(maxCoolingRate * 1000) / 1000,
      excessiveRateCount,
      directionChanges,
      constantTemperatureCount,
      anomalyPercent: Math.round(anomalyPercent * 100) / 100,
      anomalousIndices,
    };
  }

  /**
   * 综合判断是否伪造
   * @description 综合线性伪造、时间戳异常和物理异常三种检测结果，给出最终判断
   * @param points - 温度采样点数组
   * @param expectedInterval - 期望采样间隔（毫秒），默认30分钟
   * @returns 综合检测结果，包含各分项检测结果和最终判断
   *
   * 算法逻辑：
   * 1. 分别运行三种检测算法：
   *    - 线性伪造检测（detectLinearForgery）
   *    - 时间戳异常检测（detectTimestampAnomaly）
   *    - 物理异常检测（detectPhysicalAnomaly）
   * 2. 加权评分：
   *    - 线性伪造：权重 0.4（最能体现人工造假特征）
   *    - 时间戳异常：权重 0.3
   *    - 物理异常：权重 0.3
   * 3. 评分规则：
   *    - 单项检测为阳性得100分，否则根据异常程度给0-50分
   *    - 综合得分 = Σ(单项得分 × 权重)
   * 4. 判定规则：
   *    - 综合得分 ≥ 60：判定为伪造
   *    - 综合得分 ≥ 40：可疑，建议人工复核
   *    - 综合得分 < 40：正常
   * 5. 任意单项检测为强阳性时，直接判定为伪造
   */
  isForged(
    points: TemperaturePoint[],
    expectedInterval: number = 30 * 60 * 1000
  ): {
    forged: boolean;
    suspicious: boolean;
    confidence: number;
    overallScore: number;
    linearResult: ReturnType<ForgeryDetector['detectLinearForgery']>;
    timestampResult: ReturnType<ForgeryDetector['detectTimestampAnomaly']>;
    physicalResult: ReturnType<ForgeryDetector['detectPhysicalAnomaly']>;
    reasons: string[];
  } {
    const linearResult = this.detectLinearForgery(points);
    const timestampResult = this.detectTimestampAnomaly(points, expectedInterval);
    const physicalResult = this.detectPhysicalAnomaly(points);

    const reasons: string[] = [];

    let linearScore = 0;
    if (linearResult.isForged) {
      linearScore = 100;
      reasons.push(`检测到线性伪造：连续${linearResult.maxForgedLength}个点方差<0.01`);
    } else if (linearResult.minVariance < 0.05) {
      linearScore = 40;
      reasons.push(`温度波动异常小：最小方差=${linearResult.minVariance}`);
    } else if (linearResult.maxCorrelation > 0.99) {
      linearScore = 50;
      reasons.push(`高度线性相关：相关系数=${linearResult.maxCorrelation}`);
    }

    let timestampScore = 0;
    if (timestampResult.isAnomalous) {
      timestampScore = 100;
      reasons.push(`时间戳异常：${timestampResult.anomalyPercent}%的时间间隔异常`);
      if (timestampResult.negativeIntervals > 0) {
        reasons.push(`存在${timestampResult.negativeIntervals}处时间倒退`);
      }
    } else if (timestampResult.anomalyPercent > 10) {
      timestampScore = 40;
      reasons.push(`部分时间戳可疑：${timestampResult.anomalyPercent}%异常`);
    }

    let physicalScore = 0;
    if (physicalResult.isAnomalous) {
      physicalScore = 100;
      reasons.push(`物理异常：温度变化速率超出物理极限`);
      if (physicalResult.maxHeatingRate > 1) {
        reasons.push(`最大升温速率=${physicalResult.maxHeatingRate}℃/分钟`);
      }
    } else if (physicalResult.anomalyPercent > 5) {
      physicalScore = 30;
      reasons.push(`部分温度变化可疑：${physicalResult.anomalyPercent}%异常`);
    }

    const overallScore = linearScore * 0.4 + timestampScore * 0.3 + physicalScore * 0.3;

    const strongEvidence = linearResult.isForged ||
                          timestampResult.negativeIntervals > 0 ||
                          physicalResult.maxHeatingRate > 1 ||
                          physicalResult.maxCoolingRate < -1;

    const forged = strongEvidence || overallScore >= 60;
    const suspicious = overallScore >= 40 && overallScore < 60;

    const confidence = forged
      ? Math.min(99, overallScore + 10)
      : suspicious
        ? Math.round(overallScore)
        : Math.round(100 - overallScore);

    return {
      forged,
      suspicious,
      confidence,
      overallScore: Math.round(overallScore * 100) / 100,
      linearResult,
      timestampResult,
      physicalResult,
      reasons,
    };
  }

  /**
   * 批量检测多条温度曲线
   * @description 对多条温度曲线进行批量伪造检测
   * @param curves - 多条温度曲线数组
   * @param expectedInterval - 期望采样间隔
   * @returns 检测结果数组
   */
  batchDetect(
    curves: TemperaturePoint[][],
    expectedInterval: number = 30 * 60 * 1000
  ): Array<ReturnType<ForgeryDetector['isForged']>> {
    return curves.map(curve => this.isForged(curve, expectedInterval));
  }
}

export const forgeryDetector = new ForgeryDetector();
