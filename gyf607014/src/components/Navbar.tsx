import { NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, PlusCircle, Download, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const loc = useLocation();
  const links = [
    { to: '/', label: '对账台', icon: LayoutDashboard },
    { to: '/supplement', label: '手工补录', icon: PlusCircle },
    { to: '/export', label: '导出中心', icon: Download },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-teal-500/10 bg-gradient-to-b from-teal-700 to-teal-600 text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-serif text-lg font-semibold tracking-wide">婴幼儿课程改期对账台</div>
            <div className="text-[11px] tracking-[0.2em] text-teal-100/80">儿 保 随 访 版</div>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`group relative flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-teal-50/80 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-amber-400" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium">王园长</div>
            <div className="text-[11px] text-teal-100/70">管理员 · 亲子餐厅靠窗区</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-semibold text-teal-900 shadow-lg">
            王
          </div>
        </div>
      </div>
    </header>
  );
}
