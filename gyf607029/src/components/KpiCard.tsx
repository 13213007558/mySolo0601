import type { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'orange' | 'amber' | 'red' | 'sky';
  hint?: string;
}

const colorMap: Record<string, string> = {
  blue: 'bg-brand-50 text-brand-600',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange-50 text-orange-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  sky: 'bg-sky-50 text-sky-600',
};

export function KpiCard({ icon: Icon, label, value, color, hint }: KpiCardProps) {
  return (
    <div className="kpi-card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className="text-2xl font-serif font-bold text-slate-800 tabular-nums animate-count-up">
          {value.toLocaleString('zh-CN')}
        </div>
        {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
      </div>
    </div>
  );
}
