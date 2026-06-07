import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import FilterBar from '@/components/FilterBar';
import StatsBar from '@/components/StatsBar';
import RecordsTable from '@/components/RecordsTable';
import { useStore, buildQuery } from '@/store/useStore';

export default function Home() {
  const { fetchRecords, total, normalCount, badCount, filters, normalCount: expectedExportCount } =
    useStore();

  useEffect(() => {
    fetchRecords();
  }, []);

  async function handleExport() {
    if (normalCount === 0) {
      alert('暂无可导出的正常记录');
      return;
    }
    const qs = buildQuery(filters);
    const url = `/api/export/records?${qs}&expectedCount=${expectedExportCount}`;

    try {
      const res = await fetch(url);
      if (res.status === 409) {
        const err = await res.json();
        alert(err.error || '页面数量与导出数量不一致，请刷新后重试');
        await fetchRecords();
        return;
      }
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? decodeURIComponent(match[1]) : `奶量交接表_${Date.now()}.csv`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (e: any) {
      alert(e.message || '导出失败');
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <div className="space-y-1 animate-fade-in">
          <h2 className="font-serif text-2xl font-bold text-gray-800">售后记录列表</h2>
          <p className="text-sm text-gray-500">
            按手机号筛选 → 复核详情 → 确认数量 → 导出家长交接表
          </p>
        </div>
        <StatsBar total={total} normalCount={normalCount} badCount={badCount} />
        <FilterBar onExport={handleExport} />
        <RecordsTable />
      </main>
    </div>
  );
}
