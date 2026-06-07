import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: number;
  accentColor: 'sage' | 'coral' | 'amber' | 'warm';
  subtitle?: string;
  icon?: React.ReactNode;
}

const accentMap = {
  sage: 'from-sage-100/80 to-sage-50 text-sage-600',
  coral: 'from-coral-100/70 to-coral-50 text-coral-500',
  amber: 'from-amber-100/60 to-amber-50 text-amber2-500',
  warm: 'from-warm-100 to-warm-50 text-warm-700',
} as const;

export default function StatCard({ label, value, accentColor, subtitle, icon }: Props) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl2 border border-warm-100 bg-white px-5 py-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card',
        `bg-gradient-to-br ${accentMap[accentColor].split(' ').slice(0, 2).join(' ')}`
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-wide text-warm-500">{label}</p>
          <p
            className={cn(
              'mt-1.5 font-serif text-3xl font-semibold leading-none',
              accentMap[accentColor].split(' ').slice(2).join(' ')
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="mt-2 text-xs text-warm-500/90">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg bg-white/80',
              accentMap[accentColor].split(' ').slice(2).join(' ')
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        className={cn(
          'absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-30 blur-2xl',
          accentColor === 'sage'
            ? 'bg-sage-300'
            : accentColor === 'coral'
            ? 'bg-coral-300'
            : accentColor === 'amber'
            ? 'bg-amber-300'
            : 'bg-warm-300'
        )}
      />
    </div>
  );
}
