import { useMemo, useState } from 'react';
import {
  Baby,
  ChefHat,
  Eye,
  EyeOff,
  Filter,
  Info,
  LayoutDashboard,
  ScanSearch,
  Sparkles,
} from 'lucide-react';
import { useRecordStore } from '@/store/useRecordStore';
import { STATUS_LABEL, type RecordStatus } from '@/types';
import RecordCard from '@/components/RecordCard';
import RecordDetail from '@/components/RecordDetail';

const FILTER_TABS: { key: RecordStatus | 'all'; label: string; hint?: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常', hint: '巡检通过' },
  { key: 'abnormal', label: '异常', hint: '需处理禁忌' },
  { key: 'overridden', label: '人工改判' },
  { key: 'conflict', label: '预约冲突' },
  { key: 'withdrawn', label: '已撤回' },
  { key: 'pending', label: '待确认' },
];

export default function Home() {
  const {
    getFilteredRecords,
    records,
    statusFilter,
    setStatusFilter,
    showBadData,
    toggleBadData,
    selectRecord,
    selectedRecordId,
    getRecordById,
  } = useRecordStore();

  const [showIntro, setShowIntro] = useState(true);

  const filtered = getFilteredRecords();
  const selected = selectedRecordId ? getRecordById(selectedRecordId) : null;

  const stats = useMemo(() => {
    const valid = records.filter((r) => !r.isBadData);
    return {
      total: valid.length,
      normal: valid.filter((r) => r.status === 'normal').length,
      abnormal: valid.filter((r) => r.status === 'abnormal').length,
      conflict: valid.filter((r) => r.status === 'conflict').length,
      withdrawn: valid.filter((r) => r.status === 'withdrawn').length,
      overridden: valid.filter((r) => r.status === 'overridden').length,
      manual: valid.filter((r) => r.isManualEntry).length,
      bad: records.filter((r) => r.isBadData).length,
    };
  }, [records]);

  if (selected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4">
        <RecordDetail record={selected} onBack={() => selectRecord(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      <header className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-11 h-11 rounded-2xl bg-mint-500 text-white flex items-center justify-center shadow-soft">
            <ScanSearch size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 font-display tracking-tight">
              婴幼儿辅食禁忌巡检屏
              <span className="text-sm font-normal text-slate-400 ml-2">试听顾问版</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              三日食材表巡检 · 状态确认 · 家长改口备注 · 摘要导出
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleBadData}
              className={`btn ${showBadData ? 'btn-secondary' : 'btn-ghost'}`}
              title="坏数据不污染正常记录"
            >
              {showBadData ? <Eye size={14} /> : <EyeOff size={14} />}
              {showBadData ? '显示隔离数据' : '隐藏隔离数据'}
              {stats.bad > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 ml-0.5">
                  {stats.bad}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {showIntro && (
        <div className="card p-4 mb-5 bg-gradient-to-r from-cream-50 to-mint-50 border-cream-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cream-200 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-800">内置样例说明</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                当前已预置 7 条样例，可完整演示三条核心路径：
                <span className="font-medium text-mint-700 mx-1">李小豆（正常巡检通过）</span>、
                <span className="font-medium text-coral-700 mx-1">张乐乐（异常，多项禁忌冲突）</span>、
                <span className="font-medium text-amber-700 mx-1">王一一（人工改判，家长确认）</span>；
                同时覆盖
                <span className="font-medium text-orange-700 mx-1">赵团团（预约冲突）</span>、
                <span className="font-medium text-slate-600 mx-1">孙苗苗（已撤回，保留原因）</span>、
                <span className="font-medium text-amber-700 mx-1">钱壮壮（手工补录）</span>
                以及 1 条隔离坏数据。点击任意卡片可查看详情并操作。
              </p>
            </div>
            <button
              onClick={() => setShowIntro(false)}
              className="btn btn-ghost -mr-2 -mt-2 text-slate-400 hover:text-slate-600"
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Baby size={16} />}
          label="总档案数"
          value={stats.total}
          color="mint"
        />
        <StatCard
          icon={<Info size={16} />}
          label="禁忌异常"
          value={stats.abnormal}
          color="coral"
          highlight={stats.abnormal > 0}
        />
        <StatCard
          icon={<Filter size={16} />}
          label="预约冲突"
          value={stats.conflict}
          color="orange"
        />
        <StatCard
          icon={<ChefHat size={16} />}
          label="手工补录"
          value={stats.manual}
          color="butter"
        />
      </section>

      <section className="card p-3 mb-5">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-mint-500 text-white shadow-soft'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 text-xs ${active ? 'text-white/80' : 'text-slate-400'}`}
                >
                  {tab.key === 'all'
                    ? filtered.length
                    : records.filter(
                        (r) => r.status === tab.key && (!r.isBadData || showBadData)
                      ).length}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <LayoutDashboard size={14} />
            档案列表
            <span className="text-xs text-slate-400 font-normal">
              共 {filtered.length} 条
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <LayoutDashboard size={20} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">当前筛选下暂无记录</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <RecordCard
                key={r.id}
                record={r}
                onClick={() => selectRecord(r.id)}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-10 pb-6 text-center text-xs text-slate-400">
        婴幼儿辅食禁忌巡检屏 · 试听顾问版 · 内置样例可直接演示全部流程
      </footer>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'mint' | 'coral' | 'orange' | 'butter';
  highlight?: boolean;
}) {
  const colorMap = {
    mint: 'bg-mint-50 text-mint-600 border-mint-100',
    coral: 'bg-coral-50 text-coral-600 border-coral-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    butter: 'bg-butter-100 text-amber-700 border-amber-100',
  } as const;

  return (
    <div
      className={`card p-4 border ${colorMap[color]} ${
        highlight ? 'ring-2 ring-coral-200' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium opacity-80">{label}</div>
        <div className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-800 tabular-nums">
        {value}
      </div>
    </div>
  );
}
