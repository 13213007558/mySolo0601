import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Baby, ClipboardList, PlusCircle, History, Moon, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function Layout() {
  const currentOperator = useAppStore((s) => s.currentOperator);
  const location = useLocation();

  const isSubPage = location.pathname !== '/' && location.pathname !== '/audit';

  return (
    <div className="h-full flex flex-col bg-night-bg text-night-text">
      <header className="border-b border-night-border bg-night-surface flex-shrink-0">
        <div className="px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-accent-amber/20 flex items-center justify-center">
              <Baby size={18} className="text-accent-amber" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">婴幼儿批次追溯巡检屏</div>
              <div className="text-[10px] text-night-muted">夜班交接版 · Night Shift Handover</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {!isSubPage && (
              <>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-xs rounded flex items-center gap-1.5 transition ${
                      isActive ? 'bg-night-border text-night-text' : 'text-night-muted hover:text-night-text hover:bg-night-border/50'
                    }`
                  }
                >
                  <ClipboardList size={14} />
                  记录列表
                </NavLink>
                <NavLink
                  to="/audit"
                  className={({ isActive }) =>
                    `px-3 py-1.5 text-xs rounded flex items-center gap-1.5 transition ${
                      isActive ? 'bg-night-border text-night-text' : 'text-night-muted hover:text-night-text hover:bg-night-border/50'
                    }`
                  }
                >
                  <History size={14} />
                  历史审计
                </NavLink>
                <Link
                  to="/records/new"
                  className="ml-2 px-3 py-1.5 text-xs rounded bg-accent-amber/90 hover:bg-accent-amber text-night-bg font-medium flex items-center gap-1.5 transition"
                >
                  <PlusCircle size={14} />
                  新增临时补充
                </Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-night-muted">
              <Moon size={13} className="text-accent-amber" />
              夜班模式
            </div>
            <div className="h-5 w-px bg-night-border" />
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-night-border flex items-center justify-center">
                <User size={12} className="text-night-muted" />
              </div>
              <span className="text-night-text">{currentOperator}</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
