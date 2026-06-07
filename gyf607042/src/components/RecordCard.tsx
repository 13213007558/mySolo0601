import { ChevronRight, Clock, PencilLine } from 'lucide-react';
import type { TrackRecord } from '@/types';
import StatusBadge from './StatusBadge';
import { useNavigate } from 'react-router-dom';

interface Props {
  record: TrackRecord;
  index?: number;
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

export default function RecordCard({ record, index = 0 }: Props) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/record/${record.id}`)}
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
      className="animate-fade-in-up group flex cursor-pointer items-center gap-4 rounded-xl2 border border-warm-100 bg-white p-3.5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-sage-200 hover:shadow-card"
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-warm-100 bg-warm-50">
        <img
          src={record.photoUrl}
          alt={record.photoCaption}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {record.isManualEntry && (
          <span className="absolute left-0.5 top-0.5 inline-flex items-center gap-0.5 rounded bg-amber2-500/90 px-1 py-0.5 text-[10px] font-medium text-white">
            <PencilLine className="h-3 w-3" />
            补录
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base font-semibold text-warm-900">
                {record.roomNo} 房
              </h3>
              <span className="text-sm text-warm-500">{record.babyName}</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-warm-500">
              {record.mealDate} · {record.mealType}
            </p>
          </div>
          <StatusBadge status={record.status} />
        </div>

        <p className="mt-1.5 line-clamp-1 text-xs text-warm-700/80">
          {record.photoCaption}
        </p>

        <div className="mt-2 flex items-center gap-3 text-xs text-warm-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatShortDate(record.updatedAt)}
          </span>
          {record.taboosMatched.length > 0 && (
            <span className="text-coral-500">
              ⚠ 命中 {record.taboosMatched.length} 项禁忌
            </span>
          )}
          {record.validationIssues.length > 0 && (
            <span className="text-amber2-500">
              ⓘ {record.validationIssues.length} 条校验提醒
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="h-5 w-5 flex-shrink-0 text-warm-300 transition-colors group-hover:text-sage-400" />
    </div>
  );
}
