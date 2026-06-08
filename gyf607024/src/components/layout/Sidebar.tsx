import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FilePlus2, Waves } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-deep-ocean text-white flex flex-col">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-aqua-teal flex items-center justify-center">
          <Waves className="w-6 h-6 text-deep-ocean" />
        </div>
        <div>
          <div className="text-base font-semibold leading-tight">海豚泳池</div>
          <div className="text-xs text-white/60 leading-tight">2 区门店</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-aqua-teal text-deep-ocean shadow-glow'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          巡检屏
        </NavLink>

        <NavLink
          to="/entry"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-aqua-teal text-deep-ocean shadow-glow'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <FilePlus2 className="w-5 h-5" />
          录入改期
        </NavLink>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-white/40">售后管理系统 v1.0</div>
      </div>
    </aside>
  );
}
