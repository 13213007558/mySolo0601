import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  PlusCircle,
  Download,
  User,
  Shield,
  CalendarDays,
} from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';
import { recordsToCSV, downloadCSV, formatDate } from '../utils/format';
import { useState } from 'react';

export function Layout() {
  const location = useLocation();
  const { role, setRole, currentOperator, getFilteredRecords } =
    useRecordStore();
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    try {
      const list = getFilteredRecords();
      const csv = recordsToCSV(list);
      const name = `改期追踪台_${formatDate(new Date().toISOString())}.csv`;
      downloadCSV(csv, name);
    } finally {
      setTimeout(() => setExporting(false), 400);
    }
  };

  const isDashboard = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-paper-50">
      <header className="bg-ink-800 text-ink-50 shadow-card">
        <div className="mx-auto max-w-[1440px] px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-amber-500 flex items-center justify-center shadow-pop">
              <CalendarDays className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <h1 className="font-serif text-lg font-semibold tracking-wide">
                婴幼儿课程改期追踪台
              </h1>
              <p className="text-[11px] text-ink-200 tracking-widest uppercase">
                试听顾问版 · Auditor Console
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 mr-auto ml-10">
            <Link
              to="/"
              className={`px-3 py-1.5 text-sm rounded-sm transition-colors flex items-center gap-1.5 ${
                isDashboard
                  ? 'bg-ink-700 text-white'
                  : 'text-ink-200 hover:text-white hover:bg-ink-700/60'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              追踪台
            </Link>
            <Link
              to="/new"
              className="px-3 py-1.5 text-sm rounded-sm text-ink-200 hover:text-white hover:bg-ink-700/60 transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              手工补录
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-70"
            >
              <Download className="w-4 h-4" />
              导出 CSV
            </button>

            <div className="flex items-center gap-1.5 text-xs bg-ink-700/60 px-2 py-1 rounded-sm">
              {role === 'supervisor' ? (
                <Shield className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <User className="w-3.5 h-3.5 text-ink-200" />
              )}
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'consultant' | 'supervisor')}
                className="bg-transparent text-ink-100 outline-none cursor-pointer"
              >
                <option value="consultant">试听顾问</option>
                <option value="supervisor">课程主管</option>
              </select>
              <span className="text-ink-300">·</span>
              <span className="text-ink-100">{currentOperator}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1440px] px-6 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-paper-200 py-4 text-center text-[11px] text-ink-400 tracking-wide">
        承诺可溯源 · 改判可复核 · 数据可导出
      </footer>
    </div>
  );
}
