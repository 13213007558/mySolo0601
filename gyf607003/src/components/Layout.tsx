import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, ClipboardList, Download, User, Shield } from 'lucide-react';
import { appStore } from '@/store/app';
import { USER_ROLE_LABEL } from '@shared/types';
import type { UserRole } from '@shared/types';

const navItems = [
  { to: '/', label: '夜班交接', icon: LayoutDashboard, end: true },
  { to: '/classes', label: '班级管理', icon: Users },
  { to: '/audit', label: '审计记录', icon: FileText },
  { to: '/export', label: '数据导出', icon: Download },
];

const roles: UserRole[] = ['disinfector', 'teacher', 'supervisor', 'admin'];

export default function Layout() {
  const { currentUser, selectedRole, setRole } = appStore();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif-sc text-xl font-bold tracking-wide">婴幼儿用品消毒清洗链</h1>
              <p className="text-xs text-primary-100">夜班交接版</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary-100">角色预览：</span>
              <div className="flex rounded-md overflow-hidden border border-white/20">
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`px-3 py-1 text-xs transition ${
                      selectedRole === r
                        ? 'bg-white text-primary font-semibold'
                        : 'bg-transparent text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {USER_ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{currentUser?.name || '加载中...'}</span>
              <span className="text-xs text-primary-200">({USER_ROLE_LABEL[currentUser?.role || selectedRole]})</span>
            </div>
          </div>
        </div>

        <nav className="bg-primary-600">
          <div className="container mx-auto px-6">
            <ul className="flex gap-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 px-4 py-3 text-sm transition ${
                        isActive
                          ? 'bg-primary-700 text-white border-b-2 border-accent-orange'
                          : 'text-white/80 hover:bg-primary-700 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-6 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="container mx-auto px-6 text-center text-xs text-gray-500">
          <ClipboardList className="w-3 h-3 inline mr-1" />
          婴幼儿用品消毒清洗链 · 夜班交接系统 · 审计记录永不丢失
        </div>
      </footer>
    </div>
  );
}
