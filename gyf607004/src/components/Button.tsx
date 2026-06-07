import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ink-blue text-white hover:bg-ink-blue/90 focus:ring-ink-blue/30',
  secondary: 'border border-ink-blue text-ink-blue hover:bg-ink-blue/5 focus:ring-ink-blue/20 bg-transparent',
  danger: 'bg-status-red text-white hover:bg-status-red/90 focus:ring-status-red/30',
  ghost: 'text-ink-blue hover:bg-ink-blue/10 focus:ring-ink-blue/10 bg-transparent',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading ? <Loader2 className={cn('animate-spin', size === 'sm' ? 'h-[14px] w-[14px]' : size === 'md' ? 'h-4 w-4' : 'h-[18px] w-[18px]')} /> : icon}
      {children}
    </button>
  );
}
