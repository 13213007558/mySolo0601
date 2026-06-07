import { STATUS_LABEL, TYPE_LABEL, type PickupStatus, type PickupType } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<PickupStatus, string> = {
  pending: 'bg-night-500 text-night-100 border-night-400',
  picked: 'bg-pickup-normal/15 text-pickup-normal border-pickup-normal/40',
  exception: 'bg-pickup-exception/15 text-pickup-exception border-pickup-exception/40',
  withdrawn: 'bg-pickup-withdrawn/15 text-pickup-withdrawn border-pickup-withdrawn/40',
};

const TYPE_STYLES: Record<PickupType, string> = {
  normal: 'bg-night-500 text-night-100 border-night-400',
  phone_authorized: 'bg-pickup-phone/15 text-pickup-phone border-pickup-phone/40',
  temp_aunt: 'bg-pickup-aunt/15 text-pickup-aunt border-pickup-aunt/40',
};

export function StatusBadge({ status }: { status: PickupStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border', STATUS_STYLES[status])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: PickupType }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border', TYPE_STYLES[type])}>
      {TYPE_LABEL[type]}
    </span>
  );
}
