import type { HistoryChange } from '@/types';
import { User, Clock } from 'lucide-react';
import { desensitizeField } from '@/utils';

interface Props {
  history: HistoryChange[];
  desensitize?: boolean;
}

export default function HistoryTimeline({ history, desensitize = false }: Props) {
  if (history.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        暂无变更记录
      </div>
    );
  }

  return (
    <ol className="relative border-l-2 border-slate-200 ml-3 space-y-5">
      {history.map((h, idx) => (
        <li key={h.id} className="ml-6 animate-fade-in-up" style={{ animationDelay: `${idx * 60}ms` }}>
          <span className="absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full bg-medical-500 ring-4 ring-white shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {h.changedAt}
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                处理人：{h.changedByName}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              变更字段：<span className="text-medical-600">{h.fieldLabel}</span>
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white rounded border border-danger-100 p-2">
                <div className="text-danger-500 font-medium mb-1">旧值</div>
                <div className="font-mono text-slate-600 line-through decoration-danger-300">
                  {desensitize ? desensitizeField(h.fieldName, h.oldValue) : h.oldValue || '（空）'}
                </div>
              </div>
              <div className="bg-white rounded border border-safety-100 p-2">
                <div className="text-safety-600 font-medium mb-1">新值</div>
                <div className="font-mono text-slate-700">
                  {desensitize ? desensitizeField(h.fieldName, h.newValue) : h.newValue || '（空）'}
                </div>
              </div>
            </div>
            {h.changeReason && (
              <p className="mt-2 text-xs text-slate-500 bg-white/60 rounded px-2 py-1">
                💡 {h.changeReason}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
