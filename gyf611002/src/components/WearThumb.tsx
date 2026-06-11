import type { WearLevel } from '../types';

interface Props { level: WearLevel; size?: number; }

export default function WearThumb({ level, size = 36 }: Props) {
  const color = level === 'normal' ? '#10B981'
              : level === 'mild'   ? '#0EA5E9'
              : level === 'moderate' ? '#F59E0B'
              : '#EF4444';
  const path =
    level === 'normal'
      ? 'M4 22 L6 8 Q18 5 30 8 L32 22 Z'
      : level === 'mild'
      ? 'M4 22 L6 9 Q16 6 28 10 L30 22 Z M14 16 Q18 14 22 16'
      : level === 'moderate'
      ? 'M4 22 L6 11 Q14 7 26 12 L30 22 Z M12 18 Q18 14 24 18 M10 20 L12 17'
      : 'M4 22 L7 13 Q14 6 24 14 L28 22 Z M12 20 L16 13 M18 20 L22 12 M24 21 L28 15';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className="shrink-0" aria-label={`wear-${level}`}>
      <defs>
        <linearGradient id={`wg-${level}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="34" height="34" rx="3" fill="rgba(56,189,248,0.05)" stroke={color} strokeOpacity="0.35" />
      <g stroke={color} strokeWidth="1.4" fill={`url(#wg-${level})`} strokeLinejoin="round" strokeLinecap="round">
        <path d={path} />
      </g>
      <line x1="4" y1="31" x2="32" y2="31" stroke={color} strokeOpacity="0.6" strokeDasharray="2 2" />
    </svg>
  );
}
