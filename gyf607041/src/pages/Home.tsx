import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Baby, ThermometerSun, AlertTriangle, FileX2, ClipboardCheck, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import BabyCard from '../components/BabyCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import ImportToolbar, { ImportResultBanner } from '../components/ImportToolbar';
import type { DataStatus } from '@shared/types';

const filters: { key: DataStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'pending_review', label: '待复核' },
  { key: 'dirty', label: '脏数据' },
  { key: 'empty', label: '空数据' },
  { key: 'missing_material', label: '缺材料' },
];

export default function HomePage() {
  const {
    babies, stats, statusFilter, searchKeyword, loading,
    refreshBabies, setStatusFilter, setSearchKeyword,
  } = useAppStore();

  useEffect(() => { refreshBabies(); }, [statusFilter, searchKeyword]);

  useEffect(() => {
    const t = setTimeout(() => refreshBabies(), 100);
    return () => clearTimeout(t);
  }, []);

  const kind: 'empty' | 'dirty' | 'no-results' =
    babies.length === 0 && !searchKeyword && statusFilter === 'all' ? 'empty'
    : statusFilter === 'dirty' && babies.length > 0 ? 'dirty'
    : babies.length === 0 ? 'no-results' : 'empty';

  return (
    <div className="min-h-screen grain">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/60 shadow-soft">
        <div className="container py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-medical-500 to-warmpink-500 flex items-center justify-center text-white shadow-soft">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-slate-800 tracking-wide">婴幼儿晨检复核提醒墙</h1>
              <p className="text-xs text-slate-500 mt-0.5">月子护理版 · {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索姓名 / 房号..."
                className="pl-9 pr-4 py-2.5 w-64 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100 text-sm"
              />
            </div>
            <Link to="/audit" className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <ClipboardCheck className="w-4 h-4" />
              审计日志
            </Link>
            <ImportToolbar />
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <ImportResultBanner />

        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={<Users className="w-5 h-5" />} label="在管宝宝" value={stats.total || 0} accent="blue" />
          <StatCard icon={<ThermometerSun className="w-5 h-5" />} label="体温正常" value={stats.normal || 0} accent="emerald" />
          <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="待复核" value={stats.pending_review || 0} accent="amber" />
          <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="脏数据" value={stats.dirty || 0} accent="pink" />
          <StatCard icon={<FileX2 className="w-5 h-5" />} label="空数据" value={stats.empty || 0} accent="slate" />
          <StatCard icon={<FileX2 className="w-5 h-5" />} label="缺材料" value={stats.missing_material || 0} accent="rose" />
        </section>

        <section className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = statusFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  active
                    ? 'bg-medical-600 text-white border-medical-600 shadow-soft'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-medical-300 hover:text-medical-600'
                }`}
              >
                {f.label}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <StatusBadge status="normal" size="sm" />
            <StatusBadge status="pending_review" size="sm" />
            <StatusBadge status="dirty" size="sm" />
            <StatusBadge status="empty" size="sm" />
            <StatusBadge status="missing_material" size="sm" />
          </div>
        </section>

        <section>
          {loading && babies.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-white/60 border border-white animate-pulse" />
              ))}
            </div>
          ) : babies.length === 0 ? (
            <EmptyState kind={kind} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {babies.map((b, i) => (
                <Link key={b.id} to={`/baby/${b.id}`} className="block">
                  <BabyCard baby={b} index={i} onClick={() => {}} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-12 py-6 border-t border-slate-100/80 bg-white/40 backdrop-blur-sm">
        <div className="container text-center text-xs text-slate-400">
          婴幼儿晨检复核提醒墙 · 月子护理版 · 服务重启后所有数据（照片说明、状态、整改记录）自动保留
        </div>
      </footer>
    </div>
  );
}
