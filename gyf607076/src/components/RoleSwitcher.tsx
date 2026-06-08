import { useAppStore } from '@/store/useAppStore';
import { UserRound, HeartHandshake } from 'lucide-react';
import type { UserRole } from '../../shared/types';

export function RoleSwitcher() {
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);

  const options: { role: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      role: 'elder',
      label: '长辈模式',
      desc: '只看摘要，简单明了',
      icon: <HeartHandshake size={18} />,
    },
    {
      role: 'parent',
      label: '爸妈模式',
      desc: '查看详情、历史和操作',
      icon: <UserRound size={18} />,
    },
  ];

  return (
    <div className="card p-2 inline-flex gap-1">
      {options.map((opt) => {
        const active = role === opt.role;
        return (
          <button
            key={opt.role}
            onClick={() => setRole(opt.role)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              active
                ? 'bg-warm-500 text-white shadow-soft'
                : 'text-ink-700 hover:bg-cream-100'
            }`}
          >
            {opt.icon}
            <div className="text-left">
              <div className="text-sm font-medium leading-tight">{opt.label}</div>
              <div className={`text-[11px] leading-tight ${active ? 'text-warm-100' : 'text-ink-500'}`}>
                {opt.desc}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
