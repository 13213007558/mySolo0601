import type { TemperaturePoint, AnomalyEvent } from '../types';
import { users } from '../utils/mock-data';

/**
 * 告警服务
 * @description 提供温度异常检测、短信通知、告警确认和活跃告警查询等功能
 */
export class AlertService {
  private activeAlerts: Map<string, AnomalyEvent> = new Map();
  private alertIdCounter: number = 0;

  /**
   * 检测温度异常升温
   * @description 分析温度曲线，检测是否存在超过阈值的异常升温现象
   * @param points - 温度采样点数组
   * @param threshold - 温度升高阈值（摄氏度），默认2℃
   * @returns 检测结果对象，包含是否异常、最大升温幅度和异常点位置
   *
   * 算法逻辑：
   * 1. 检查点数是否足够（至少需要2个点才能计算升温）
   * 2. 遍历温度点数组，计算相邻点之间的温度差
   * 3. 记录所有正温度差（升温），并跟踪最大升温值
   * 4. 连续升温检测：
   *    - 维护当前连续升温序列的起点和累计升温值
   *    - 如果当前点温度 > 前一点温度，继续累计
   *    - 否则重置连续升温序列
   *    - 每次累计后检查是否超过阈值
   * 5. 窗口检测：计算所有长度为5的滑动窗口内的总升温
   * 6. 返回最大升温值及其位置
   */
  checkTemperatureSpike(
    points: TemperaturePoint[],
    threshold: number = 2
  ): {
    hasSpike: boolean;
    maxIncrease: number;
    spikeStartIndex: number;
    spikeEndIndex: number;
  } {
    if (points.length < 2) {
      return { hasSpike: false, maxIncrease: 0, spikeStartIndex: -1, spikeEndIndex: -1 };
    }

    let maxIncrease = 0;
    let startIndex = -1;
    let endIndex = -1;
    let currentStart = 0;
    let currentIncrease = 0;

    for (let i = 1; i < points.length; i++) {
      const diff = points[i].temperature - points[i - 1].temperature;

      if (diff > 0) {
        currentIncrease += diff;
        if (currentIncrease > maxIncrease) {
          maxIncrease = currentIncrease;
          startIndex = currentStart;
          endIndex = i;
        }
      } else {
        currentStart = i;
        currentIncrease = 0;
      }
    }

    const windowSize = Math.min(5, points.length);
    for (let i = 0; i <= points.length - windowSize; i++) {
      const windowIncrease = points[i + windowSize - 1].temperature - points[i].temperature;
      if (windowIncrease > maxIncrease) {
        maxIncrease = windowIncrease;
        startIndex = i;
        endIndex = i + windowSize - 1;
      }
    }

    return {
      hasSpike: maxIncrease >= threshold,
      maxIncrease: Math.round(maxIncrease * 100) / 100,
      spikeStartIndex: startIndex,
      spikeEndIndex: endIndex,
    };
  }

  /**
   * 模拟发送短信通知
   * @description 向指定的接收人列表发送告警短信通知（模拟实现）
   * @param recipients - 接收人ID列表或电话号码列表
   * @param message - 短信内容
   * @returns 发送结果对象，包含成功状态、成功发送的接收人和失败原因
   *
   * 算法逻辑：
   * 1. 遍历接收人列表，逐个处理
   * 2. 对于用户ID，先查找对应的用户信息获取电话号码
   * 3. 对于直接传入的电话号码，直接使用
   * 4. 模拟发送过程：
   *    - 90%概率发送成功
   *    - 10%概率模拟发送失败（如网络错误）
   * 5. 记录每个接收人的发送状态
   * 6. 返回汇总结果，包括成功数、失败数和详细列表
   */
  sendSmsNotification(
    recipients: string[],
    message: string
  ): {
    success: boolean;
    sentTo: string[];
    failed: string[];
    failureReasons: Map<string, string>;
  } {
    const sentTo: string[] = [];
    const failed: string[] = [];
    const failureReasons = new Map<string, string>();

    for (const recipient of recipients) {
      let phoneNumber = recipient;

      const user = users.find(u => u.id === recipient || u.email === recipient);
      if (user) {
        phoneNumber = recipient;
      }

      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        sentTo.push(recipient);
        console.log(`[SMS] 已发送至 ${phoneNumber}: ${message}`);
      } else {
        failed.push(recipient);
        failureReasons.set(recipient, '网络异常，短信发送失败');
        console.log(`[SMS] 发送失败至 ${phoneNumber}: 网络异常`);
      }
    }

    return {
      success: failed.length === 0,
      sentTo,
      failed,
      failureReasons,
    };
  }

  /**
   * 确认告警
   * @description 由用户确认处理告警，标记告警为已确认状态
   * @param alertId - 告警ID
   * @param userId - 确认人用户ID
   * @returns 确认结果对象，包含成功状态和更新后的告警信息
   *
   * 算法逻辑：
   * 1. 根据告警ID查找活跃告警列表中的告警
   * 2. 检查告警是否存在且未被确认
   * 3. 根据用户ID查找用户信息，验证用户是否存在且未锁定
   * 4. 如果验证通过：
   *    - 设置 acknowledged 为 true
   *    - 记录确认人 userId
   *    - 从活跃告警列表中移除（已确认的不再活跃）
   * 5. 返回确认结果和更新后的告警信息
   * 6. 如果告警不存在或已确认，返回相应错误信息
   */
  acknowledgeAlert(
    alertId: string,
    userId: string
  ): {
    success: boolean;
    message: string;
    alert?: AnomalyEvent;
  } {
    const alert = this.activeAlerts.get(alertId);

    if (!alert) {
      return {
        success: false,
        message: '告警不存在或已被处理',
      };
    }

    if (alert.acknowledged) {
      return {
        success: false,
        message: '该告警已被确认',
        alert,
      };
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return {
        success: false,
        message: '用户不存在',
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        message: '用户账户未激活，无法确认告警',
      };
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    this.activeAlerts.delete(alertId);

    return {
      success: true,
      message: '告警确认成功',
      alert,
    };
  }

  /**
   * 获取活跃告警列表
   * @description 返回当前所有未确认的活跃告警
   * @returns 活跃告警数组，按时间倒序排列
   *
   * 算法逻辑：
   * 1. 从活跃告警Map中获取所有告警值
   * 2. 筛选出未确认的告警（理论上Map中只存储未确认告警）
   * 3. 按发生时间倒序排序，最新的告警排在前面
   * 4. 如果需要，可按严重程度进一步排序：critical > high > medium > low
   * 5. 返回排序后的告警数组
   */
  getActiveAlerts(): AnomalyEvent[] {
    const alerts = Array.from(this.activeAlerts.values()).filter(
      alert => !alert.acknowledged
    );

    const severityOrder: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    alerts.sort((a, b) => {
      const timeDiff = b.timestamp.getTime() - a.timestamp.getTime();
      if (timeDiff !== 0) {
        return timeDiff;
      }
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });

    return alerts;
  }

  /**
   * 创建并添加新告警
   * @description 创建新的异常事件告警并添加到活跃告警列表
   * @param recordId - 关联记录ID
   * @param type - 告警类型
   * @param severity - 严重程度
   * @param timestamp - 发生时间
   * @returns 创建的告警事件
   */
  addAlert(
    recordId: string,
    type: 'temperature_spike' | 'forgery_detected' | 'data_interruption',
    severity: 'low' | 'medium' | 'high' | 'critical',
    timestamp: Date = new Date()
  ): AnomalyEvent {
    this.alertIdCounter++;
    const alert: AnomalyEvent = {
      id: `ALERT-${Date.now()}-${this.alertIdCounter}`,
      recordId,
      type,
      severity,
      timestamp,
      acknowledged: false,
      acknowledgedBy: '',
    };

    this.activeAlerts.set(alert.id, alert);
    return alert;
  }

  /**
   * 根据温度检测结果自动创建告警
   * @description 基于温度异常检测结果，自动创建相应级别的告警
   * @param recordId - 关联记录ID
   * @param spikeResult - 温度异常检测结果
   * @returns 创建的告警（如果达到告警级别）
   */
  createAlertFromSpike(
    recordId: string,
    spikeResult: ReturnType<AlertService['checkTemperatureSpike']>
  ): AnomalyEvent | null {
    if (!spikeResult.hasSpike) {
      return null;
    }

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (spikeResult.maxIncrease >= 5) {
      severity = 'critical';
    } else if (spikeResult.maxIncrease >= 3.5) {
      severity = 'high';
    } else if (spikeResult.maxIncrease >= 2.5) {
      severity = 'medium';
    }

    return this.addAlert(recordId, 'temperature_spike', severity);
  }
}

export const alertService = new AlertService();
