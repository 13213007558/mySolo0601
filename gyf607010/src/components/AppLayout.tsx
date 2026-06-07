import { Outlet, Link, useLocation } from 'react-router-dom';
import { Baby, BookOpenCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { UserRole } from '@shared/types';

const roleLabels: Record<UserRole, string> = {
  nurse: '护士',
  supervisor: '课程主管',
};

export default function AppLayout() {
  const { currentUser, setRole } = useAppStore();
  const location = useLocation();
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/records" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <h1 className="font-serif font-semibold text-slate-900 text-base">
                婴幼儿奶量交接本
              </h1>
              <p className="text-[11px] text-slate-500">儿保随访版 · 统一电子底账</p>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <BookOpenCheck className="w-4 h-4" />
              <span>{today}</span>
            </div>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link
                to="/records"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  location.pathname.startsWith('/records')
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                记录管理
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">当前身份</span>
              <select
                value={currentUser.role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="nurse">{roleLabels.nurse} · {currentUser.role === 'nurse' ? currentUser.name : '张护士'}</option>
                <option value="supervisor">{roleLabels.supervisor} · {currentUser.role === 'supervisor' ? currentUser.name : '李主管'}</option>
              </select>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">
        <Outlet />
      </main>
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        社区儿童保健科 · 奶量交接底账系统
      </footer>
    </div>
  );
}
