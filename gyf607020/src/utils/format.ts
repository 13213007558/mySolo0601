import type { RecordStatus, MilkRecord, DataIssue } from '@shared/types';

export function formatStatus(status: RecordStatus): string {
  const map: Record<RecordStatus, string> = {
    pending: '待复核',
    approved: '已通过',
    rejected: '已拒绝',
    bad_data: '坏数据',
  };
  return map[status];
}

export function statusColor(status: RecordStatus): string {
  const map: Record<RecordStatus, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    bad_data: 'bg-gray-200 text-gray-600 border-gray-300 line-through',
  };
  return map[status];
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function formatMilk(r: MilkRecord): string {
  return r.milkUnit === 'bottle' ? `${r.milkQuantity} 瓶` : `${r.milkQuantity} ml`;
}

export function maskPhone(phone: string): string {
  const clean = phone.replace(/[\s\-]/g, '');
  if (clean.length < 7) return phone;
  return clean.slice(0, 3) + '****' + clean.slice(-4);
}

export function maskIdCard(id?: string): string {
  if (!id) return '';
  if (id.length < 8) return id;
  return id.slice(0, 4) + '**********' + id.slice(-4);
}

export function issueLabel(issue: DataIssue): string {
  const map: Record<DataIssue['type'], string> = {
    phone_format: '手机号格式问题',
    privacy_leak: '隐私字段泄露风险',
    data_inconsistency: '数据不一致',
    duplicate: '重复记录',
  };
  return map[issue.type];
}

export function issueColor(type: DataIssue['type']): string {
  return type === 'privacy_leak'
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : 'bg-orange-50 text-orange-700 border-orange-200';
}
