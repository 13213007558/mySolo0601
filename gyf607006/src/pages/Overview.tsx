import { useEffect, useState } from 'react';
import { Users, CheckCircle2, AlertTriangle, HelpCircle, Plus, Moon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import StatCard from '@/components/StatCard';
import BabyTable from '@/components/BabyTable';
import AddRecordModal from '@/components/AddRecordModal';
import { formatDate } from '@/utils/format';

export default function Overview() {
  const { summaries, stats, loading, fetchAll } = useAuthStore();
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();
  const shiftEnd = new Date(now);
  shiftEnd.setHours(8, 0, 0, 0);
  if (shiftEnd.getTime() < now.getTime()) shiftEnd.setDate(shiftEnd.getDate() + 1);
  const minutesLeft = Math.max(0, Math.round((shiftEnd.getTime() - now.getTime()) / 60000));

  return (
    <div className="min-h-screen bg-paper-texture">
      <header className="sticky top-0 z-30 border-b border-night-500/60 bg-night-800/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-night-900 shadow-soft">
              <Moon size={20} />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-night-50">
                婴幼儿照片授权对账台
              </h1>
              <p className="text-xs text-night-200">夜班交接版 · 对账历史不可篡改 · 补录自动升版本</p>
            </div>
          </div>
          <div className="hidden items-center gap-4 text-sm text-night-200 md:flex">
            <span>当班日期：{formatDate(Date.now())}</span>
            <span className="text-amber-300">距交接班约 {minutesLeft} 分钟</span>
            <button
              onClick={() => setOpenModal(true)}
              className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-night-900 transition hover:bg-amber-400"
            >
              <Plus size={14} />
              补录记录
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="在册宝宝"
            value={stats?.total ?? 0}
            icon={<Users size={20} />}
            accent="text-amber-400"
            delay={0}
          />
          <StatCard
            label="正常记录"
            value={stats?.normal ?? 0}
            icon={<CheckCircle2 size={20} />}
            accent="text-emerald-400"
            delay={80}
          />
          <StatCard
            label="异常标记"
            value={stats?.anomaly ?? 0}
            icon={<AlertTriangle size={20} />}
            accent="text-rose-400"
            delay={160}
          />
          <StatCard
            label="资料缺失"
            value={stats?.missing ?? 0}
            icon={<HelpCircle size={20} />}
            accent="text-slate-300"
            delay={240}
          />
        </section>

        {stats?.byClass && stats.byClass.length > 0 && (
          <section className="fade-in-up mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3" style={{ animationDelay: '320ms' }}>
            {stats.byClass.map((c) => (
              <div key={c.className} className="rounded-xl border border-night-500/60 bg-night-600/40 px-4 py-3 backdrop-blur">
                <div className="text-xs text-night-200">{c.className}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-semibold text-night-50">{c.normal}</span>
                  <span className="text-xs text-night-300">/ {c.total} 正常</span>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-night-50">宝宝授权记录</h2>
            <span className="text-xs text-night-300">
              {loading ? '加载中…' : `共 ${summaries.length} 位宝宝`}
            </span>
          </div>
          <BabyTable summaries={summaries} />
        </section>

        <section className="mt-8 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-100/90">
          <div className="font-medium text-amber-300">使用说明</div>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            <li>所有记录持久化到服务器端 JSON 文件，<span className="text-amber-300">刷新或重启服务仍可读回</span>。</li>
            <li>每次补录会自动生成新版本（version+1），<span className="text-amber-300">旧判断完整保留不被覆盖</span>。</li>
            <li>照片缺失或填有异常原因的记录会被标记 <code>affectsSummary=false</code>，统计自动跳过，不会污染正常汇总；详情页可看到原因。</li>
            <li>同一宝宝同一业务时间同一来源重复提交不会产生新记录（幂等）。</li>
          </ul>
        </section>
      </main>

      <AddRecordModal open={openModal} onClose={() => setOpenModal(false)} />
    </div>
  );
}
