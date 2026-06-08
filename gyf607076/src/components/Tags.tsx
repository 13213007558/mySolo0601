import type { AuthorizationStatus, ChangeReason } from '../../shared/types';
import { STATUS_LABELS, CHANGE_REASON_LABELS } from '../../shared/types';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Undo2, FilePlus } from 'lucide-react';

export function StatusTag({ status }: { status: AuthorizationStatus }) {
  const config: Record<AuthorizationStatus, { bg: string; text: string; icon: React.ReactNode }> = {
    authorized: { bg: 'bg-sage-100', text: 'text-sage-500', icon: <CheckCircle2 size={12} /> },
    pending: { bg: 'bg-warm-50', text: 'text-warm-500', icon: <Clock size={12} /> },
    denied: { bg: 'bg-rose-100', text: 'text-rose-500', icon: <XCircle size={12} /> },
    conflicted: { bg: 'bg-warm-100', text: 'text-warm-600', icon: <AlertTriangle size={12} /> },
    revoked: { bg: 'bg-ink-300/40', text: 'text-ink-700', icon: <Undo2 size={12} /> },
    supplemented: { bg: 'bg-sage-50', text: 'text-sage-400', icon: <FilePlus size={12} /> },
  };
  const c = config[status];
  return (
    <span className={`tag ${c.bg} ${c.text}`}>
      {c.icon}
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ReasonTag({ reason, note }: { reason?: ChangeReason; note?: string }) {
  if (!reason) return null;
  const colorMap: Record<ChangeReason, string> = {
    initial_create: 'bg-cream-100 text-ink-700',
    manual_supplement: 'bg-sage-100 text-sage-500',
    status_update: 'bg-warm-50 text-warm-500',
    booking_conflict: 'bg-warm-100 text-warm-600',
    confirmation_revoked: 'bg-rose-100 text-rose-500',
    data_correction: 'bg-ink-300/40 text-ink-700',
    other: 'bg-cream-100 text-ink-500',
  };
  return (
    <span className={`tag ${colorMap[reason]}`} title={note}>
      {CHANGE_REASON_LABELS[reason]}
    </span>
  );
}
