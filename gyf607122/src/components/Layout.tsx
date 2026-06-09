import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, LayoutDashboard, Upload, Clock, LogOut, User, Shield } from 'lucide-react';
import { useAppStore } from '@/store';
import { roleTextMap } from '@/types';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { currentUser, logout, hasPermission, getStats } = useAppStore();
  const stats = getStats();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      path: '/',
      label: '告警清单',
      icon: LayoutDashboard,
      permission: 'alarm:view',
    },
    {
      path: '/import',
      label: '数据导入',
      icon: Upload,
      permission: 'data:import',
    },
    {
      path: '/supplement',
      label: '启停补录',
      icon: Clock,
      permission: 'supplement:create',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-700 grid-bg scanline-effect">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 bg-dark-800 border-r border-dark-600 flex flex-col">
          <div className="p-4 border-b border-dark-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 flex items-center justify-center industrial-border">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-mono text-lg font-bold text-white">能源空调</h1>
                <p className="text-xs text-dark-300">主机告警墙</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-dark-600">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-dark-600 border-2 border-dark-500 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
                <p className="text-xs text-dark-300 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {roleTextMap[currentUser?.role || 'operator']}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-dark-700 p-2 border border-dark-600">
                <p className="text-xs text-dark-300">工号</p>
                <p className="font-mono text-sm text-white">{currentUser?.employeeId}</p>
              </div>
              <div className="bg-dark-700 p-2 border border-dark-600">
                <p className="text-xs text-dark-300">权限</p>
                <p className="font-mono text-sm text-primary-400">{currentUser?.permissions.length}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
            <div className="px-4 mb-2">
              <p className="text-xs font-medium text-dark-400 uppercase tracking-wider">功能菜单</p>
            </div>
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                if (!hasPermission(item.permission)) return null;
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 border-2 transition-all duration-200 ${
                          isActive
                            ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                            : 'border-transparent text-dark-200 hover:bg-dark-700 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.path === '/' && stats.pending > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-danger-500 text-white text-xs font-bold animate-pulse">
                          {stats.pending}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            <div className="px-4 mt-6 mb-2">
              <p className="text-xs font-medium text-dark-400 uppercase tracking-wider">告警概览</p>
            </div>
            <div className="px-4 space-y-2">
              <div className="flex items-center justify-between bg-warning-500/10 border-2 border-warning-500/50 p-2">
                <span className="text-xs text-warning-400">待处理</span>
                <span className="font-mono font-bold text-warning-400">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between bg-primary-500/10 border-2 border-primary-500/50 p-2">
                <span className="text-xs text-primary-400">处理中</span>
                <span className="font-mono font-bold text-primary-400">{stats.processing}</span>
              </div>
              <div className="flex items-center justify-between bg-success-500/10 border-2 border-success-500/50 p-2">
                <span className="text-xs text-success-400">已完成</span>
                <span className="font-mono font-bold text-success-400">{stats.completed}</span>
              </div>
              <div className="flex items-center justify-between bg-danger-500/10 border-2 border-danger-500/50 p-2 animate-pulse-slow">
                <span className="text-xs text-danger-400">异常</span>
                <span className="font-mono font-bold text-danger-400">{stats.abnormal}</span>
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-dark-600">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-700 border-2 border-dark-500 text-dark-200 hover:bg-danger-500/10 hover:border-danger-500 hover:text-danger-400 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">退出登录</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-6">
            <div>
              <h2 className="font-mono text-xl font-bold text-white">
                东郊煤改电片区 - 空调主机监控中心
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-dark-300">系统时间</p>
                <p className="font-mono text-sm text-white">
                  {new Date().toLocaleString('zh-CN')}
                </p>
              </div>
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
