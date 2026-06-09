import { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'gray';
  suffix?: string;
}

export function StatsCard({ title, value, icon: Icon, color, suffix = '' }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    setIsAnimating(true);
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        setIsAnimating(false);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const colorClasses = {
    blue: 'from-industrial-blue-500 to-industrial-blue-700 border-industrial-blue-600',
    green: 'from-industrial-green-500 to-industrial-green-600 border-industrial-green-600',
    orange: 'from-industrial-orange-500 to-industrial-orange-600 border-industrial-orange-600',
    gray: 'from-industrial-gray-500 to-industrial-gray-600 border-industrial-gray-600',
  };

  const bgColorClasses = {
    blue: 'bg-industrial-blue-50 border-industrial-blue-200',
    green: 'bg-industrial-green-50 border-industrial-green-200',
    orange: 'bg-industrial-orange-50 border-industrial-orange-200',
    gray: 'bg-industrial-gray-50 border-industrial-gray-200',
  };

  const iconColorClasses = {
    blue: 'text-industrial-blue-500',
    green: 'text-industrial-green-500',
    orange: 'text-industrial-orange-500',
    gray: 'text-industrial-gray-500',
  };

  return (
    <div className={cn(
      'industrial-card p-4 border-2 relative overflow-hidden',
      bgColorClasses[color]
    )}>
      <div className={cn(
        'absolute top-0 left-0 w-1 h-full bg-gradient-to-b',
        colorClasses[color]
      )} />
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-industrial-gray-600 font-medium">{title}</p>
          <p className={cn(
            'text-3xl font-bold mt-1 font-mono',
            isAnimating && 'number-roll',
            iconColorClasses[color]
          )}>
            {displayValue.toLocaleString()}{suffix}
          </p>
        </div>
        <div className={cn(
          'p-3 rounded-lg bg-white shadow-sm',
          iconColorClasses[color]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
