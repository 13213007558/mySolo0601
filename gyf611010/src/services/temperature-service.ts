import type { TemperaturePoint } from '../types';
import { cheeseWheels } from '../utils/mock-data';

/**
 * 温度采样回调函数类型
 */
export type TemperatureCallback = (point: TemperaturePoint, cheeseWheelId: string) => void;

/**
 * 温度数据服务
 * @description 提供温度采样、探针检测、目标区间判断和稳定时间计算等功能
 */
export class TemperatureService {
  private samplingTimer: ReturnType<typeof setInterval> | null = null;
  private baseTemperature: number = 12;

  /**
   * 开始温度采样
   * @description 每5秒模拟生成一个温度采样点，通过回调函数返回
   * @param cheeseWheelId - 奶酪轮ID
   * @param callback - 温度数据回调函数
   *
   * 算法逻辑：
   * 1. 停止之前可能存在的采样任务
   * 2. 查找对应的奶酪轮获取目标温度范围
   * 3. 以目标温度范围的中间值为基准，模拟真实温度波动
   * 4. 温度波动采用随机漫步 + 均值回归模型：
   *    - 随机漫步：加入±0.1℃的随机噪声模拟真实测量误差
   *    - 均值回归：当温度偏离目标值时，以5%的拉力拉回目标值
   *    - 边界限制：温度不会超出目标范围±0.5℃
   * 5. 每5秒生成一个新的采样点并调用回调
   */
  startSampling(cheeseWheelId: string, callback: TemperatureCallback): void {
    this.stopSampling();

    const cheeseWheel = cheeseWheels.find(cw => cw.id === cheeseWheelId);

    let targetMin = 12;
    let targetMax = 14;

    if (cheeseWheel) {
      targetMin = cheeseWheel.targetTemperatureMin;
      targetMax = cheeseWheel.targetTemperatureMax;
    }

    const targetTemp = (targetMin + targetMax) / 2;
    this.baseTemperature = targetTemp;

    this.samplingTimer = setInterval(() => {
      const randomWalk = (Math.random() - 0.5) * 0.2;
      const pullback = (targetTemp - this.baseTemperature) * 0.05;
      this.baseTemperature += randomWalk + pullback;
      this.baseTemperature = Math.max(targetMin - 0.5, Math.min(targetMax + 0.5, this.baseTemperature));

      const point: TemperaturePoint = {
        timestamp: new Date(),
        temperature: Math.round(this.baseTemperature * 100) / 100,
        probeDepth: 8 + Math.random() * 2,
        status: 'valid',
      };

      callback(point, cheeseWheelId);
    }, 5000);
  }

  /**
   * 停止温度采样
   * @description 清除定时器，停止温度采样任务
   *
   * 算法逻辑：
   * 1. 检查是否存在采样定时器
   * 2. 如果存在则清除定时器并置空
   * 3. 重置当前奶酪轮ID
   */
  stopSampling(): void {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = null;
    }
  }

  /**
   * 检测探针拔出
   * @description 通过分析温度曲线的骤降特征，判断温度探针是否被拔出
   * @param points - 温度采样点数组
   * @returns 检测结果对象，包含是否拔出、骤降幅度和检测点位置
   *
   * 算法逻辑：
   * 1. 首先检查点数是否足够（至少需要3个点来计算10秒窗口）
   * 2. 滑动窗口遍历所有可能的10秒时间窗口：
   *    - 窗口起点从第0个点开始
   *    - 窗口终点需要满足时间差≥10秒
   *    - 计算窗口内的最高温度和最低温度
   *    - 计算温度下降幅度（最高温 - 最低温）
   * 3. 骤降判定条件：
   *    - 温度下降幅度≥5℃
   *    - 温度变化呈持续下降趋势（最高点在最低点之前）
   * 4. 返回检测结果，包含最大降幅和位置信息
   */
  detectProbeRemoval(points: TemperaturePoint[]): {
    removed: boolean;
    dropMagnitude: number;
    detectedAt: number;
  } {
    if (points.length < 3) {
      return { removed: false, dropMagnitude: 0, detectedAt: -1 };
    }

    let maxDrop = 0;
    let detectedIndex = -1;

    for (let i = 0; i < points.length - 2; i++) {
      let j = i + 1;
      while (j < points.length) {
        const timeDiff = points[j].timestamp.getTime() - points[i].timestamp.getTime();
        if (timeDiff >= 10000) {
          break;
        }
        j++;
      }

      if (j >= points.length) {
        continue;
      }

      const windowPoints = points.slice(i, j + 1);
      const temps = windowPoints.map(p => p.temperature);
      const maxTemp = Math.max(...temps);
      const minTemp = Math.min(...temps);
      const drop = maxTemp - minTemp;

      const maxIndex = temps.indexOf(maxTemp);
      const minIndex = temps.indexOf(minTemp);

      if (drop >= 5 && maxIndex < minIndex) {
        if (drop > maxDrop) {
          maxDrop = drop;
          detectedIndex = i + minIndex;
        }
      }
    }

    return {
      removed: maxDrop >= 5,
      dropMagnitude: Math.round(maxDrop * 100) / 100,
      detectedAt: detectedIndex,
    };
  }

  /**
   * 检查温度是否在目标区间内
   * @description 判断给定温度值是否落在指定的目标温度范围内
   * @param temperature - 待检测的温度值（摄氏度）
   * @param targetRange - 目标温度区间 [最低温度, 最高温度]
   * @returns 是否在目标区间内
   *
   * 算法逻辑：
   * 1. 解构目标区间得到最低温度和最高温度
   * 2. 判断温度是否大于等于最低温度且小于等于最高温度
   * 3. 边界值包含在内（闭区间判断）
   */
  isInTargetRange(temperature: number, targetRange: [number, number]): boolean {
    const [min, max] = targetRange;
    return temperature >= min && temperature <= max;
  }

  /**
   * 计算温度稳定在目标区间的时长
   * @description 统计温度曲线中连续处于目标区间内的最长持续时间
   * @param points - 温度采样点数组
   * @param targetRange - 目标温度区间 [最低温度, 最高温度]
   * @returns 稳定时长（毫秒），以及稳定区间的起止索引
   *
   * 算法逻辑：
   * 1. 初始化变量记录当前连续区间和最长连续区间
   * 2. 遍历所有温度点：
   *    - 如果当前点在目标区间内，延长当前连续区间
   *    - 如果不在目标区间内，结算当前连续区间并重置
   * 3. 每次延长当前连续区间后，检查是否超过最长记录
   * 4. 遍历结束后，结算最后一个可能的连续区间
   * 5. 根据最长连续区间的起止点计算持续时间
   * 6. 如果没有任何点在目标区间内，返回0
   */
  calculateStableTime(
    points: TemperaturePoint[],
    targetRange: [number, number]
  ): {
    stableDuration: number;
    longestStartIndex: number;
    longestEndIndex: number;
  } {
    if (points.length === 0) {
      return { stableDuration: 0, longestStartIndex: -1, longestEndIndex: -1 };
    }

    let currentStart = -1;
    let longestStart = -1;
    let longestEnd = -1;
    let maxDuration = 0;

    for (let i = 0; i < points.length; i++) {
      const inRange = this.isInTargetRange(points[i].temperature, targetRange);

      if (inRange) {
        if (currentStart === -1) {
          currentStart = i;
        }

        const currentDuration = points[i].timestamp.getTime() - points[currentStart].timestamp.getTime();
        if (currentDuration > maxDuration) {
          maxDuration = currentDuration;
          longestStart = currentStart;
          longestEnd = i;
        }
      } else {
        currentStart = -1;
      }
    }

    return {
      stableDuration: maxDuration,
      longestStartIndex: longestStart,
      longestEndIndex: longestEnd,
    };
  }
}

export const temperatureService = new TemperatureService();
