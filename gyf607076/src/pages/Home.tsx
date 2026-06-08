import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { StatsPanel } from '@/components/StatsPanel';
import { RecordCard } from '@/components/RecordCard';
import { RecordDetailPanel } from '@/components/RecordDetailPanel';
import { CreateRecordForm } from '@/components/CreateRecordForm';
import { Baby, Plus, Search, RefreshCw, AlertCircle } from 'lucide-react';
import type { AuthorizationStatus } from '../../shared/types';
import { STATUS_LABELS } from '../../shared/types';

export default function Home() {
  const role = useAppStore((s) => s.role);
  const records = useAppStore((s) => s.records);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const fetchAll = useAppStore((s) => s.fetchAll);
  const selectedRecord = useAppStore((s) => s.selectedRecord);

  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuthorizationStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAll();
    setTimeout(() => setRefreshing(false), 500);
  }

  const filtered = records
    .filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        r.childName.toLowerCase().includes(q) ||
        r.childId.toLowerCase().includes(q) ||
        r.photoContext.activityName.toLowerCase().includes(q) ||
        r.guardianName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const supplementRecords = filtered.filter((r) => r.isSupplement);
  const normalRecords = filtered.filter((r) => !r.isSupplement);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-cream-50/80 backdrop-blur-md border-b border-cream-200">
        <div className="container py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl2 bg-warm-500 text-white flex items-center justify-center shadow-soft">
              <Baby size={24} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink-900 leading-tight">
                婴幼儿照片授权追踪台
              </h1>
              <p className="text-xs text-ink-500">家庭协作版 · 历史版本可追溯</p>
            </div>
          </div>
          <RoleSwitcher />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <StatsPanel />

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-500 rounded-xl p-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
            <button className="btn-ghost ml-auto text-sm" onClick={handleRefresh}>
              重试
            </button>
          </div>
        )}

        {role === 'parent' && (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-2 items-center flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  className="input pl-10"
                  placeholder="搜索儿童姓名、编号、活动或监护人..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="input sm:w-40"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AuthorizationStatus | 'all')}
              >
                <option value="all">全部状态</option>
                {(Object.keys(STATUS_LABELS) as AuthorizationStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button className="btn-secondary px-3" onClick={handleRefresh} title="刷新数据">
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
              <Plus size={18} />
              新建记录
            </button>
          </div>
        )}

        {role === 'parent' && showCreate && (
          <CreateRecordForm onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />
        )}

        {loading ? (
          <div className="card p-12 text-center text-ink-500">
            <RefreshCw size={28} className="mx-auto mb-3 animate-spin text-warm-400" />
            加载中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-ink-500">
            <Baby size={40} className="mx-auto mb-3 text-ink-300" />
            暂无匹配的授权记录
          </div>
        ) : role === 'elder' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.slice(0, 4).map((r) => (
              <RecordCard key={r.id} record={r} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {supplementRecords.length > 0 && (
              <div>
                <h3 className="font-display text-base font-semibold text-sage-500 mb-3 flex items-center gap-2">
                  手工补录记录（{supplementRecords.length}）
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {supplementRecords.map((r) => (
                    <RecordCard key={r.id} record={r} />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
                全部记录（{normalRecords.length}）
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {normalRecords.map((r) => (
                  <RecordCard key={r.id} record={r} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-cream-200 mt-12">
        <div className="container py-6 text-center text-xs text-ink-500">
          所有记录自动保存版本历史 · 数据持久化存储，刷新或重启不丢失
        </div>
      </footer>

      {selectedRecord && role === 'parent' && <RecordDetailPanel />}
    </div>
  );
}
