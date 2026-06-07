import type { ItemType, DisinfectionMethod, AnomalyType, AnomalySeverity, RecordStatus, AuditAction } from '@/types';

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  feeding_bottle: '奶瓶',
  pacifier: '安抚奶嘴',
  toy: '玩具',
  clothing: '衣物',
  bedding: '床品',
};

export const METHOD_LABEL: Record<DisinfectionMethod, string> = {
  high_temp: '高温消毒',
  uv: '紫外线消毒',
  chemical: '化学消毒',
  steam: '蒸汽消毒',
};

export const ANOMALY_TYPE_LABEL: Record<AnomalyType, string> = {
  reissue_unclean: '未清洁用品再次发放',
  missing_photo: '缺失消毒照片',
  appointment_conflict: '预约/时段冲突',
  wrong_item: '用品类型错误',
};

export const ANOMALY_SEVERITY_LABEL: Record<AnomalySeverity, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
};

export const ANOMALY_SEVERITY_CLASS: Record<AnomalySeverity, string> = {
  high: 'bg-coral-100 text-coral-700 border-coral-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-sky-100 text-sky-700 border-sky-200',
};

export const RECORD_STATUS_LABEL: Record<RecordStatus, string> = {
  confirmed: '已确认',
  withdrawn: '已撤回',
  pending_review: '待复核',
  anomaly_resolved: '异常已整改',
};

export const RECORD_STATUS_CLASS: Record<RecordStatus, string> = {
  confirmed: 'bg-teal-50 text-teal-700 border border-teal-200',
  withdrawn: 'bg-slate-100 text-slate-500 border border-slate-200 line-through',
  pending_review: 'bg-coral-50 text-coral-700 border border-coral-200',
  anomaly_resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  create: '创建记录',
  confirm: '确认记录',
  withdraw: '撤回记录',
  correct: '整改记录',
  manual_create: '手工补录',
  anomaly_resolve: '异常处置',
};

export const AUDIT_ACTION_CLASS: Record<AuditAction, string> = {
  create: 'bg-sky-100 text-sky-700',
  confirm: 'bg-teal-100 text-teal-700',
  withdraw: 'bg-slate-200 text-slate-700',
  correct: 'bg-emerald-100 text-emerald-700',
  manual_create: 'bg-amber-100 text-amber-700',
  anomaly_resolve: 'bg-coral-100 text-coral-700',
};

export const ROLE_LABEL: Record<string, string> = {
  nurse: '护理员',
  supervisor: '护理主管',
  admin: '系统管理员',
};

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function relativeTime(iso: string): string {
  const now = Date.now();
  const diff = now - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  return `${d} 天前`;
}
