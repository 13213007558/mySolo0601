import { useState, useRef, useEffect } from 'react';
import { ChevronDown, UserRound, Stethoscope, ShieldCheck } from 'lucide-react';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/utils/format';

interface RoleSwitcherProps {
  className?: string;
}

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  staff: UserRound,
  nurse: Stethoscope,
  supervisor: ShieldCheck,
};

export default function RoleSwitcher({ className }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { currentUser, switchRole } = useAuthStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!currentUser) return null;

  const roles: UserRole[] = ['staff', 'nurse', 'supervisor'];
  const CurrentIcon = ROLE_ICONS[currentUser.role];

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 shadow-sm transition hover:bg-ink-50"
      >
        <CurrentIcon className="h-4 w-4" />
        <span>{getRoleLabel(currentUser.role)}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-ink-200 bg-white py-1 shadow-pop animate-fade-in-up">
          {roles.map((role) => {
            const Icon = ROLE_ICONS[role];
            const isActive = role === currentUser.role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  switchRole(role);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition',
                  isActive ? 'bg-medical-50 text-medical-700' : 'text-ink-700 hover:bg-ink-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {getRoleLabel(role)}
                {isActive && <span className="ml-auto text-medical-500">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
