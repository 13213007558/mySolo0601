import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AuthRecord, RecordStats } from '../types';
import {
  getAllRecords,
  computeStats,
  labelJudgment,
  labelStatus,
  labelMaterialType,
  subscribeStore,
} from '../store';

export default function ListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AuthRecord[]>([]);
  const [stats, setStats] = useState<RecordStats | null>(null);
  const [showCorrupted, setShowCorrupted] = useState(false);
  const [filterJudgment, setFilterJudgment] = useState<'all' | 'authorized' | 'rejected' | 'pending'>('all');

  const refresh = useCallback(() => {
    const all = getAllRecords();
    setRecords(all);
    setStats(computeStats(all));
  }, []);

  useEffect(() => {
    refresh();
    return subscribeStore(refresh);
  }, [refresh]);

  const displayRecords = records
    .filter(r => (showCorrupted ? r.isCorrupted : !r.isCorrupted))
    .filter(r => filterJudgment === 'all' ? true : r.authJudgment === filterJudgment)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">婴幼儿照片授权巡检屏</h1>
        <p className="text-sm text-slate-500 mt-1">儿保随访版 · 历史版本不可覆盖 · 刷新可追溯</p>
      </header>

      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="记录总数" value={stats.total} accent="text-slate-900" />
          <StatCard label="已授权" value={stats.authorized} accent="text-emerald-600" />
          <StatCard label="未授权" value={stats.rejected} accent="text-rose-600" />
          <StatCard label="待确认" value={stats.pending} accent="text-amber-600" />
          <StatCard label="历史版本合计" value={stats.totalHistoryVersions} accent="text-brand-600" />
          <StatCard label="进行中" value={stats.open} />
          <StatCard label="已关闭" value={stats.closed} />
          <StatCard label="已补录" value={stats.supplemented} accent="text-indigo-600" />
          <StatCard label="补录材料" value={stats.totalSupplementMaterials} accent="text-indigo-600" />
          <StatCard label="异常记录" value={stats.corrupted} accent={stats.corrupted > 0 ? 'text-rose-600' : 'text-slate-500'} />
        </section>
      )}

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="text-sm text-slate-600 font-medium mr-auto">
            {showCorrupted ? '异常记录（隔离显示，不参与统计）' : '正常记录'}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <select
              value={filterJudgment}
              onChange={e => setFilterJudgment(e.target.value as typeof filterJudgment)}
              className="border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700"
            >
              <option value="all">全部判断</option>
              <option value="authorized">已授权</option>
              <option value="rejected">未授权</option>
              <option value="pending">待确认</option>
            </select>
            <button
              onClick={() => setShowCorrupted(v => !v)}
              className={
                'px-3 py-1.5 rounded-md border text-sm font-medium ' +
                (showCorrupted
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
              }
            >
              {showCorrupted ? '返回正常列表' : '查看异常记录'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">婴幼儿</th>
                <th className="px-4 py-3 text-left font-medium">监护人</th>
                <th className="px-4 py-3 text-left font-medium">授权判断</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">材料</th>
                <th className="px-4 py-3 text-left font-medium">版本</th>
                <th className="px-4 py-3 text-left font-medium">最后更新</th>
                <th className="px-4 py-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    {showCorrupted ? '暂无异常记录' : '暂无记录'}
                  </td>
                </tr>
              )}
              {displayRecords.map(r => (
                <tr
                  key={r.id}
                  className={
                    'border-t border-slate-100 hover:bg-slate-50 cursor-pointer ' +
                    (r.isCorrupted ? 'bg-rose-50/40' : '')
                  }
                  onClick={() => navigate(`/record/${r.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{r.babyName}</span>
                      {r.materials.some(m => m.source === 'supplement') && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          含补录
                        </span>
                      )}
                      {r.auditNotes.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                          审计 {r.auditNotes.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.guardianName}</td>
                  <td className="px-4 py-3">
                    <JudgmentPill value={r.authJudgment} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill value={r.status} corrupted={r.isCorrupted} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.materials.length} 项
                    {r.materials.some(m => m.source === 'supplement') && (
                      <span className="text-indigo-600 ml-1">
                        (补录 {r.materials.filter(m => m.source === 'supplement').length})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">v{r.currentVersion}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(r.updatedAt).toLocaleString('zh-CN', { hour12: false })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/record/${r.id}`}
                      onClick={e => e.stopPropagation()}
                      className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                      详情 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-6 text-xs text-slate-400">
        提示：数据保存在浏览器本地；刷新页面、重启服务后历史版本与统计保持不变。补录材料不会覆盖原始判断。
      </footer>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={'mt-1 text-2xl font-semibold tabular-nums ' + (accent || 'text-slate-800')}>{value}</div>
    </div>
  );
}

function JudgmentPill({ value }: { value: AuthRecord['authJudgment'] }) {
  const cls =
    value === 'authorized'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : value === 'rejected'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <span className={'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ' + cls}>
      {labelJudgment(value)}
    </span>
  );
}

function StatusPill({ value, corrupted }: { value: AuthRecord['status']; corrupted: boolean }) {
  if (corrupted) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border bg-rose-100 text-rose-700 border-rose-300">
        数据异常
      </span>
    );
  }
  const cls =
    value === 'open'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : value === 'closed'
      ? 'bg-slate-100 text-slate-600 border-slate-200'
      : 'bg-indigo-50 text-indigo-700 border-indigo-200';
  return (
    <span className={'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ' + cls}>
      {labelStatus(value)}
    </span>
  );
}

export { labelMaterialType };
