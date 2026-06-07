import type { ChangeLog } from '../types';
import { StatusPill } from './StatusPill';
import {
  CHANGE_TYPE_LABEL,
  formatDateTime,
  statusColor,
} from '../utils/format';
import {
  Circle,
  Bookmark,
  MessageSquare,
  CalendarArrowUp as CalendarArrowRight,
  Gavel,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { STATUS_LABEL } from '../utils/format';

interface Props {
  logs: ChangeLog[];
}

function typeIcon(t: ChangeLog['changeType']) {
  switch (t) {
    case 'original':
      return <Bookmark className="w-3.5 h-3.5" />;
    case 'note':
      return <MessageSquare className="w-3.5 h-3.5" />;
    case 'reschedule':
      return <CalendarArrowRight className="w-3.5 h-3.5" />;
    case 'rejudge':
      return <Gavel className="w-3.5 h-3.5" />;
    case 'bad_data':
      return <AlertTriangle className="w-3.5 h-3.5" />;
  }
}

function typeBadge(t: ChangeLog['changeType']) {
  switch (t) {
    case 'original':
      return 'bg-ink-700 text-white border-ink-700';
    case 'note':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'reschedule':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'rejudge':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'bad_data':
      return 'bg-red-50 text-red-700 border-red-200';
  }
}

export function Timeline({ logs }: Props) {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <ol className="relative">
      {sorted.map((log, idx) => {
        const nodeColor =
          log.changeType === 'original'
            ? 'bg-ink-700 border-ink-700'
            : log.changeType === 'rejudge'
              ? 'bg-purple-500 border-purple-500'
              : log.changeType === 'bad_data'
                ? 'bg-rust-500 border-rust-500'
                : log.changeType === 'reschedule'
                  ? 'bg-amber-500 border-amber-500'
                  : 'bg-sky-500 border-sky-500';
        const sc = statusColor(log.status);
        const isLast = idx === sorted.length - 1;
        return (
          <li
            key={log.id}
            className={`timeline-connector relative pl-8 pb-6 ${isLast ? '' : ''}`}
          >
            <div
              className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-2 ${nodeColor} flex items-center justify-center text-white`}
            >
              {typeIcon(log.changeType)}
            </div>

            <div
              className={`card p-4 transition-all hover:shadow-pop ${
                log.changeType === 'rejudge'
                  ? 'border-l-4 !border-l-purple-500'
                  : log.changeType === 'bad_data'
                    ? 'border-l-4 !border-l-red-500'
                    : log.isOriginal
                      ? 'border-l-4 !border-l-ink-700'
                      : ''
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${typeBadge(
                    log.changeType,
                  )}`}
                >
                  {typeIcon(log.changeType)}
                  {CHANGE_TYPE_LABEL[log.changeType]}
                </span>

                {log.isOriginal && (
                  <span className="px-2 py-0.5 rounded-sm bg-ink-800 text-white text-[11px] font-semibold tracking-wide">
                    原始承诺 · 不可编辑
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <StatusPill status={log.status} />
                  {log.previousStatus && log.previousStatus !== log.status && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
                      <ArrowRight className="w-3 h-3" />
                      自
                      <span
                        className={`px-1.5 py-0.5 rounded-sm text-[10px] border ${
                          statusColor(log.previousStatus).bg
                        } ${statusColor(log.previousStatus).text} ${
                          statusColor(log.previousStatus).border
                        }`}
                      >
                        {STATUS_LABEL[log.previousStatus]}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-ink-800 leading-relaxed whitespace-pre-wrap mb-2">
                {log.note}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Circle className="w-2.5 h-2.5" />
                  操作人：{log.operator}
                </span>
                <span>时间：{formatDateTime(log.timestamp)}</span>
                <span className={sc.text}>当前节点状态：{STATUS_LABEL[log.status]}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
