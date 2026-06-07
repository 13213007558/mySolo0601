import type { RecordStatus, ChangeType, RescheduleRecord } from '../types';

export const STATUS_LABEL: Record<RecordStatus, string> = {
  pending: '待处理',
  promised: '已承诺',
  rescheduled: '已改期',
  completed: '已完成',
  cancelled: '已取消',
  bad_data: '坏数据',
};

export const CHANGE_TYPE_LABEL: Record<ChangeType, string> = {
  original: '原始承诺',
  note: '补充备注',
  reschedule: '改期操作',
  rejudge: '人工改判',
  bad_data: '标记坏数据',
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return formatDate(iso);
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function sortedByDateDesc<T extends { updatedAt: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function statusColor(status: RecordStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'pending':
      return { bg: 'bg-ink-50', text: 'text-ink-700', border: 'border-ink-200', dot: 'bg-ink-400' };
    case 'promised':
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' };
    case 'rescheduled':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'completed':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'cancelled':
      return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
    case 'bad_data':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
  }
}

export function recordsToCSV(records: RescheduleRecord[]): string {
  const headers = [
    '儿童姓名',
    '家长姓名',
    '家长电话',
    '来源文件',
    '录入方式',
    '处理人',
    '当前状态',
    '原承诺日期',
    '最近人工说明',
    '创建时间',
    '最近更新',
    '是否坏数据',
    '坏数据原因',
  ];
  const rows = records.map((r) => [
    r.childName,
    r.parentName,
    r.parentPhone,
    r.sourceFile,
    r.sourceType === 'manual' ? '手工补录' : '文件导入',
    r.handler,
    STATUS_LABEL[r.currentStatus],
    r.originalPromiseDate,
    r.latestNote.replace(/"/g, '""'),
    r.createdAt,
    r.updatedAt,
    r.isBadData ? '是' : '否',
    (r.badDataReason ?? '').replace(/"/g, '""'),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${c}"`).join(','))
    .join('\n');
  return '\uFEFF' + csv;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
