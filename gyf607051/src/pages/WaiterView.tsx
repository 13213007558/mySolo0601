import { useState } from 'react';
import {
  Smartphone,
  Baby,
  Thermometer,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Send,
  Camera,
  ShieldAlert,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StatusBadge, ReviewBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { MorningReview } from '@shared/types';

export default function WaiterView() {
  const { reviews, babies, updateReview, lastPollError } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [temp, setTemp] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [hasThermoPhoto, setHasThermoPhoto] = useState(true);
  const [hasLeavePhoto, setHasLeavePhoto] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const waiterReviews = reviews.filter((r) => r.reviewStage === 'waiter' || r.status === 'pending');
  const selected = reviews.find((r) => r.id === selectedId) || null;
  const selectedBaby = selected ? babies.find((b) => b.id === selected.babyId) : null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const submitPartial = async (r: MorningReview) => {
    setSubmitting(true);
    try {
      const updated = await api.submitPartial(r.id, '前台服务员小美', '照片缺失，允许部分成功');
      updateReview(updated);
      showToast('已部分成功提交，缺失照片已记审计');
      setSelectedId(null);
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitFull = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const t = parseFloat(temp);
      const hasData = temp || leaveReason;
      if (!hasData) {
        showToast('请至少填写体温或请假原因');
        setSubmitting(false);
        return;
      }
      let updated = await api.supplement(selected.id, {
        temperature: isNaN(t) ? undefined : t,
        leaveReason: leaveReason || undefined,
        operator: '前台服务员小美',
        operatorRole: 'waiter',
      });
      if (!hasThermoPhoto || !hasLeavePhoto) {
        updated = await api.submitPartial(selected.id, '前台服务员小美', '部分凭证缺失');
      } else {
        updated = await api.advanceStage(selected.id, 'kitchen', '前台服务员小美');
      }
      updateReview(updated);
      showToast(hasThermoPhoto && hasLeavePhoto ? '已提交，厨房/后场可见' : '已部分成功提交');
      setSelectedId(null);
      setTemp('');
      setLeaveReason('');
      setHasThermoPhoto(true);
      setHasLeavePhoto(true);
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="mx-auto w-full max-w-sm">
        <div className="relative overflow-hidden rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-950 shadow-2xl">
          <div className="absolute left-1/2 top-0 z-10 h-5 w-32 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
          <div className="bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-50 px-5 pb-6 pt-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">婴幼儿晨检复核</h3>
                <p className="text-xs text-slate-500">海豚泳池 2 区 · 餐厅现场版</p>
              </div>
              <Smartphone className="h-5 w-5 text-sky-600" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">待处理（{waiterReviews.length}）</p>
              {waiterReviews.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-white p-6 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-700">全部已处理</p>
                </div>
              )}
              {waiterReviews.map((r) => {
                const b = babies.find((x) => x.id === r.babyId)!;
                const active = selectedId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(active ? null : r.id)}
                    className={cn(
                      'w-full rounded-2xl border p-4 text-left shadow-sm transition',
                      active
                        ? 'border-sky-400 bg-white shadow-md ring-2 ring-sky-100'
                        : 'border-white bg-white/80 hover:bg-white',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-sm font-bold text-white">
                          {b.name.slice(0, 1)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{b.name}</p>
                          <p className="text-xs text-slate-500">{b.className} · {b.parentName}</p>
                        </div>
                      </div>
                      <ReviewBadge status={r.status} />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <StatusBadge status={r.temperatureStatus} size="sm" />
                      <StatusBadge status={r.leaveStatus} size="sm" />
                      {r.hasPhotoMissing && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          <ShieldAlert className="h-3 w-3" /> 缺照片
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {lastPollError && (
          <p className="mt-3 text-center text-xs text-rose-500">实时同步异常：{lastPollError}</p>
        )}
      </div>

      <div className="space-y-5">
        {!selected ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-16 text-center">
            <Smartphone className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-base font-medium text-slate-500">请从左侧手机列表选择一条待处理记录</p>
            <p className="mt-1 text-sm text-slate-400">模拟服务员在餐厅现场使用手机操作晨检流程</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-xl font-bold text-white">
                    {selectedBaby?.name.slice(0, 1)}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedBaby?.name}</h3>
                    <p className="text-sm text-slate-500">
                      {selectedBaby?.className} · 家长 {selectedBaby?.parentName} · {selectedBaby?.parentPhone}
                    </p>
                  </div>
                </div>
                <ReviewBadge status={selected.status} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Thermometer className="h-4 w-4 text-rose-500" /> 体温（°C）
                  </label>
                  <StatusBadge status={selected.temperatureStatus} size="sm" />
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  placeholder="例如 36.5"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={hasThermoPhoto}
                    onChange={(e) => setHasThermoPhoto(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600"
                  />
                  <Camera className="h-4 w-4" /> 体温枪照片已拍摄
                </label>
                {!hasThermoPhoto && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    ⚠ 照片缺失将允许部分成功提交，并自动写入审计日志
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <FileText className="h-4 w-4 text-sky-500" /> 请假原因
                  </label>
                  <StatusBadge status={selected.leaveStatus} size="sm" />
                </div>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="例如：早上轻微咳嗽，已服药"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={hasLeavePhoto}
                    onChange={(e) => setHasLeavePhoto(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600"
                  />
                  <Camera className="h-4 w-4" /> 请假条照片已上传
                </label>
                {!hasLeavePhoto && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    ⚠ 请假条缺失将允许部分成功提交，审计自动留痕
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={submitFull}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:from-sky-600 hover:to-cyan-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> 提交晨检
              </button>
              <button
                onClick={() => submitPartial(selected)}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              >
                <AlertTriangle className="h-4 w-4" /> 标记缺失并部分提交
              </button>
              <p className="text-xs text-slate-500">
                提交后厨房/后场大屏将实时看到状态变化（每 2s 自动同步）
              </p>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2.5 text-sm text-white shadow-lg backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}
