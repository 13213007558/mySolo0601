import { useMemo, useState } from 'react';
import {
  Baby,
  Users,
  Phone,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  AlertOctagon,
} from 'lucide-react';
import { usePickupStore, useSummary } from '@/store/pickupStore';
import { StatCard } from '@/components/StatCard';
import { PickupTable } from '@/components/PickupTable';
import { DetailDrawer } from '@/components/DetailDrawer';
import { cn } from '@/lib/utils';
import type { PickupStatus } from '@/types';

type FilterStatus = PickupStatus | 'all' | 'bad';

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待接送' },
  { key: 'picked', label: '已接走' },
  { key: 'exception', label: '异常' },
  { key: 'withdrawn', label: '已撤回' },
  { key: 'bad', label: '坏行（已隔离）' },
];

export function Home() {
  const summary = useSummary();
  const records = usePickupStore((s) => s.records);
  const selectedId = usePickupStore((s) => s.selectedRecordId);
  const batchResult = usePickupStore((s) => s.lastBatchResult);
  const clearBatch = usePickupStore((s) => s.clearBatchResult);
  const batchConfirm = usePickupStore((s) => s.batchConfirmPending);

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchExpanded, setBatchExpanded] = useState(true);

  const normalRecords = useMemo(() => records.filter((r) => !r.isBadRow), [records]);
  const badRecords = useMemo(() => records.filter((r) => r.isBadRow), [records]);

  const filtered = useMemo(() => {
    if (filter === 'bad') return badRecords;
    if (filter === 'all') return normalRecords;
    return normalRecords.filter((r) => r.status === filter);
  }, [filter, normalRecords, badRecords]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectableIds = useMemo(
    () =>
      new Set(
        filtered
          .filter((r) => r.status === 'pending' && r.pickupType === 'normal' && !r.isBadRow)
          .map((r) => r.id)
      ),
    [filtered]
  );

  const selectAllToggle = () => {
    if (selectedIds.size === selectableIds.size && selectableIds.size > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const doBatchConfirm = () => {
    if (selectedIds.size === 0) return;
    batchConfirm(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="px-6 py-4 border-b border-night-600 bg-night-800/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold text-night-50">夜班授权提醒墙</h1>
            <p className="text-xs text-night-300 mt-0.5">
              西门接送口 · {new Date().toLocaleDateString('zh-CN')} · 页面摘要、详情状态、导出报告三者严格对齐
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllToggle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-night-500 text-night-200 hover:bg-night-700"
            >
              <CheckSquare size={14} /> 全选可批量项
            </button>
            <button
              onClick={doBatchConfirm}
              disabled={selectedIds.size === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-pickup-normal text-white hover:bg-pickup-normal/90 disabled:opacity-40 disabled:cursor-not-allowed btn-glow"
            >
              <CheckSquare size={14} /> 批量确认正常接送（{selectedIds.size}）
            </button>
          </div>
        </div>

        {batchResult && batchResult.failed > 0 && (
          <div className="mt-3 rounded-md bg-pickup-exception/10 border border-pickup-exception/40 overflow-hidden">
            <button
              onClick={() => setBatchExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left"
            >
              <div className="flex items-center gap-2 text-pickup-exception">
                <AlertOctagon size={16} />
                <span className="text-sm font-medium">
                  批量操作部分成功：成功 {batchResult.succeeded} / 失败 {batchResult.failed}（已成功记录不回滚）
                </span>
              </div>
              {batchExpanded ? <ChevronUp size={16} className="text-night-300" /> : <ChevronDown size={16} className="text-night-300" />}
            </button>
            {batchExpanded && (
              <div className="px-4 pb-3 border-t border-pickup-exception/20 space-y-1">
                {batchResult.failedDetails.map((d) => (
                  <div key={d.recordId} className="text-xs text-night-200 font-mono flex gap-2">
                    <span className="text-pickup-exception">✗</span>
                    <span className="text-night-400">{d.recordId}</span>
                    <span>{d.reason}</span>
                  </div>
                ))}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={clearBatch}
                    className="text-xs text-night-300 hover:text-night-50 underline underline-offset-2"
                  >
                    关闭提示
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard
              label="应接送宝宝"
              value={summary.totalExpected}
              icon={<Baby size={18} />}
              accent="slate"
              sub={`待接 ${summary.totalPending}`}
              delay={0}
            />
            <StatCard
              label="已接走"
              value={summary.totalPicked}
              icon={<Users size={18} />}
              accent="green"
              delay={60}
            />
            <StatCard
              label="异常（非坏行）"
              value={summary.totalException}
              icon={<AlertTriangle size={18} />}
              accent="amber"
              delay={120}
            />
            <StatCard
              label="电话授权"
              value={summary.totalPhone}
              icon={<Phone size={18} />}
              accent="blue"
              delay={180}
            />
            <StatCard
              label="临时阿姨"
              value={summary.totalTempAunt}
              icon={<UserCheck size={18} />}
              accent="purple"
              delay={240}
            />
            <StatCard
              label="已撤回"
              value={summary.totalWithdrawn}
              icon={<RotateCcw size={18} />}
              accent="red"
              delay={300}
            />
            <StatCard
              label="坏行（隔离）"
              value={summary.totalBadRows}
              icon={<AlertOctagon size={18} />}
              accent="red"
              sub="不影响正常统计"
              delay={360}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {FILTERS.map((f) => {
                const count =
                  f.key === 'all'
                    ? normalRecords.length
                    : f.key === 'bad'
                      ? badRecords.length
                      : normalRecords.filter((r) => r.status === f.key).length;
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors',
                      active
                        ? 'bg-night-500 text-night-50 border-night-400'
                        : 'bg-night-700/50 text-night-200 border-night-600 hover:bg-night-700'
                    )}
                  >
                    {f.label}
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-mono', active ? 'bg-night-400' : 'bg-night-600')}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-night-700/50 border border-night-600 rounded-lg overflow-hidden">
              {filter !== 'bad' ? (
                <PickupTable
                  records={filtered}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              ) : (
                <div>
                  <div className="px-4 py-2.5 bg-pickup-withdrawn/10 border-b border-pickup-withdrawn/30 flex items-center gap-2 text-pickup-withdrawn text-xs">
                    <AlertOctagon size={14} />
                    <span className="font-medium">坏行独立分组 — 已与正常宝宝隔离，不会拖进异常统计</span>
                  </div>
                  <PickupTable records={badRecords} selectedIds={new Set()} onToggleSelect={() => {}} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedId && <DetailDrawer />}
    </div>
  );
}

export default Home;
