import type { RecordStatus, DataSource, ExceptionType } from '../../shared/types';

export const statusLabel: Record<RecordStatus, string> = {
  pending: '待复核',
  reviewed: '已复核',
  exception: '异常',
  supplemented: '已补录',
};

export const statusColor: Record<RecordStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  reviewed: 'bg-teal-100 text-teal-700 border-teal-200',
  exception: 'bg-rose-100 text-rose-700 border-rose-200',
  supplemented: 'bg-violet-100 text-violet-700 border-violet-200',
};

export const sourceLabel: Record<DataSource, string> = {
  normal: '正常录入',
  supplement: '手工补录',
  corrupted: '坏数据',
};

export const sourceColor: Record<DataSource, string> = {
  normal: 'bg-cream-200 text-slate2-600',
  supplement: 'bg-amber-50 text-amber-600 border border-amber-200',
  corrupted: 'bg-rose-50 text-rose-600 border border-rose-200',
};

export const exceptionLabel: Record<ExceptionType, string> = {
  service_restart: '服务重启',
  data_loss: '数据丢失',
  bad_data: '坏数据',
  system_error: '系统异常',
};

export const exceptionColor: Record<ExceptionType, string> = {
  service_restart: 'bg-sky-100 text-sky-700 border-sky-200',
  data_loss: 'bg-rose-100 text-rose-700 border-rose-200',
  bad_data: 'bg-amber-100 text-amber-700 border-amber-200',
  system_error: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function roleLabel(role: 'nurse' | 'director'): string {
  return role === 'nurse' ? '护士' : '园长';
}

export function truncate(str: string, n = 24): string {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}
