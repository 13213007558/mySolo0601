import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  delay?: number;
}

const StatCard = ({ icon: Icon, label, value, trend, color = 'blue', delay = 0 }: StatCardProps) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30',
    green: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30',
    red: 'from-red-500/20 to-red-600/10 text-red-400 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div
      className={`card-industrial p-5 bg-gradient-to-br ${colorClasses[color]} animate-fade-in-up opacity-0 stagger-${delay}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-industrial-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold font-mono text-white">{value}</p>
          {trend && (
            <p className="text-xs mt-2 text-industrial-300">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-sm bg-industrial-800/50`}>
          <Icon className={`w-6 h-6`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
