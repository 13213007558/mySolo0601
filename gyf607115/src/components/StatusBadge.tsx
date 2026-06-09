import { ALARM_STATUS_LABELS } from '../types';
import type { AlarmStatus } from '../types';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: AlarmStatus;
  className?: string;
}

const statusStyles: Record<AlarmStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  ignored: 'bg-slate-100 text-slate-600 border-slate-300',
};

const statusDotStyles: Record<AlarmStatus, string> = {
  pending: 'bg-amber-500',
  processing: 'bg-blue-500',
  resolved: 'bg-emerald-500',
  ignored: 'bg-slate-400',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded',
        statusStyles[status],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', statusDotStyles[status])} />
      {ALARM_STATUS_LABELS[status]}
    </span>
  );
}
