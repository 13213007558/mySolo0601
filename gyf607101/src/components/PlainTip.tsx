import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInverterStore } from '@/store/inverterStore';

interface PlainTipProps {
  tipId: string;
  message: string;
  className?: string;
}

export function PlainTip({ tipId, message, className }: PlainTipProps) {
  const { isTipClosed, closeTip } = useInverterStore();

  if (isTipClosed(tipId)) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-amber-500/10 border-2 border-amber-500 rounded-lg p-4 relative',
        className
      )}
    >
      <button
        type="button"
        onClick={() => closeTip(tipId)}
        className="absolute top-3 right-3 text-amber-400 hover:text-amber-300 transition-colors"
        aria-label="关闭提示"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-200 font-medium text-sm leading-relaxed">{message}</p>
          <p className="text-amber-400/60 text-xs mt-2">关闭后7天内不再显示</p>
        </div>
      </div>
    </div>
  );
}
