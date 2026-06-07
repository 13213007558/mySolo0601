import { NavLink, Outlet } from 'react-router-dom';
import { Baby, ClipboardList, FileSearch, UserCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_LABEL } from '@/utils/types';

export default function Layout() {
  const { currentUser, setCurrentUser } = useAppStore();

  const toggleRole = () => {
    if (currentUser.role === 'consultant') {
      setCurrentUser({ name: '园长', role: 'principal' });
    } else {
      setCurrentUser({ name: '李顾问', role: 'consultant' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-700 rounded-md flex items-center justify-center text-white">
              <Baby size={20} />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-800">
                梧桐社区儿保室
              </div>
              <div className="text-xs text-slate-500">
                婴幼儿批次追溯授权库 · 试听顾问版
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-800 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <ClipboardList size={16} />
              记录列表
            </NavLink>
            <NavLink
              to="/audit"
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-800 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <FileSearch size={16} />
              审计日志
            </NavLink>
          </nav>

          <button
            onClick={toggleRole}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <UserCircle size={18} className="text-slate-400" />
            <span>
              {currentUser.name}
              <span className="text-slate-400 ml-1">· {ROLE_LABEL[currentUser.role]}</span>
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">
        <Outlet />
      </main>

      <footer className="py-4 text-center text-xs text-slate-400">
        梧桐社区卫生服务中心 · 婴幼儿批次追溯授权库
      </footer>
    </div>
  );
}
