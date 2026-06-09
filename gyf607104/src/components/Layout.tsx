import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Sun, Zap, RefreshCw } from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';
import { useInspectionStore } from '@/store/useInspectionStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { refreshRecords } = useInspectionStore();
  
  const navItems = [
    { path: '/inspection', label: '巡检记录', icon: <FileText className="w-5 h-5" /> },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary-700 font-display tracking-tight">
                  能源组件热斑巡检板
                </h1>
                <p className="text-xs text-gray-500">Hot-Spot Inspection Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={refreshRecords}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="刷新数据"
              >
                <RefreshCw className="w-4 h-4" />
                刷新
              </button>
              <RoleSwitcher />
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link
            to="/inspection"
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              location.pathname === '/inspection'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            巡检记录列表
          </Link>
          
          <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded ml-auto">
            DEMO v1.0
          </div>
        </div>
        
        <main className="animate-fade-in">
          {children}
        </main>
      </div>
      
      <footer className="border-t border-gray-200 mt-12 py-6 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-500" />
              <span>新能源电站运维管理系统 · 热斑检测模块</span>
            </div>
            <div>
              <span>© 2024 能源组件热斑巡检板</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
