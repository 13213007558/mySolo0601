import { cn } from '../lib/utils';

interface Props {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: 'blue' | 'pink' | 'amber' | 'emerald' | 'rose' | 'slate';
}

const accentMap = {
  blue: 'from-medical-500 to-medical-700',
  pink: 'from-warmpink-400 to-warmpink-600',
  amber: 'from-amber-400 to-orange-500',
  emerald: 'from-emerald-400 to-teal-500',
  rose: 'from-rose-400 to-pink-600',
  slate: 'from-slate-400 to-slate-600',
};

export default function StatCard({ icon, label, value, accent }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-card border border-white/60 animate-fadeInUp">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${accentMap[accent]} opacity-10 blur-2xl`} />
      <div className="relative flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentMap[accent]} text-white flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium tracking-wide">{label}</p>
          <p className={cn(
            "font-serif text-3xl font-bold mt-0.5 tabular-nums",
            accent === 'rose' || accent === 'amber' ? 'text-slate-800' : 'text-slate-800'
          )}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
