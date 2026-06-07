import { useMemo, useState } from 'react';
import {
  ChevronRight,
  Search,
  FileSpreadsheet,
  Baby,
  Thermometer,
  FileText,
  History,
  ShieldAlert,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StatusBadge, ReviewBadge } from '@/components/StatusBadge';
import { PhotoCard } from '@/components/PhotoCard';
import { DataStatePanel, Loading } from '@/components/DataStatePanel';
import { cn } from '@/lib/utils';
import AuditTimeline from './AuditTimeline';

export default function ParentView() {
  const { exportRows, reviews, babies, loading, selectedReviewId, setSelectedReview } = useStore();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return exportRows;
    const s = q.trim().toLowerCase();
    return exportRows.filter(
      (r) =>
        r.babyName.toLowerCase().includes(s) ||
        r.reviewId.toLowerCase().includes(s) ||
        r.className.toLowerCase().includes(s),
    );
  }, [exportRows, q]);

  const review = reviews.find((r) => r.id === selectedReviewId) || null;
  const baby = review ? babies.find((b) => b.id === review.babyId) : null;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading text="正在加载导出表与晨检复核数据…" />
      </div>
    );
  }

  if (!selectedReviewId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
              <FileSpreadsheet className="h-6 w-6 text-sky-600" />
              海豚泳池 2 区 · 保健复核导出表
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              家长端可从导出表反查宝宝详情，追溯体温枪记录与请假条照片原始凭证
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索宝宝姓名 / 复核编号 / 班级"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:w-80"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {['复核编号', '宝宝姓名', '班级', '日期', '复核结论', '体温状态', '请假状态', '照片缺失', '操作'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((row) => (
                <tr
                  key={row.reviewId}
                  onClick={() => setSelectedReview(row.reviewId)}
                  className="cursor-pointer transition hover:bg-sky-50/60"
                >
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-sm text-slate-700">{row.reviewId}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 text-xs font-semibold text-white">
                        {row.babyName.slice(0, 1)}
                      </span>
                      <span className="text-sm font-medium text-slate-900">{row.babyName}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{row.className}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{row.date}</td>
                  <td className="whitespace-nowrap px-5 py-4"><ReviewBadge status={row.status} /></td>
                  <td className="whitespace-nowrap px-5 py-4"><StatusBadge status={row.temperatureStatus} size="sm" /></td>
                  <td className="whitespace-nowrap px-5 py-4"><StatusBadge status={row.leaveStatus} size="sm" /></td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm">
                    {row.hasPhotoMissing ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                        <ShieldAlert className="h-3 w-3" /> 缺失
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600">完整</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-sky-600">
                    <span className="inline-flex items-center gap-1 font-medium">
                      查看详情 <ChevronRight className="h-4 w-4" />
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">
                    未找到匹配的复核记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!review || !baby) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        未找到该复核记录
        <button
          onClick={() => setSelectedReview(null)}
          className="ml-3 text-sky-600 hover:underline"
        >
          返回导出表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => setSelectedReview(null)}
        className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 transition hover:text-sky-700"
      >
        ← 返回导出表
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-400 via-cyan-400 to-teal-400 text-2xl font-bold text-white shadow-lg">
              {baby.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{baby.name}</h2>
                <ReviewBadge status={review.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5"><Baby className="h-4 w-4" /> {baby.className}</span>
                <span>家长：{baby.parentName}</span>
                <span>联系：{baby.parentPhone}</span>
                <span>复核编号：<span className="font-mono">{review.id}</span></span>
                <span>日期：{review.date}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {review.wasManuallySupplemented && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                <History className="h-3.5 w-3.5" /> 手工补录
              </span>
            )}
            {review.isAnomalyCountedNormal && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                <ShieldAlert className="h-3.5 w-3.5" /> 异常入正常汇总（审计已保留）
              </span>
            )}
            {review.hasPhotoMissing && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                照片缺失 · 部分成功
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <DataStatePanel status={review.temperatureStatus} title="体温枪数据">
          <div className="flex items-center gap-3 text-sm">
            <Thermometer className="h-4 w-4" />
            <span>记录数量：{review.thermometerRecords.length}</span>
          </div>
        </DataStatePanel>
        <DataStatePanel status={review.leaveStatus} title="请假条数据">
          <div className="flex items-center gap-3 text-sm">
            <FileText className="h-4 w-4" />
            <span>记录数量：{review.leaveRequests.length}</span>
          </div>
        </DataStatePanel>
        <DataStatePanel status={review.overallStatus} title="整体复合状态">
          <div className="flex items-center gap-3 text-sm">
            当前环节：<span className="font-medium">{review.reviewStage}</span>
          </div>
        </DataStatePanel>
      </div>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Thermometer className="h-5 w-5 text-sky-600" /> 原始体温枪记录
        </h3>
        {review.thermometerRecords.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-10 text-center">
            <p className="text-sm text-amber-700">暂无体温枪记录，等待服务员现场录入或主管补录</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {review.thermometerRecords.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400">体温</p>
                    <p className={cn(
                      'mt-1 text-3xl font-bold',
                      t.temperature >= 37.5 ? 'text-rose-600' : 'text-emerald-600',
                    )}>
                      {t.temperature.toFixed(1)}<span className="ml-1 text-base font-medium text-slate-400">°C</span>
                    </p>
                  </div>
                  <StatusBadge status={t.status} size="sm" />
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>设备编号：<span className="font-mono">{t.deviceId}</span></p>
                  <p>测量时间：{new Date(t.measuredAt).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <FileText className="h-5 w-5 text-sky-600" /> 请假条凭证
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {review.leaveRequests.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
              <p className="text-sm text-slate-500">今日未提交请假条</p>
            </div>
          ) : (
            review.leaveRequests.map((l) => (
              <PhotoCard
                key={l.id}
                photoUrl={l.photoUrl}
                status={l.status}
                caption={l.reason || '（未填写原因）'}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <History className="h-5 w-5 text-sky-600" /> 审计时间线
        </h3>
        <AuditTimeline logs={review.auditLogs} />
      </section>
    </div>
  );
}
