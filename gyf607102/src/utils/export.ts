import type { FuseAlarm, ExportData } from '@/types';

export const EXPORT_VERSION = '1.0.0';

export const exportToJson = (data: FuseAlarm[], filename?: string): void => {
  const exportData: ExportData = {
    exportTime: new Date().toISOString(),
    version: EXPORT_VERSION,
    data
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `熔丝告警数据_${new Date().toISOString().slice(0, 10)}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    normal: '正常',
    abnormal: '异常',
    pending: '待处理',
    resolved: '已解决'
  };
  return map[status] || status;
};

export const getProcessStatusText = (status: string): string => {
  const map: Record<string, string> = {
    received: '已接收',
    processing: '处理中',
    pending_review: '待复核',
    completed: '已完成',
    withdrawn: '已撤回'
  };
  return map[status] || status;
};

export const getActionText = (action: string): string => {
  const map: Record<string, string> = {
    create: '创建记录',
    submit: '提交结论',
    withdraw: '撤回结论',
    resubmit: '重新提交',
    manual_upload: '手工补录',
    export: '导出数据',
    import: '导入数据'
  };
  return map[action] || action;
};
