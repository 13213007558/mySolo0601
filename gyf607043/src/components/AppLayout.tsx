import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Baby,
  ClipboardCheck,
  FileDown,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import RoleSwitcher from './RoleSwitcher';
import { useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/format';

const NAV_ITEMS = [
  { to: '/', label: '班级总览', icon: LayoutDashboard },
  { to: '/review-wall', label: '消毒复核墙', icon: ClipboardCheck },
  { to: '/export', label: '导出中心', icon: FileDown },
  { to: '/audit', label: '审计日志', icon: ScrollText },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pendingAnomalies = useAppStore((s) =>
    s.anomalies.filter((a) => a.status === 'pending').length
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* 左侧导航 */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-slate-900 leading-tight">
                消毒复核墙
              </h1>
              <p className="text-[11px] text-slate-400">月子护理版</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive =
              to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            const showBadge = to === '/review-wall' && pendingAnomalies > 0;
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {showBadge && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-coral-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse-dot">
                    {pendingAnomalies}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Baby className="w-3.5 h-3.5" />
            <span>婴幼儿用品质量追溯</span>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <p className="text-xs text-slate-500">
                {formatDate(new Date().toISOString())} · 周一至周日 24 小时值守
              </p>
            </div>
            <RoleSwitcher />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 lg:px-10 lg:py-8 animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
