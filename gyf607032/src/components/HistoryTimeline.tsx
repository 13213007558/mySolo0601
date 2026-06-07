import { ArrowRight, MessageCircle, Pencil, RefreshCcw, AlertCircle, FilePlus, CheckCircle } from 'lucide-react';
import type { HistoryEntry } from '@/types';
import { ACTION_LABEL, STATUS_LABEL } from '@/types';
import { cn } from '@/lib/utils';

const iconMap = {
  status_change: RefreshCcw,
  note_add: MessageCircle,
  withdraw: ArrowRight,
  conflict: AlertCircle,
  manual_create: FilePlus,
  override: CheckCircle,
} as const;

const colorMap = {
  status_change: 'bg-sky-100 text-sky-600',
  note_add: 'bg-mint-100 text-mint-600',
  withdraw: 'bg-slate-200 text-slate-600',
  conflict: 'bg-orange-100 text-orange-600',
  manual_create: 'bg-butter-100 text-amber-600',
  override: 'bg-amber-100 text-amber-700',
} as const;

interface HistoryTimelineProps {
  history: HistoryEntry[];
}

export default function HistoryTimeline({ history }: HistoryTimelineProps) {
  return (
    <div className="space-y-0">
      {history.map((h, i) => {
        const Icon = iconMap[h.action] || Pencil;
        const isLast = i === history.length - 1;
        return (
          <div key={h.id} className="relative flex gap-3 pb-5 animate-fade-in">
            {!isLast && (
              <div className="absolute left-4 top-8 w-px h-full bg-slate-200" />
            )}
            <div
              className={cn(
                'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                colorMap[h.action]
              )}
            >
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800">
                    {ACTION_LABEL[h.action]}
                  </span>
                  {h.fromStatus && h.toStatus && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100">
                        {STATUS_LABEL[h.fromStatus]}
                      </span>
                      <ArrowRight size={10} className="text-slate-400" />
                      <span className="px-1.5 py-0.5 rounded bg-slate-100">
                        {STATUS_LABEL[h.toStatus]}
                      </span>
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {h.timestamp}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                操作人：{h.operator}
              </div>
              {h.reason && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 text-sm text-slate-700">
                  <span className="text-slate-400 text-xs block mb-0.5">原因</span>
                  {h.reason}
                </div>
              )}
              {h.parentNote && (
                <div className="mt-2 p-2.5 rounded-lg bg-coral-50 border border-coral-100 text-sm text-slate-700">
                  <span className="text-coral-600 text-xs font-medium block mb-0.5">家长原话</span>
                  {h.parentNote}
                </div>
              )}
              {h.note && (
                <div className="mt-2 p-2.5 rounded-lg bg-mint-50 border border-mint-100 text-sm text-slate-700">
                  <span className="text-mint-600 text-xs font-medium block mb-0.5">顾问补充</span>
                  {h.note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
