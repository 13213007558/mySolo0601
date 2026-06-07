import type { DisinfectionStatus, UserRole, RecordSource } from '@/types';

export const STATUS_LABELS: Record<DisinfectionStatus, string> = {
  pending: '待执行',
  processing: '执行中',
  completed: '已完成',
  exception: '异常',
};

export const STATUS_COLORS: Record<DisinfectionStatus, string> = {
  pending: 'warm',
  processing: 'medical',
  completed: 'mint',
  exception: 'danger',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  staff: '门店同事',
  nurse: '护士',
  supervisor: '主管',
};

export const SOURCE_LABELS: Record<RecordSource, string> = {
  scan: '扫码录入',
  manual: '手动录入',
};

export function formatDate(value: string | Date, withTime = false): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  if (!withTime) return `${y}-${m}-${d}`;

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function formatTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatRelative(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;
  return formatDate(date);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60 ? `${seconds % 60}秒` : ''}`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}小时${m ? `${m}分` : ''}`;
}

export function getStatusLabel(status: DisinfectionStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function getSourceLabel(source: RecordSource): string {
  return SOURCE_LABELS[source] ?? source;
}
