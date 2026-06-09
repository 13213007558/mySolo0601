import type { Inverter, ExportSummary } from '../types';

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    normal: '正常',
    warning: '告警',
    error: '故障',
    passed: '已通过',
    failed: '未通过',
    pending: '待拍板',
    auto: '自动采集',
    manual: '手工补录',
    completed: '已完成',
    delayed: '延迟',
  };
  return map[status] || status;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    normal: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    passed: 'bg-emerald-500',
    failed: 'bg-red-500',
    pending: 'bg-slate-500',
    auto: 'bg-blue-500',
    manual: 'bg-amber-500',
    completed: 'bg-emerald-500',
    delayed: 'bg-orange-500',
  };
  return map[status] || 'bg-slate-500';
};

export const generateExportSummary = (inverters: Inverter[]): ExportSummary => {
  const totalCount = inverters.length;
  const abnormalCount = inverters.filter((i) => i.status !== 'normal').length;
  const passedCount = inverters.filter((i) => i.conclusion === 'passed').length;
  const pendingCount = inverters.filter((i) => i.isPending).length;

  const reasonMap = new Map<string, number>();
  const handlerMap = new Map<string, number>();

  inverters.forEach((inv) => {
    if (inv.pendingReason) {
      reasonMap.set(inv.pendingReason, (reasonMap.get(inv.pendingReason) || 0) + 1);
    }
    handlerMap.set(inv.handler, (handlerMap.get(inv.handler) || 0) + 1);
  });

  const reasons = Array.from(reasonMap.entries()).map(([reason, count]) => ({
    reason,
    count,
  }));

  const handlers = Array.from(handlerMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  const pendingRecords = inverters
    .filter((i) => i.isPending)
    .map((i) => ({
      inverterName: i.name,
      reason: i.pendingReason || '未知原因',
      handler: i.handler,
    }));

  return {
    totalCount,
    abnormalCount,
    passedCount,
    pendingCount,
    reasons,
    handlers,
    pendingRecords,
    exportTime: new Date().toISOString(),
  };
};

export const generateExportText = (summary: ExportSummary): string => {
  const month = new Date(summary.exportTime).getMonth() + 1;
  const year = new Date(summary.exportTime).getFullYear();

  let text = `【光伏逆变器复核摘要 - ${year}年${month}月】\n`;
  text += '────────────────────────\n';
  text += `总计复核：${summary.totalCount} 台\n`;
  text += `异常数量：${summary.abnormalCount} 台\n`;
  text += `已通过：${summary.passedCount} 台\n`;
  text += `未拍板：${summary.pendingCount} 台\n\n`;

  if (summary.reasons.length > 0) {
    text += '原因分类：\n';
    summary.reasons.forEach((r) => {
      text += `  ${r.reason}：${r.count} 台\n`;
    });
    text += '\n';
  }

  text += '处理人清单：\n';
  summary.handlers.forEach((h) => {
    text += `  ${h.name}：${h.count} 台\n`;
  });
  text += '\n';

  if (summary.pendingRecords.length > 0) {
    text += '未拍板记录：\n';
    summary.pendingRecords.forEach((p) => {
      text += `  ${p.inverterName}：${p.reason} - ${p.handler}\n`;
    });
    text += '\n';
  }

  text += `导出时间：${formatDate(summary.exportTime)}\n`;

  return text;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
};

export const downloadTextFile = (text: string, filename: string): void => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getTemperatureDiffClass = (
  original: number | undefined,
  current: number
): string => {
  if (original === undefined) return '';
  const diff = Math.abs(current - original);
  if (diff >= 3) return 'text-red-500 font-bold';
  if (diff >= 1) return 'text-amber-500';
  return '';
};
