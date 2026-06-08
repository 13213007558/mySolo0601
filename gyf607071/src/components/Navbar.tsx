import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  Database,
  FileText,
  Baby,
  LogOut,
  User,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const roleLabels: Record<string, string> = {
  elder: '老人',
  parent: '父母',
  manager: '店长',
  supervisor: '主管',
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const canViewAudit = useStore((s) => s.canViewAudit());
  const canManageData = useStore((s) => s.canManageData());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      path: '/dashboard',
      label: '排程板',
      icon: LayoutDashboard,
      show: true,
    },
    {
      path: '/audit',
      label: '审计日志',
      icon: FileText,
      show: canViewAudit,
    },
    {
      path: '/data-status',
      label: '数据状态',
      icon: Database,
      show: canManageData || (currentUser?.role === 'manager'),
    },
  ];

  if (!currentUser) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-400 to-medical-600 flex items-center justify-center shadow-md">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-lg font-bold text-medical-800">
              晨检复核排程板
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-medical-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-baby-400 to-baby-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-800">
                {currentUser.name}
              </div>
              <div className="text-xs text-gray-500">
                {roleLabels[currentUser.role]}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">退出</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
