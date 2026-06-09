import type { Screenshot } from '../../types';
import { cn, formatDateTime } from '../../utils/helpers';
import { User } from 'lucide-react';

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const ScreenshotGallery = ({ screenshots, selectedIndex, onSelect }: ScreenshotGalleryProps) => {
  if (screenshots.length === 0) return null;

  return (
    <div>
      <div className="text-xs text-industrial-muted mb-2">历史截图（{screenshots.length}张）</div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {screenshots.map((ss, idx) => (
          <button
            key={ss.id}
            onClick={(e) => { e.stopPropagation(); onSelect(idx); }}
            className={cn(
              'relative flex-shrink-0 w-32 h-20 rounded-sm overflow-hidden border-2 transition-all',
              idx === selectedIndex
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-transparent hover:border-industrial-border'
            )}
          >
            <img
              src={ss.url}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
              <div className="absolute bottom-1 left-1 right-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-[10px] px-1 rounded-sm',
                    ss.source === 'manual'
                      ? 'bg-primary text-white'
                      : 'bg-industrial-border/80 text-white'
                  )}>
                    {ss.source === 'manual' ? '手工' : '系统'}
                  </span>
                  {ss.uploadedBy && (
                    <span className="text-[10px] text-white/80 flex items-center gap-0.5">
                      <User size={10} />
                      {ss.uploadedBy.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-white/70 mt-0.5 font-mono-nums">
                  {formatDateTime(ss.timestamp)}
                </div>
              </div>
            </div>
            {idx === selectedIndex && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScreenshotGallery;
