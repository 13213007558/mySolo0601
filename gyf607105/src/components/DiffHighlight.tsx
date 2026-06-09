import React from 'react';
import { getDifferenceColor, getDifferenceLabel } from '@/utils/diff';

interface DiffHighlightProps {
  original: number;
  corrected: number;
  showLabel?: boolean;
}

export const DiffHighlight: React.FC<DiffHighlightProps> = ({
  original,
  corrected,
  showLabel = true,
}) => {
  const diff = corrected - original;
  const colorClass = getDifferenceColor(diff);
  const label = getDifferenceLabel(diff);

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 line-through text-sm">{original}°</span>
      <span className="text-slate-400">→</span>
      <span className="font-medium">{corrected}°</span>
      {showLabel && diff !== 0 && (
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
          diff > 0 ? 'bg-red-100' : 'bg-yellow-100'
        } ${colorClass} animate-pulse`}>
          {label}
        </span>
      )}
    </div>
  );
};
