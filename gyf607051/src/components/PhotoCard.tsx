import { ImageOff, FileWarning, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DataStatus } from '@shared/types';
import { STATUS_META } from './StatusBadge';

interface PhotoPlaceholderProps {
  photoUrl?: string;
  status: DataStatus;
  caption: string;
  className?: string;
}

export function PhotoCard({ photoUrl, status, caption, className }: PhotoPlaceholderProps) {
  const meta = STATUS_META[status];
  return (
    <div className={cn('group relative overflow-hidden rounded-2xl border bg-white shadow-sm', className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        {photoUrl && status !== 'empty' ? (
          <img
            src={photoUrl}
            alt={caption}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={cn('flex h-full w-full flex-col items-center justify-center gap-2', meta.cls)}>
            {status === 'empty' ? (
              <FileWarning className="h-10 w-10 opacity-60" />
            ) : status === 'dirty' ? (
              <ImageOff className="h-10 w-10 opacity-60" />
            ) : (
              <CheckCircle2 className="h-10 w-10 opacity-60" />
            )}
            <p className="text-sm font-medium opacity-80">
              {status === 'empty' ? '暂无上传' : status === 'dirty' ? '照片缺失（已留审计）' : '照片已核验'}
            </p>
          </div>
        )}
        <div
          className={cn(
            'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium backdrop-blur-sm',
            meta.cls,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-medium text-slate-700">{caption}</p>
        {!photoUrl && <span className="text-xs text-amber-600">允许部分成功 · 审计追踪</span>}
      </div>
    </div>
  );
}
