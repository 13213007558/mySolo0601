import { useEffect, useState } from 'react';
import { Camera, Plus, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import StatsBar from '@/components/StatsBar';
import FilterBar from '@/components/FilterBar';
import AuthCard from '@/components/AuthCard';
import { useAuthStore } from '@/store/authStore';
import ManualEntryModal from '@/components/ManualEntryModal';

export default function Home() {
  const { records, stats, loading, error, fetchAll } = useAuthStore();
  const [showManual, setShowManual] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function handleRefresh() {
    setRefreshing(true);
    fetchAll().finally(() => setTimeout(() => setRefreshing(false), 300));
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Camera className="w-6 h-6 text-brand-500" />
              照片授权交接总览
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              所有变更均保留历史版本，刷新或重启服务后可完整回溯。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 bg-white border border-cream-200 hover:bg-cream-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              刷新
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              手工补录
            </button>
          </div>
        </div>

        <StatsBar stats={stats} />
        <FilterBar />

        {loading && <div className="text-center py-16 text-gray-500">加载中...</div>}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-card p-6 text-center text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="bg-white border border-dashed border-cream-300 rounded-card p-16 text-center text-gray-500">
            <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
            当前条件下暂无记录
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.map((r) => (
              <AuthCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </main>

      {showManual && (
        <ManualEntryModal
          onClose={() => setShowManual(false)}
          onDone={() => {
            setShowManual(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}
