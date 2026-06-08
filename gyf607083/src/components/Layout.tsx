import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Baby, 
  Headphones, 
  FileText, 
  ShieldAlert,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { UserRole, ROLE_LABELS } from '../../shared/types';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { path: '/classes', label: '班级管理', icon: LayoutDashboard },
  { path: '/customer-service', label: '客服处理', icon: Headphones },
  { path: '/audit', label: '审计日志', icon: ShieldAlert },
  { path: '/export', label: '数据导出', icon: FileText },
];

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'supervisor', label: '主管' },
  { value: 'customer_service', label: '客服人员' },
  { value: 'staff', label: '普通员工' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const { currentRole, setCurrentRole, classes } = useStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                婴幼儿用品消毒提醒墙
              </h1>
              <p className="text-xs text-gray-500">工坊客服版</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-teal-100 transition-all"
              >
                <Settings size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  当前角色：{ROLE_LABELS[currentRole]}
                </span>
                {roleDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {roleOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setCurrentRole(option.value);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        currentRole === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-medium">
                客
              </div>
              <span>客服小王</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        } transition-all duration-300 bg-white/60 backdrop-blur-sm border-r border-gray-200 min-h-[calc(100vh-73px)] sticky top-[73px]`}>
          <nav className="p-4 space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md shadow-blue-200' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="px-4 text-xs text-gray-500 mb-2">快捷入口</p>
              {classes.slice(0, 3).map(cls => (
                <Link
                  key={cls.id}
                  to={`/classes/${cls.id}`}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Users size={16} />
                  <span>{cls.name}</span>
                  {cls.exceptionCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                      {cls.exceptionCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
