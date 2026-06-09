import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color: 'green' | 'orange' | 'blue' | 'slate';
  subtext?: string;
  onClick?: () => void;
}

const colorClasses = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    value: 'text-green-700',
    label: 'text-green-600',
    hover: 'hover:bg-green-100',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'text-orange-600',
    value: 'text-orange-700',
    label: 'text-orange-600',
    hover: 'hover:bg-orange-100',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    value: 'text-blue-700',
    label: 'text-blue-600',
    hover: 'hover:bg-blue-100',
  },
  slate: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: 'text-slate-600',
    value: 'text-slate-700',
    label: 'text-slate-600',
    hover: 'hover:bg-slate-100',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  color,
  subtext,
  onClick,
}) => {
  const classes = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 ${classes.bg} ${classes.border} ${classes.hover} transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium ${classes.label} font-mono uppercase tracking-wider`}>
            {label}
          </p>
          <p className={`text-2xl font-bold ${classes.value} font-mono mt-1`}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-slate-500 mt-1">{subtext}</p>
          )}
        </div>
        <div className={`p-2 rounded ${classes.bg} ${classes.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
