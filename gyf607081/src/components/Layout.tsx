import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Baby,
  FileSpreadsheet,
  ShieldCheck,
  PlusCircle,
  Thermometer
} from 'lucide-react';
import { useCheckStore } from '../store/useCheckStore';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: '晨检记录', icon: ClipboardList },
  { path: '/export', label: '导出管理', icon: FileSpreadsheet },
  { path: '/audit', label: '审计日志', icon: ShieldCheck },
  { path: '/manual-add', label: '手工补录', icon: PlusCircle }
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const currentOperator = useCheckStore(state => state.currentOperator);
  const { checkRecords } = useCheckStore();

  const normalCount = checkRecords.filter(r => r.dataStatus === 'normal').length;
  const dirtyCount = checkRecords.filter(r => r.dataStatus === 'dirty').length;
  const emptyCount = checkRecords.filter(r => r.dataStatus === 'empty').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Thermometer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
                  婴幼儿晨检复核回访册
                </h1>
                <p className="text-xs text-slate-500">工坊客服版</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-emerald-700 font-medium">正常 {normalCount}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span className="text-amber-700 font-medium">脏数据 {dirtyCount}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-red-700 font-medium">空数据 {emptyCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <Baby className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-slate-700 font-medium">{currentOperator}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white border-r border-slate-200 sticky top-16">
          <nav className="p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-slate-200 mt-4">
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
              <p className="text-xs text-slate-500 mb-2">今日统计</p>
              <div className="text-2xl font-bold text-slate-800">{checkRecords.length}</div>
              <p className="text-xs text-slate-500">条晨检记录</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
