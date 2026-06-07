import { useState, useMemo } from 'react';
import {
  Leaf,
  AlertTriangle,
  FileEdit,
  Clock,
  Plus,
  RotateCcw,
  Baby,
} from 'lucide-react';
import { useRecordStore } from '@/store/useRecordStore';
import type { FilterKey } from '@/types';
import StatCard from '@/components/StatCard';
import FilterBar from '@/components/FilterBar';
import RecordCard from '@/components/RecordCard';
import ManualEntryModal from '@/components/ManualEntryModal';

export default function Home() {
  const records = useRecordStore((s) => s.records);
  const filter = useRecordStore((s) => s.filter);
  const setFilter = useRecordStore((s) => s.setFilter);
  const filteredRecords = useRecordStore((s) => s.filteredRecords);
  const stats = useRecordStore((s) => s.stats);
  const resetToSampleData = useRecordStore((s) => s.resetToSampleData);

  const [showManual, setShowManual] = useState(false);

  const list = useMemo(() => filteredRecords(), [records, filter]);
  const s = useMemo(() => stats(), [records]);
  const counts = {
    all: s.total,
    normal: s.normal,
    abnormal: s.abnormal,
    manual_overridden: s.manualOverridden,
    pending: s.pending,
  };
  const complianceRate =
    s.total > 0
      ? Math.round(((s.normal + s.manualOverridden) / s.total) * 100)
      : 0;

  const handleFilter = (k: FilterKey) => setFilter(k);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-warm-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage-300 to-sage-400 text-white shadow-soft">
              <Baby className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold leading-tight text-warm-900">
                婴幼儿辅食禁忌追踪台
              </h1>
              <p className="text-xs text-warm-500">月子护理版 · 早会膳食核查专用</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => resetToSampleData()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-700 transition-all duration-200 hover:border-warm-300 hover:bg-warm-50"
              title="重置为样例数据"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">重置样例</span>
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sage-400 px-3.5 py-2 text-sm font-medium text-white transition-all duration-200 shadow-soft hover:bg-sage-500 hover:shadow-card"
            >
              <Plus className="h-4 w-4" />
              手工补录
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-6 py-6">
        <section className="mb-6 animate-fade-in-up">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-serif text-base font-semibold text-warm-900">
              今日核查概览
            </h2>
            <p className="text-xs text-warm-500">
              合规率 <span className="font-medium text-sage-500">{complianceRate}%</span>
              <span className="mx-1.5 text-warm-300">·</span>
              共 {s.total} 条记录
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="正常"
              value={s.normal}
              accentColor="sage"
              subtitle="无禁忌，通过核查"
              icon={<Leaf className="h-4 w-4" />}
            />
            <StatCard
              label="异常"
              value={s.abnormal}
              accentColor="coral"
              subtitle="命中禁忌，需整改"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <StatCard
              label="人工改判"
              value={s.manualOverridden}
              accentColor="amber"
              subtitle="主管核实后改判"
              icon={<FileEdit className="h-4 w-4" />}
            />
            <StatCard
              label="待审核"
              value={s.pending}
              accentColor="warm"
              subtitle="等待主管确认"
              icon={<Clock className="h-4 w-4" />}
            />
          </div>
        </section>

        <section className="mb-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterBar value={filter} onChange={handleFilter} counts={counts} />
            <p className="text-xs text-warm-500">
              共筛选出 <span className="font-medium text-warm-700">{list.length}</span> 条记录
            </p>
          </div>
        </section>

        <section className="grid gap-3">
          {list.length === 0 ? (
            <div className="rounded-xl2 border border-dashed border-warm-200 bg-white/60 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warm-100 text-warm-400">
                <Leaf className="h-5 w-5" />
              </div>
              <p className="text-sm text-warm-500">当前筛选条件下暂无记录</p>
            </div>
          ) : (
            list.map((r, i) => <RecordCard key={r.id} record={r} index={i} />)
          )}
        </section>

        <footer className="mt-10 pb-6 text-center text-xs text-warm-400">
          数据保存在本地浏览器，关闭浏览器不丢失 · 婴幼儿辅食禁忌追踪台 月子护理版
        </footer>
      </main>

      {showManual && <ManualEntryModal onClose={() => setShowManual(false)} />}
    </div>
  );
}
