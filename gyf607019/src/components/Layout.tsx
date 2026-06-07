import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileDown,
  FilePlus2,
  ShieldCheck,
  Stethoscope,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { to: '/', label: '授权复核墙', icon: LayoutDashboard },
  { to: '/export', label: '导出中心', icon: FileDown },
  { to: '/supplement', label: '手工补录', icon: FilePlus2 },
  { to: '/audit', label: '审计日志', icon: ShieldCheck },
];

export default function Layout() {
  const location = useLocation();
  const currentUser = useAppStore((s) => s.currentUser);
  const resetStore = useAppStore((s) => s.resetStore);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-60 bg-gradient-to-b from-medical-700 to-medical-600 text-white flex flex-col shadow-xl">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif-sc text-lg font-semibold leading-tight">儿保随访版</h1>
              <p className="text-xs text-blue-100/80">接送授权复核墙</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-inner'
                    : 'text-blue-50/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-50/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新页面</span>
          </button>
          <button
            onClick={resetStore}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-50/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置演示数据</span>
          </button>
        </div>

        <div className="px-5 py-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-blue-100/70 truncate">工号 {currentUser.employeeId}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <div>
            <h2 className="font-serif-sc text-base font-semibold text-slate-800">
              {navItems.find((n) => n.to === location.pathname)?.label || '系统'}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>今日：{new Date().toLocaleDateString('zh-CN')}</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
