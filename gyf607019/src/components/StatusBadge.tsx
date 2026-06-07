import { STATUS_LABEL, STATUS_COLOR, type AuthorizationStatus } from '@/types';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

const statusIcons = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  partial: AlertTriangle,
};

interface Props {
  status: AuthorizationStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const Icon = statusIcons[status];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-3 py-1 text-sm gap-1.5';
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${STATUS_COLOR[status]} ${sizeClass}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{STATUS_LABEL[status]}</span>
    </span>
  );
}
