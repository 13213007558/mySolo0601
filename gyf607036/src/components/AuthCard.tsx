import { Camera, Baby, User, Phone, CalendarDays, BookOpen, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PhotoAuthorization } from '@shared/types';
import { AUTH_TYPE_LABEL, PHOTO_SCOPE_LABEL } from '@shared/types';
import StatusBadge from './StatusBadge';
import { formatDateShort, maskPhone } from '@/utils';
import { cn } from '@/utils';

interface Props {
  record: PhotoAuthorization;
}

export default function AuthCard({ record }: Props) {
  return (
    <Link
      to={`/records/${record.id}`}
      className={cn(
        'block bg-white rounded-card shadow-card border border-cream-200 p-5 hover:border-brand-300 transition animate-fade-in',
        record.isBadData && 'border-red-200 bg-red-50/40',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Baby className="w-4 h-4 text-brand-500" />
            <span className="font-serif text-lg font-semibold text-gray-800">{record.babyName}</span>
            {record.isManualEntry && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cream-200 text-cream-700 border border-cream-300">
                手工补录
              </span>
            )}
            {record.isBadData && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> 已隔离
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {record.className}
          </div>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="space-y-1.5 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span>{record.parentName}</span>
          <span className="text-gray-400">·</span>
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono text-xs">{maskPhone(record.parentPhone)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-gray-400" />
          <span>{AUTH_TYPE_LABEL[record.authType]}</span>
          <span className="text-gray-400">·</span>
          <span>{PHOTO_SCOPE_LABEL[record.photoScope]}</span>
        </div>
        {record.validStart && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {formatDateShort(record.validStart)}
              {record.validEnd ? ` — ${formatDateShort(record.validEnd)}` : ' 起'}
            </span>
          </div>
        )}
      </div>

      <div className="bg-cream-50 rounded-lg p-3 text-xs text-gray-700 border border-cream-100 line-clamp-2">
        <span className="text-gray-400 mr-1">承诺：</span>
        {record.originalCommitment || '—'}
      </div>
    </Link>
  );
}
