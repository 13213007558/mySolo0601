import type { AuthorizationRecord } from '../../shared/types';
import { StatusTag, ReasonTag } from './Tags';
import { Calendar, MapPin, Camera, FileText, ChevronRight, FilePlus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  record: AuthorizationRecord;
}

export function RecordCard({ record }: Props) {
  const role = useAppStore((s) => s.role);
  const fetchRecord = useAppStore((s) => s.fetchRecord);
  const { photoContext, childName, guardianName, authorizedScopes, createdAt, isSupplement, changeReason, changeReasonNote } = record;

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  return (
    <div
      className={`card p-5 transition-all hover:shadow-card hover:-translate-y-0.5 cursor-pointer ${
        isSupplement ? 'ring-2 ring-sage-200 ring-offset-2 ring-offset-cream-50' : ''
      }`}
      onClick={() => role === 'parent' && fetchRecord(record.id)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg font-semibold text-ink-900">{childName}</h3>
            {isSupplement && (
              <span className="tag bg-sage-100 text-sage-500">
                <FilePlus size={12} />
                补录
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <Calendar size={14} />
            {photoContext.activityDate}
            <span className="text-ink-300">·</span>
            {photoContext.activityName}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusTag status={record.status} />
          {role === 'parent' && <ReasonTag reason={changeReason} note={changeReasonNote} />}
        </div>
      </div>

      {role === 'parent' && (
        <>
          <div className="space-y-1.5 text-sm text-ink-700 mb-3">
            {photoContext.location && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-ink-300" />
                {photoContext.location}
              </div>
            )}
            {photoContext.photographer && (
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-ink-300" />
                拍摄：{photoContext.photographer}
              </div>
            )}
            {photoContext.description && (
              <div className="flex items-start gap-2">
                <FileText size={14} className="text-ink-300 mt-0.5" />
                <span className="line-clamp-2">{photoContext.description}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {authorizedScopes.map((s) => (
              <span key={s} className="tag bg-cream-100 text-ink-700">
                {s}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-cream-200">
        <div className="text-xs text-ink-500">
          监护人：{guardianName}
          <span className="text-ink-300 mx-1">·</span>
          创建于 {formatDate(createdAt)}
        </div>
        {role === 'parent' && (
          <div className="flex items-center gap-1 text-warm-500 text-sm font-medium">
            查看详情
            <ChevronRight size={16} />
          </div>
        )}
      </div>
    </div>
  );
}
