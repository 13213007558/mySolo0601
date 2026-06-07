import type { CheckStatus } from '../../shared/types';
import { STATUS_LABELS } from '../../shared/types';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

const statusConfig: Record<CheckStatus, { bg: string; text: string; dot: string; Icon: any }> = {
  normal: { bg: 'bg-health-normalLight', text: 'text-green-700', dot: 'bg-health-normal', Icon: CheckCircle },
  abnormal: { bg: 'bg-health-abnormalLight', text: 'text-red-700', dot: 'bg-health-abnormal', Icon: XCircle },
  pending: { bg: 'bg-health-pendingLight', text: 'text-orange-700', dot: 'bg-health-pending', Icon: Clock },
  leave: { bg: 'bg-health-leaveLight', text: 'text-blue-700', dot: 'bg-health-leave', Icon: Calendar },
};

interface StatusBadgeProps {
  status: CheckStatus;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, pulse = false, size = 'md' }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  const Icon = cfg.Icon;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`status-badge ${cfg.bg} ${cfg.text} ${sizeClass} ${pulse ? 'animate-pulse-soft' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
