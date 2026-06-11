import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(duration);
dayjs.extend(relativeTime);

export { dayjs };

export function formatDateTime(iso: string | Date): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(iso: string | Date): string {
  return dayjs(iso).format('YYYY-MM-DD');
}

export function remainTimeText(targetIso: string, nowIso?: string): {
  totalMs: number;
  expired: boolean;
  text: string;
  urgent: boolean;
} {
  const target = dayjs(targetIso);
  const now = nowIso ? dayjs(nowIso) : dayjs();
  const diffMs = target.diff(now);
  const dur = dayjs.duration(Math.max(0, diffMs));
  const h = Math.floor(dur.asHours());
  const m = dur.minutes();
  const s = dur.seconds();
  return {
    totalMs: diffMs,
    expired: diffMs <= 0,
    text: diffMs <= 0
      ? '已生效'
      : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    urgent: diffMs > 0 && diffMs < 1000 * 60 * 60 * 2,
  };
}

export function genId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function percentOf(value: number, total: number, digits = 1): number {
  if (total <= 0) return 0;
  return Number(((value / total) * 100).toFixed(digits));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function canRevokeReturnOrder(status: string, irrevocableUntilIso: string): boolean {
  if (status === 'PENDING_APPROVAL' || status === 'REJECTED') return true;
  if (status === 'FIRST_APPROVED') return true;
  if (status === 'FINAL_APPROVED' || status === 'LOCKED') {
    return dayjs().isAfter(irrevocableUntilIso);
  }
  if (status === 'EFFECTIVE') return false;
  return false;
}

export function returnStatusMeta(status: string): {
  label: string;
  color: string;
  icon?: string;
} {
  switch (status) {
    case 'PENDING_APPROVAL':
      return { label: '待审批', color: 'bg-amber-600 text-white' };
    case 'FIRST_APPROVED':
      return { label: '一级已确认', color: 'bg-sky-700 text-white' };
    case 'FINAL_APPROVED':
      return { label: '终审确认', color: 'bg-indigo-700 text-white' };
    case 'LOCKED':
      return { label: '锁定中·不可撤销', color: 'bg-saffron-600 text-white animate-blink-critical' };
    case 'EFFECTIVE':
      return { label: '退货单已生效', color: 'bg-emerald-700 text-white' };
    case 'REJECTED':
      return { label: '已驳回', color: 'bg-ink-600 text-white' };
    default:
      return { label: status, color: 'bg-ink-600 text-white' };
  }
}

export function batchStatusMeta(status: string): {
  label: string;
  color: string;
} {
  switch (status) {
    case 'PENDING':
      return { label: '待质检', color: 'bg-ink-600 text-ink-100' };
    case 'INSPECTING':
      return { label: '质检中', color: 'bg-sky-700 text-white' };
    case 'INSPECTED':
      return { label: '质检完成', color: 'bg-emerald-700 text-white' };
    case 'DEGRADED':
      return { label: '已降级', color: 'bg-amber-600 text-white' };
    case 'RETURNED':
      return { label: '已退货', color: 'bg-saffron-600 text-white' };
    default:
      return { label: status, color: 'bg-ink-600 text-white' };
  }
}

export function gradeRank(grade: string): number {
  const order = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
  return order.indexOf(grade);
}
