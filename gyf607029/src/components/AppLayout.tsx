import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Baby, FileDown, FileWarning, ClipboardCheck, History, Stethoscope } from 'lucide-react';
import { cn } from '../lib/utils.js';

const nav = [
  { to: '/list', label: '授权记录', icon: Baby },
  { to: '/export', label: '导出中心', icon: FileDown },
  { to: '/correction', label: '人工更正', icon: ClipboardCheck },
  { to: '/audit', label: '审计追踪', icon: History },
];

export function AppLayout() {
  const loc = useLocation();
  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md">
              <Stethoscope size={18} />
            </div>
            <div>
              <div className="font-serif font-semibold text-slate-800 leading-tight">儿保授权系统</div>
              <div className="text-[11px] text-slate-400">清洗链门店售后版</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname.startsWith(to);
            return (
              <NavLink key={to} to={to} className={cn('sidebar-item', active && 'sidebar-item-active')}>
                <Icon size={18} strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileWarning size={14} className="text-amber-500" />
            <span>当前角色：门店店长</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>梧桐社区儿保室</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium">
              {nav.find(n => loc.pathname.startsWith(n.to))?.label ?? '授权记录'}
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {new Date().toLocaleDateString('zh-CN')}
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
