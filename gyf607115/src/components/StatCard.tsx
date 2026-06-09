import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
  className?: string;
  animate?: boolean;
}

const colorStyles = {
  blue: 'from-blue-500 to-blue-700',
  green: 'from-emerald-500 to-emerald-700',
  amber: 'from-amber-500 to-amber-700',
  red: 'from-red-500 to-red-700',
  slate: 'from-slate-500 to-slate-700',
};

const trendIcons = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

const trendColors = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  neutral: 'text-slate-400',
};

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number | string; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000;
      const steps = 30;
      const increment = numericValue / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(numericValue);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current * 100) / 100);
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [numericValue, value]);

  if (typeof value === 'string') {
    return <span>{prefix}{value}{suffix}</span>;
  }

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
      {suffix}
    </span>
  );
}

export function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  icon,
  trend,
  trendValue,
  color = 'blue',
  className,
  animate = true,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0 opacity-10 bg-gradient-to-br',
          colorStyles[color]
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {animate ? (
                <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
              ) : (
                <span>
                  {prefix}
                  {typeof value === 'number' ? value.toLocaleString('zh-CN') : value}
                  {suffix}
                </span>
              )}
            </p>
          </div>
          {icon && (
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white',
                colorStyles[color]
              )}
            >
              {icon}
            </div>
          )}
        </div>
        {trend && trendValue && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            <span className={cn('font-medium', trendColors[trend])}>
              {trendIcons[trend]} {trendValue}
            </span>
            <span className="text-slate-400">较上周</span>
          </div>
        )}
      </div>
    </div>
  );
}
