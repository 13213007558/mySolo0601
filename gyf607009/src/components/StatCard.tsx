import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent: 'green' | 'amber' | 'blue' | 'purple' | 'red' | 'slate';
  sub?: string;
  delay?: number;
}

const ACCENT: Record<StatCardProps['accent'], string> = {
  green: 'text-pickup-normal glow-green',
  amber: 'text-pickup-exception glow-amber',
  blue: 'text-pickup-phone glow-blue',
  purple: 'text-pickup-aunt',
  red: 'text-pickup-withdrawn glow-red',
  slate: 'text-night-200',
};

export function StatCard({ label, value, icon, accent, sub, delay = 0 }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative bg-night-700/80 border border-night-500 rounded-lg p-4 opacity-0 animate-fade-in-up overflow-hidden',
        ACCENT[accent]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-night-200 font-mono tracking-wide">{label}</div>
          <div className="mt-1 font-display text-3xl font-semibold leading-none">
            {value}
          </div>
          {sub && <div className="mt-2 text-[10px] text-night-300 font-mono">{sub}</div>}
        </div>
        <div className="p-2 rounded-md bg-night-800/60 border border-night-500/50">
          {icon}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-current opacity-20" />
    </div>
  );
}
