import { cn } from '@/lib/utils';
import { ROLE_LABELS, type User } from '@/types';
import { ChevronDown, User as UserIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const MOCK_USERS: User[] = [
  { id: 'user-supervisor-1', name: '王主管', role: 'supervisor' },
  { id: 'user-nurse-1', name: '李护士', role: 'nurse', shift: '夜班' },
  { id: 'user-viewer-1', name: '张护士', role: 'viewer' },
];

interface UserSwitcherProps {
  currentUser: User;
  onSwitch: (user: User) => void;
}

const roleBadgeClass: Record<User['role'], string> = {
  supervisor: 'bg-ink-blue/10 text-ink-blue',
  nurse: 'bg-status-green/10 text-status-green',
  viewer: 'bg-status-gray/10 text-status-gray',
};

export default function UserSwitcher({ currentUser, onSwitch }: UserSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-blue text-white">
          <UserIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{currentUser.name}</div>
          <span className={cn('inline-block text-xs rounded px-1.5 py-0.5', roleBadgeClass[currentUser.role])}>
            {ROLE_LABELS[currentUser.role]}
          </span>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-white/60 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-white/10 bg-ink-blue shadow-xl">
          {MOCK_USERS.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                onSwitch(u);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg',
                u.id === currentUser.id && 'bg-white/5'
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-blue/50 text-white">
                <UserIcon className="h-[14px] w-[14px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{u.name}</div>
                <span className={cn('inline-block text-xs rounded px-1.5 py-0.5', roleBadgeClass[u.role])}>
                  {ROLE_LABELS[u.role]}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
