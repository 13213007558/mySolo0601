import { useState } from 'react';
import { Shield, Edit3, History, Plus, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StatusBadge, ReviewBadge } from '@/components/StatusBadge';
import { DataStatePanel } from '@/components/DataStatePanel';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import AuditTimeline from './AuditTimeline';

export default function ManagerView() {
  const { reviews, babies, updateReview } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(reviews.find((r) => r.wasManuallySupplemented || r.isAnomalyCountedNormal)?.id || null);
  const [showSupplement, setShowSupplement] = useState(false);
  const [temp, setTemp] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selected = reviews.find((r) => r.id === selectedId) || null;
  const selectedBaby = selected ? babies.find((b) => b.id === selected.babyId) : null;

  const problematic = reviews.filter((r) => r.isAnomalyCountedNormal || r.hasPhotoMissing || r.overallStatus !== 'normal');

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const doSupplement = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const t = parseFloat(temp);
      const updated = await api.supplement(selected.id, {
        temperature: isNaN(t) ? undefined : t,
        leaveReason: leaveReason || undefined,
        operator: '主管老王',
        operatorRole: 'manager',
      });
      updateReview(updated);
      showToast('补录成功，审计日志已保留前后快照');
      setShowSupplement(false);
      setTemp('');
      setLeaveReason('');
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const closeReview = async () => {
    if (!selected) return;
    try {
      const updated = await api.advanceStage(selected.id, 'done', '主管老王');
      updateReview(updated);
      showToast('已完成最终复核闭环');
    } catch (e) {
      showToast((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 shadow-sm">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Shield className="h-6 w-6 text-violet-600" /> 主管复查 · 海豚泳池 2 区保健复核审计
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            追踪异常入汇总、照片缺失、手工补录等高风险操作，所有变更均保留快照
          </p>
        </div>
        <div className="flex items-center gap-4">
          <MiniStat label="需关注" value={problematic.length} color="text-rose-600" />
          <MiniStat label="已补录" value={reviews.filter((r) => r.wasManuallySupplemented).length} color="text-sky-600" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">异常 / 补录记录</p>
          {problematic.length === 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-center text-sm text-emerald-700">
              暂无异常记录
            </div>
          )}
          {problematic.map((r) => {
            const b = babies.find((x) => x.id === r.babyId)!;
            const active = selectedId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left shadow-sm transition',
                  active
                    ? 'border-violet-400 bg-white shadow-md ring-2 ring-violet-100'
                    : 'border-slate-200 bg-white hover:border-violet-200',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-sm font-bold text-white">
                      {b.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.className}</p>
                    </div>
                  </div>
                  <ReviewBadge status={r.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.isAnomalyCountedNormal && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                      <AlertTriangle className="h-3 w-3" /> 异常入汇总
                    </span>
                  )}
                  {r.hasPhotoMissing && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      照片缺失
                    </span>
                  )}
                  {r.wasManuallySupplemented && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                      <Edit3 className="h-3 w-3" /> 已补录
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          <p className="pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">全部记录</p>
          {reviews.filter((r) => !problematic.includes(r)).map((r) => {
            const b = babies.find((x) => x.id === r.babyId)!;
            const active = selectedId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={cn(
                  'w-full rounded-2xl border p-3 text-left transition',
                  active ? 'border-slate-400 bg-slate-50' : 'border-slate-100 bg-white hover:bg-slate-50',
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{b.name}</p>
                  <ReviewBadge status={r.status} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          {!selected ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-16 text-center">
              <UserCheck className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">请从左侧选择一条记录进行复查</p>
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-2xl font-bold text-white shadow-lg">
                      {selectedBaby?.name.slice(0, 1)}
                    </span>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedBaby?.name}</h3>
                      <p className="text-sm text-slate-500">
                        {selectedBaby?.className} · 家长 {selectedBaby?.parentName} · {selectedBaby?.parentPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ReviewBadge status={selected.status} />
                    {selected.isAnomalyCountedNormal && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> 异常被算入正常汇总
                      </span>
                    )}
                    {selected.wasManuallySupplemented && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        <Edit3 className="h-3.5 w-3.5" /> 已手工补录
                      </span>
                    )}
                    <button
                      onClick={() => setShowSupplement((v) => !v)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-sky-600"
                    >
                      <Plus className="h-3.5 w-3.5" /> 手工补录
                    </button>
                    {selected.reviewStage !== 'done' && (
                      <button
                        onClick={closeReview}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> 闭环完成
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {showSupplement && (
                <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 shadow-sm">
                  <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Edit3 className="h-5 w-5 text-violet-600" /> 手工补录晨检数据
                    <span className="text-xs font-normal text-slate-500">
                      （补录前后将自动写入审计快照）
                    </span>
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">体温（°C，可选）</label>
                      <input
                        type="number"
                        step="0.1"
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                        placeholder="例如 36.5"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">请假原因（可选）</label>
                      <input
                        type="text"
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="例如：发热请假"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={doSupplement}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-sky-600 disabled:opacity-50"
                    >
                      <History className="h-4 w-4" /> 提交补录（留审计）
                    </button>
                    <p className="text-xs text-slate-500">
                      提交后可在下方审计时间线查看补录前后的完整快照对比
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <DataStatePanel status={selected.temperatureStatus} title="体温枪数据">
                  <div className="text-xs">
                    记录 {selected.thermometerRecords.length} 条
                    {selected.thermometerRecords[0] && (
                      <span className="ml-2 font-semibold">
                        最高 {Math.max(...selected.thermometerRecords.map((t) => t.temperature)).toFixed(1)}°C
                      </span>
                    )}
                  </div>
                </DataStatePanel>
                <DataStatePanel status={selected.leaveStatus} title="请假条数据">
                  <div className="text-xs">记录 {selected.leaveRequests.length} 条</div>
                </DataStatePanel>
                <DataStatePanel status={selected.overallStatus} title="整体复合状态">
                  <div className="text-xs">
                    当前阶段：<span className="font-semibold">{selected.reviewStage}</span>
                  </div>
                </DataStatePanel>
              </div>

              <div>
                <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                  <History className="h-5 w-5 text-violet-600" /> 审计时间线（含补录前后快照）
                </h4>
                <AuditTimeline logs={selected.auditLogs} />
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2.5 text-sm text-white shadow-lg backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-right">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
    </div>
  );
}
