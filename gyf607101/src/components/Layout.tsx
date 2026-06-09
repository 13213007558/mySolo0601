import { NavLink, Outlet } from 'react-router-dom';
import { Zap, FileText, GitCompare, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '复核台', icon: Zap },
  { path: '/supplement', label: '补录材料', icon: FileText },
  { path: '/review', label: '复盘对比', icon: GitCompare },
  { path: '/export', label: '摘要导出', icon: FileDown },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-900 flex">
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex-shrink-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">光伏逆变器</div>
              <div className="text-slate-400 text-xs">复核工作台</div>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-slate-700">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">操作提示</div>
            <div className="text-xs text-slate-500">
              月底核对时，先看「复核台」确认数据，有问题去「补录材料」，核对前后差异去「复盘对比」，最后从「摘要导出」发班组长。
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
