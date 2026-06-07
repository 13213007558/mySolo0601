import { Link, useLocation } from 'react-router-dom';
import { Upload, LayoutGrid, FileCheck, Baby, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function Navbar() {
  const location = useLocation();
  const currentUser = useAppStore((s) => s.currentUser);

  const navItems = [
    { path: '/', label: '数据导入', icon: Upload },
    { path: '/review', label: '宝宝复核墙', icon: LayoutGrid },
    { path: '/audit', label: '主管审计', icon: FileCheck },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-brand-700 leading-tight">
              婴幼儿晨检复核墙
            </h1>
            <p className="text-xs text-gray-500 leading-tight">夜班交接版</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-brand-50 hover:text-brand-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
            <ShieldAlert className="w-4 h-4 text-brand-500" />
            <span className="text-sm text-gray-700 font-medium">{currentUser}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
