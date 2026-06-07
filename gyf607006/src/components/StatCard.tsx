import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accent?: string;
  delay?: number;
}

export default function StatCard({ label, value, icon, accent = 'text-amber-400', delay = 0 }: Props) {
  return (
    <div
      className="fade-in-up group relative overflow-hidden rounded-xl border border-night-500/60 bg-night-600/70 p-4 backdrop-blur transition-transform duration-300 hover:-translate-y-0.5 hover:border-night-400/80"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium tracking-wider text-night-200">{label}</div>
          <div className={`mt-2 font-display text-3xl font-semibold leading-none ${accent}`}>{value}</div>
        </div>
        {icon && <div className={`${accent} opacity-80`}>{icon}</div>}
      </div>
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent blur-2xl" />
    </div>
  );
}
