import { ALARM_LEVEL_LABELS } from '../types';
import type { AlarmLevel } from '../types';
import { cn } from '../lib/utils';

interface LevelBadgeProps {
  level: AlarmLevel;
  className?: string;
}

const levelStyles: Record<AlarmLevel, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  warning: 'bg-orange-100 text-orange-800 border-orange-300',
  info: 'bg-sky-100 text-sky-800 border-sky-300',
};

const levelIcon: Record<AlarmLevel, string> = {
  critical: '●',
  warning: '▲',
  info: 'ℹ',
};

export function LevelBadge({ level, className }: LevelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border rounded',
        levelStyles[level],
        className
      )}
    >
      <span>{levelIcon[level]}</span>
      {ALARM_LEVEL_LABELS[level]}
    </span>
  );
}
