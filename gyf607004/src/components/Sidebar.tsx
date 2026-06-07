import { cn } from '@/lib/utils';
import { ROLE_LABELS, type User } from '@/types';
import { ListTodo, PlusCircle, CheckSquare, Upload, Download, Baby } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import UserSwitcher from './UserSwitcher';

export type NavKey = 'list' | 'new' | 'approve' | 'import' | 'export';

interface NavItemProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active ? 'bg-ink-blue text-white shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span>{label}</span>
    </button>
  );
}

interface SidebarProps {
  activeNav: NavKey;
  onNavChange: (key: NavKey) => void;
  user: User;
  onUserSwitch: (user: User) => void;
}

const NAV_ITEMS: { key: NavKey; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { key: 'list', label: '记录列表', icon: ListTodo },
  { key: 'new', label: '新建记录', icon: PlusCircle },
  { key: 'approve', label: '审批处理', icon: CheckSquare },
  { key: 'import', label: '批量导入', icon: Upload },
  { key: 'export', label: '数据导出', icon: Download },
];

export default function Sidebar({ activeNav, onNavChange, user, onUserSwitch }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 bg-[#243B5E] text-white flex flex-col">
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warm-white text-ink-blue">
            <Baby className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">婴幼儿课程</div>
            <div className="text-xs text-white/60 leading-tight">改期授权库</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={activeNav === item.key}
            onClick={() => onNavChange(item.key)}
          />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/10">
        <div className="text-xs text-white/40 mb-1 px-1">当前角色：{ROLE_LABELS[user.role]}</div>
        <UserSwitcher currentUser={user} onSwitch={onUserSwitch} />
      </div>
    </aside>
  );
}
