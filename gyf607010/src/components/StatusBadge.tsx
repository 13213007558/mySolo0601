import { RecordStatus, RecordStatusLabel } from '@shared/types';
import { AlertTriangle, CheckCircle2, Circle, XCircle } from 'lucide-react';

interface Props {
  status: RecordStatus;
  size?: 'sm' | 'md';
}

const styles: Record<RecordStatus, { bg: string; text: string; iconBg: string; ring: string }> = {
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    iconBg: 'bg-amber-500',
    ring: 'ring-amber-600/20',
  },
  confirmed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-500',
    ring: 'ring-emerald-600/20',
  },
  withdrawn: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    iconBg: 'bg-slate-400',
    ring: 'ring-slate-500/20',
  },
  conflict: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    iconBg: 'bg-rose-500',
    ring: 'ring-rose-600/20',
  },
};

const icons: Record<RecordStatus, React.ReactNode> = {
  pending: <Circle className="w-3 h-3 fill-current" />,
  confirmed: <CheckCircle2 className="w-3 h-3 fill-current" />,
  withdrawn: <XCircle className="w-3 h-3 fill-current" />,
  conflict: <AlertTriangle className="w-3 h-3 fill-current" />,
};

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const s = styles[status];
  const px = size === 'md' ? 'px-3 py-1' : 'px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${px} ${s.bg} ${s.text} ring-1 ${s.ring} ${
        size === 'md' ? 'text-sm' : 'text-xs'
      } font-medium`}
    >
      <span className={s.iconBg + ' rounded-full p-0.5 text-white'}>{icons[status]}</span>
      {RecordStatusLabel[status]}
    </span>
  );
}
