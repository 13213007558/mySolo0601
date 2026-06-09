import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'red' | 'orange' | 'green' | 'blue';
  className?: string;
}

const colorMap = {
  red: 'border-red-500 bg-red-50 text-red-700',
  orange: 'border-amber-500 bg-amber-50 text-amber-700',
  green: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  blue: 'border-blue-700 bg-blue-50 text-blue-700'
};

const iconBgMap = {
  red: 'bg-red-100 text-red-600',
  orange: 'bg-amber-100 text-amber-600',
  green: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600'
};

export const StatCard = ({ title, value, icon, color, className }: StatCardProps) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border-l-4 bg-white p-4 shadow-sm transition-all hover:shadow-md',
        colorMap[color],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 font-mono text-3xl font-bold">{value}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', iconBgMap[color])}>
          {icon}
        </div>
      </div>
      <div className="absolute -right-2 -bottom-2 h-20 w-20 rounded-full opacity-5" style={{ background: 'currentColor' }} />
    </div>
  );
};
