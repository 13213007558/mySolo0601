import { CheckCircle2, XCircle, Clock, ChefHat, Radio, Signal } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StatusBadge, ReviewBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const STAGE_META = {
  waiter: { label: '前台录入中', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
  kitchen: { label: '厨房确认中', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  manager: { label: '主管复核中', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  done: { label: '完成', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
} as const;

export default function KitchenView() {
  const { reviews, babies, updateReview, lastPollError } = useStore();
  const [toast, setToast] = useState<string | null>(null);
  const kitchenReviews = reviews.filter((r) => r.reviewStage !== 'waiter');
  const stats = {
    total: kitchenReviews.length,
    passed: kitchenReviews.filter((r) => r.status === 'passed' || r.status === 'supplemented').length,
    rejected: kitchenReviews.filter((r) => r.status === 'rejected').length,
    pending: kitchenReviews.filter((r) => r.status === 'pending').length,
    missing: kitchenReviews.filter((r) => r.hasPhotoMissing).length,
  };

  const advance = async (id: string, to: 'manager' | 'done') => {
    try {
      const r = await api.advanceStage(id, to, '厨房值班小李');
      updateReview(r);
      setToast(to === 'done' ? '已完成晨检闭环' : '已提交主管复核');
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setToast((e as Error).message);
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-semibold tracking-wide">海豚泳池 2 区 · 厨房/后场复核大屏</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              实时同步中
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            服务员前台提交后，此屏状态自动刷新（每 2 秒轮询）
          </p>
        </div>
        <div className="flex items-center gap-6">
          <StatCard label="可见记录" value={stats.total} color="text-sky-300" />
          <StatCard label="已通过" value={stats.passed} color="text-emerald-300" />
          <StatCard label="已退回" value={stats.rejected} color="text-rose-300" />
          <StatCard label="凭证缺失" value={stats.missing} color="text-amber-300" />
        </div>
      </div>

      {lastPollError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <Signal className="h-4 w-4" /> 实时同步中断：{lastPollError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kitchenReviews.length === 0 && (
          <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-16 text-center">
            <Clock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">暂无记录流转至厨房，请等待前台提交</p>
          </div>
        )}
        {kitchenReviews.map((r) => {
          const baby = babies.find((b) => b.id === r.babyId)!;
          const stage = STAGE_META[r.reviewStage];
          return (
            <div
              key={r.id}
              className={cn(
                'relative overflow-hidden rounded-3xl border p-5 shadow-sm transition',
                stage.border,
                'bg-white',
              )}
            >
              <div className={cn('absolute right-0 top-0 rounded-bl-2xl px-3 py-1 text-[11px] font-semibold', stage.bg, stage.color)}>
                {stage.label}
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-base font-bold text-white">
                    {baby.name.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-base font-bold text-slate-900">{baby.name}</p>
                    <p className="text-xs text-slate-500">{baby.className}</p>
                  </div>
                </div>
                <ReviewBadge status={r.status} />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                  <span className="text-slate-500">体温状态</span>
                  <StatusBadge status={r.temperatureStatus} size="sm" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                  <span className="text-slate-500">请假状态</span>
                  <StatusBadge status={r.leaveStatus} size="sm" />
                </div>
                {r.hasPhotoMissing && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <Radio className="h-3.5 w-3.5" /> 部分凭证缺失 · 审计已留痕
                  </div>
                )}
                {r.isAnomalyCountedNormal && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    ⚠ 异常体温被纳入正常汇总，请注意复核
                  </div>
                )}
              </div>

              {r.reviewStage === 'kitchen' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => advance(r.id, 'manager')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-cyan-600"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> 通过并送主管
                  </button>
                  <button
                    onClick={() => advance(r.id, 'done')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> 直接闭环
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2.5 text-sm text-white shadow-lg backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-right">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn('text-3xl font-bold tabular-nums', color)}>{value}</p>
    </div>
  );
}
