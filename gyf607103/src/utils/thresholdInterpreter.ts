import type { ThresholdConfig, ThresholdAlert, RoofShadowRecord } from '@/types';

const interpretShadowHours = (hours: number, config: ThresholdConfig): { level: 'normal' | 'warning' | 'danger'; text: string } => {
  if (hours >= config.dangerShadowHours) {
    const dropPercent = Math.round((hours - config.dangerShadowHours) * 7 + 40);
    return {
      level: 'danger',
      text: `阴影时长${hours}小时，超过红线${config.dangerShadowHours}小时，发电效率预计下降${dropPercent}%`,
    };
  }
  if (hours >= config.warningShadowHours) {
    const dropPercent = Math.round((hours - config.warningShadowHours) * 5 + 20);
    return {
      level: 'warning',
      text: `阴影时长${hours}小时，接近警戒值${config.warningShadowHours}小时，发电效率预计下降${dropPercent}%`,
    };
  }
  return {
    level: 'normal',
    text: `阴影时长${hours}小时，处于正常范围，发电效率稳定`,
  };
};

const interpretEfficiency = (efficiency: number, config: ThresholdConfig): { level: 'normal' | 'warning' | 'danger'; text: string } => {
  if (efficiency <= config.dangerEfficiency) {
    const loss = Math.round((100 - efficiency) * 1.2);
    return {
      level: 'danger',
      text: `发电效率${efficiency}%，低于红线${config.dangerEfficiency}%，每日预估损失${loss}度电`,
    };
  }
  if (efficiency <= config.warningEfficiency) {
    const loss = Math.round((100 - efficiency) * 0.8);
    return {
      level: 'warning',
      text: `发电效率${efficiency}%，接近警戒值${config.warningEfficiency}%，每日预估损失${loss}度电`,
    };
  }
  return {
    level: 'normal',
    text: `发电效率${efficiency}%，运行状态良好`,
  };
};

export const getThresholdAlerts = (
  records: RoofShadowRecord[],
  config: ThresholdConfig
): ThresholdAlert[] => {
  if (records.length === 0) return [];

  const dangerRecords = records.filter(r => r.status === 'danger');
  const warningRecords = records.filter(r => r.status === 'warning');
  
  const alerts: ThresholdAlert[] = [];
  
  if (dangerRecords.length > 0) {
    const worstShadow = Math.max(...dangerRecords.map(r => r.shadowHours));
    const shadowInfo = interpretShadowHours(worstShadow, config);
    alerts.push({
      type: 'danger',
      title: `${dangerRecords.length}条记录处于危险状态`,
      description: shadowInfo.text + '，建议立即排查遮挡源，考虑调整发电调度计划。',
      affectedCount: dangerRecords.length,
    });
  }
  
  if (warningRecords.length > 0) {
    const avgEfficiency = Math.round(
      warningRecords.reduce((sum, r) => sum + r.powerEfficiency, 0) / warningRecords.length * 10
    ) / 10;
    const effInfo = interpretEfficiency(avgEfficiency, config);
    alerts.push({
      type: 'warning',
      title: `${warningRecords.length}条记录需要关注`,
      description: effInfo.text + '，建议安排现场巡检，确认是否有新增遮挡物。',
      affectedCount: warningRecords.length,
    });
  }
  
  if (alerts.length === 0) {
    alerts.push({
      type: 'normal',
      title: '所有屋顶运行状态正常',
      description: `${records.length}条记录全部在正常阈值范围内，发电效率稳定。`,
      affectedCount: records.length,
    });
  }
  
  return alerts;
};

export const interpretRecord = (
  record: RoofShadowRecord,
  config: ThresholdConfig
): string => {
  const shadowInfo = interpretShadowHours(record.shadowHours, config);
  const effInfo = interpretEfficiency(record.powerEfficiency, config);
  
  const worseLevel = shadowInfo.level === 'danger' || effInfo.level === 'danger'
    ? 'danger'
    : shadowInfo.level === 'warning' || effInfo.level === 'warning'
      ? 'warning'
      : 'normal';
  
  if (worseLevel === 'danger') {
    return shadowInfo.level === 'danger' ? shadowInfo.text : effInfo.text;
  }
  if (worseLevel === 'warning') {
    return shadowInfo.level === 'warning' ? shadowInfo.text : effInfo.text;
  }
  return shadowInfo.text;
};

export const getStatusColor = (status: 'normal' | 'warning' | 'danger'): string => {
  switch (status) {
    case 'normal': return 'bg-success-500';
    case 'warning': return 'bg-warning-500';
    case 'danger': return 'bg-danger-500';
  }
};

export const getStatusBgColor = (status: 'normal' | 'warning' | 'danger'): string => {
  switch (status) {
    case 'normal': return 'bg-success-50 text-success-800 border-success-200';
    case 'warning': return 'bg-warning-50 text-warning-800 border-warning-200';
    case 'danger': return 'bg-danger-50 text-danger-800 border-danger-200';
  }
};
