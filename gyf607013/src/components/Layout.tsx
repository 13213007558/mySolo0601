import { useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import RoleSwitcher from './RoleSwitcher';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/utils/format';
import {
  Calendar,
  Stethoscope,
  LayoutDashboard,
  Users,
  Baby,
  ClipboardCheck,
  FileDown,
  LogOut,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: ReactNode;
  className?: string;
}

const NAV_ITEMS = [
  { to: '/dashboard', label: '排程板', Icon: LayoutDashboard },
  { to: '/classes', label: '班级管理', Icon: Users },
  { to: '/audit', label: '审计面板', Icon: ClipboardCheck },
  { to: '/export', label: '导出中心', Icon: FileDown },
];

export default function Layout({ children, className }: LayoutProps) {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="text-center text-ink-500">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-medical-200 border-t-medical-500" />
          <p className="text-sm">正在跳转登录...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-50 flex">
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-ink-100 bg-white">
        <div className="px-5 py-5 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-medical-500 to-mint-500 text-white shadow-card">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-base font-semibold text-ink-900 leading-tight">
                儿保随访消毒
              </h1>
              <p className="text-[11px] text-ink-400">Infant Care System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-medical-50 text-medical-700 shadow-sm'
                    : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
                )
              }
            >
              <Icon className="h-[18px] w-[18px] transition-colors" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-ink-100 space-y-2">
          {currentUser && (
            <div className="px-3 py-3 rounded-lg bg-ink-50">
              <div className="text-sm font-medium text-ink-800">{currentUser.name}</div>
              <div className="text-xs text-ink-500 mt-0.5">
                {getRoleLabel(currentUser.role)}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-danger-50 hover:text-danger-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="lg:hidden flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-medical-100 text-medical-600">
                <Stethoscope className="h-5 w-5" />
              </div>
              <h1 className="font-display text-base font-semibold text-ink-900">
                儿保随访消毒管理
              </h1>
            </div>
            <p className="hidden lg:block text-xs text-ink-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>

            <div className="flex items-center gap-3">
              {currentUser && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-ink-600">
                  <Baby className="h-4 w-4 text-ink-400" />
                  <span className="font-medium text-ink-800">{currentUser.name}</span>
                  <span className="text-ink-300">|</span>
                  <span className="text-ink-500">{getRoleLabel(currentUser.role)}</span>
                </div>
              )}
              <RoleSwitcher />
            </div>
          </div>
        </header>

        <main className={cn('flex-1 px-4 py-6 sm:px-6 lg:px-8', className)}>
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
