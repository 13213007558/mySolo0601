import { Clock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DisinfectionStatus } from '@/types';
import { cn } from '@/lib/utils';
import { getStatusLabel } from '@/utils/format';

interface StatusBadgeProps {
  status: DisinfectionStatus;
  className?: string;
}

const STATUS_CONFIG: Record<DisinfectionStatus, { icon: React.ElementType; className: string }> = {
  pending: {
    icon: Clock,
    className: 'bg-warm-50 text-warm-600 border-warm-100',
  },
  processing: {
    icon: Loader2,
    className: 'bg-medical-50 text-medical-600 border-medical-100',
  },
  completed: {
    icon: CheckCircle2,
    className: 'bg-mint-50 text-mint-600 border-mint-100',
  },
  exception: {
    icon: AlertTriangle,
    className: 'bg-danger-50 text-danger-600 border-danger-100',
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  const isProcessing = status === 'processing';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', isProcessing && 'animate-spin')} />
      {getStatusLabel(status)}
    </span>
  );
}
