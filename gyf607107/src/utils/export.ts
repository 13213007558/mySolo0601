import type { Alarm, OperationHistory, SupplementNote, ExportConfig } from '@/types';
import { maskPhone } from './mask';

export interface ExportValidationResult {
  data: Alarm[];
  warnings: string[];
}

export const validateExportConsistency = (
  alarms: Alarm[],
  cardStats: Record<string, number>
): ExportValidationResult => {
  const warnings: string[] = [];
  const exportStats = {
    total: alarms.length,
    pending: alarms.filter((a) => a.status === 'pending').length,
    processing: alarms.filter((a) => a.status === 'processing').length,
    completed: alarms.filter((a) => a.status === 'completed').length,
    reviewed: alarms.filter((a) => a.status === 'reviewed').length,
    withdrawn: alarms.filter((a) => a.status === 'withdrawn').length,
  };

  Object.entries(cardStats).forEach(([key, value]) => {
    const statKey = key as keyof typeof exportStats;
    if (exportStats[statKey] !== undefined && exportStats[statKey] !== value) {
      warnings.push(
        `[${key}] 卡片显示${value}，实际${exportStats[statKey]}，已保留原值导出`
      );
    }
  });

  return { data: alarms, warnings };
};

export const exportToJSON = (
  alarms: Alarm[],
  history: OperationHistory[],
  supplements: SupplementNote[],
  config: ExportConfig
): string => {
  const processedAlarms = config.maskPhone
    ? alarms.map((a) => ({ ...a, contactPhone: maskPhone(a.contactPhone) }))
    : alarms;

  const exportData: Record<string, unknown> = {
    exportTime: new Date().toISOString(),
    alarms: processedAlarms,
  };

  if (config.includeHistory) {
    exportData.operationHistory = history;
  }

  if (config.includeSupplement) {
    exportData.supplementNotes = supplements;
  }

  return JSON.stringify(exportData, null, 2);
};

export const exportToCSV = (
  alarms: Alarm[],
  config: ExportConfig
): string => {
  const headers = [
    'ID',
    '站点名称',
    '叶片编号',
    '缺陷类型',
    '严重程度',
    '状态',
    '处理结论',
    '联系电话',
    '处理人',
    '创建时间',
    '更新时间',
    '手工补录',
  ];

  const processedAlarms = config.maskPhone
    ? alarms.map((a) => ({ ...a, contactPhone: maskPhone(a.contactPhone) }))
    : alarms;

  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已处理',
    reviewed: '已复核',
    withdrawn: '已撤回',
  };

  const severityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重',
  };

  const rows = processedAlarms.map((alarm) => [
    alarm.id,
    alarm.siteName,
    alarm.bladeNo,
    alarm.defectType,
    severityMap[alarm.severity] || alarm.severity,
    statusMap[alarm.status] || alarm.status,
    alarm.conclusion,
    alarm.contactPhone,
    alarm.handler,
    alarm.createdAt,
    alarm.updatedAt,
    alarm.isManualSupplement ? '是' : '否',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
};

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
