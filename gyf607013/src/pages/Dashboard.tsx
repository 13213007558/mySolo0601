import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  UserCheck,
  Plus,
  ScanLine,
  Filter,
  CheckCircle2,
  Clock,
  Thermometer,
  Timer,
  Tag,
  X,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PrivacyCell from '@/components/PrivacyCell';
import { useScheduleStore } from '@/store/scheduleStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';
import {
  STATUS_LABELS,
  formatTime,
  formatDate,
  formatDuration,
} from '@/utils/format';
import type { DisinfectionStatus, DisinfectionRecord, Baby } from '@/types';

const STATUS_COLOR_STRIP: Record<DisinfectionStatus, string> = {
  pending: 'bg-warm-400',
  processing: 'bg-medical-400',
  completed: 'bg-mint-400',
  exception: 'bg-danger-400',
};

const STATUS_FILTER_OPTIONS: Array<{ value: DisinfectionStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: STATUS_LABELS.pending },
  { value: 'processing', label: STATUS_LABELS.processing },
  { value: 'completed', label: STATUS_LABELS.completed },
  { value: 'exception', label: STATUS_LABELS.exception },
];

const ACTION_LABELS: Record<'borrow' | 'return' | 'process', string> = {
  borrow: '借入',
  return: '归还',
  process: '处理',
};

const STATUS_STYLE: Record<string, string> = {
  success: 'bg-mint-50 text-mint-700 border-mint-100',
  warning: 'bg-warm-50 text-warm-700 border-warm-100',
  error: 'bg-danger-50 text-danger-700 border-danger-100',
};

interface ManualForm {
  itemName: string;
  babyId: string;
  temperature: string;
  duration: string;
  scheduledTime: string;
}

const emptyForm: ManualForm = {
  itemName: '',
  babyId: '',
  temperature: '100',
  duration: '30',
  scheduledTime: new Date().toISOString().slice(0, 16),
};

export default function Dashboard() {
  const { currentUser, login } = useAuthStore();
  const role = currentUser?.role || 'staff';

  const {
    records,
    babies,
    classes,
    scanRecords,
    loading,
    fetchAll,
    updateRecord,
    createRecord,
  } = useScheduleStore();

  const [statusFilter, setStatusFilter] = useState<DisinfectionStatus | 'all'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ManualForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!currentUser) {
        try {
          const res = await api<{
            success: boolean;
            data: { user: import('@/types').User; token: string };
          }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ role: 'nurse' }),
            skipAuth: true,
          });
          if (!cancelled && res?.success && res.data) {
            login(res.data.user, res.data.token);
            return;
          }
        } catch {
          // ignore
        }
      }
      if (!cancelled) {
        setBootstrapping(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [currentUser, login]);

  useEffect(() => {
    if (currentUser) {
      setBootstrapping(false);
      fetchAll();
    }
  }, [currentUser, fetchAll]);

  const babyMap = useMemo(() => {
    const map = new Map<string, Baby>();
    babies.forEach((b) => map.set(b.id, b));
    return map;
  }, [babies]);

  const exceptionRecords = useMemo(
    () => records.filter((r) => r.status === 'exception'),
    [records]
  );

  const filteredRecords = useMemo(() => {
    let list = records.slice();
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (classFilter !== 'all') {
      list = list.filter((r) => r.classId === classFilter);
    }
    list.sort(
      (a, b) =>
        new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
    return list;
  }, [records, statusFilter, classFilter]);

  const handleResolveException = async (record: DisinfectionRecord) => {
    if (!currentUser || processingId) return;
    setProcessingId(record.id);
    try {
      const nurse = currentUser.role === 'nurse' ? currentUser : null;
      const reviewer = nurse || { id: 'u2', name: '李护士', role: 'nurse' as const };

      await updateRecord(record.id, {
        status: 'completed',
        handlerId: currentUser.id,
        handlerName: currentUser.name,
        reviewedById: reviewer.id,
        reviewedByName: reviewer.name,
        reviewedAt: new Date().toISOString(),
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !form.itemName || !form.babyId) return;

    const baby = babyMap.get(form.babyId);
    if (!baby) return;

    setSubmitting(true);
    try {
      const scheduledIso = new Date(form.scheduledTime).toISOString();
      await createRecord({
        itemName: form.itemName,
        babyId: form.babyId,
        classId: baby.classId,
        scheduledTime: scheduledIso,
        temperature: Number(form.temperature) || 0,
        duration: Number(form.duration) || 0,
        status: 'pending',
        source: 'manual',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
      });
      setForm(emptyForm);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (bootstrapping || loading) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center text-ink-500">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-medical-200 border-t-medical-500" />
            <p className="text-sm">正在加载排程数据...</p>
          </div>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Calendar className="h-6 w-6 text-medical-500" />
              婴幼儿用品消毒排程板 · 儿保随访版
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {formatDate(new Date(), true)} · 当日排程一览
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DisinfectionStatus | 'all')}
                className="input-field pl-8 pr-8 !w-auto appearance-none"
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="input-field pl-8 pr-8 !w-auto appearance-none"
              >
                <option value="all">全部班级</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              手工补录
            </button>
          </div>
        </header>

        {exceptionRecords.length > 0 && (
          <section>
            <h2 className="section-title mb-3 flex items-center gap-2 text-danger-600">
              <AlertTriangle className="h-5 w-5" />
              待处理异常 ({exceptionRecords.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {exceptionRecords.map((r) => {
                const baby = babyMap.get(r.babyId);
                const isProcessing = processingId === r.id;
                return (
                  <div
                    key={r.id}
                    className="card border-danger-300 border-2 bg-gradient-to-br from-danger-50 to-white"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-ink-900">{r.itemName}</div>
                          <div className="mt-0.5">
                            {baby && (
                              <PrivacyCell
                                value={baby.name}
                                field="baby.name"
                                role={role}
                              />
                            )}
                          </div>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>

                      {r.exceptionNote && (
                        <div className="rounded-lg bg-danger-50/80 border border-danger-100 p-2.5 text-sm text-danger-700">
                          <div className="font-medium mb-0.5 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            异常说明
                          </div>
                          {r.exceptionNote}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-medical-600" />
                          <span className="text-xs text-ink-500">处理人：</span>
                          <span className={cn(
                            'text-sm font-semibold',
                            r.handlerName ? 'text-medical-700' : 'text-ink-400'
                          )}>
                            {r.handlerName || '未指派'}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isProcessing || loading}
                          onClick={() => handleResolveException(r)}
                          className="btn-warm !py-1.5 !px-3 text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {isProcessing ? '处理中...' : '标记已处理'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-medical-500" />
            消毒排程时间轴
          </h2>

          {filteredRecords.length === 0 ? (
            <div className="card p-8 text-center text-ink-400">
              暂无排程记录
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-ink-100 sm:left-6" />
              <div className="space-y-4">
                {filteredRecords.map((r) => {
                  const baby = babyMap.get(r.babyId);
                  const cls = classes.find((c) => c.id === r.classId);
                  return (
                    <div key={r.id} className="relative pl-12 sm:pl-16">
                      <div
                        className={cn(
                          'absolute left-1.5 sm:left-3 top-5 h-4 w-4 rounded-full ring-4 ring-white',
                          STATUS_COLOR_STRIP[r.status]
                        )}
                      />
                      <div className="card overflow-hidden">
                        <div
                          className={cn(
                            'absolute left-10 sm:left-14 top-0 bottom-0 w-1',
                            STATUS_COLOR_STRIP[r.status]
                          )}
                        />
                        <div className="p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-ink-900">
                                  {r.itemName}
                                </span>
                                {r.source === 'scan' ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-medical-100 bg-medical-50 px-2 py-0.5 text-xs text-medical-700">
                                    <ScanLine className="h-3 w-3" />
                                    扫码
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-warm-100 bg-warm-50 px-2 py-0.5 text-xs text-warm-700">
                                    <Tag className="h-3 w-3" />
                                    补录
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                                {baby && (
                                  <PrivacyCell
                                    value={baby.name}
                                    field="baby.name"
                                    role={role}
                                  />
                                )}
                                {cls && <span>· {cls.name}</span>}
                                <span>
                                  预定 {formatTime(r.scheduledTime)}
                                </span>
                                {r.actualTime && (
                                  <span>
                                    · 实际 {formatTime(r.actualTime)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={r.status} />
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                            <div className="flex items-center gap-1.5 text-ink-600">
                              <Thermometer className="h-4 w-4 text-medical-500" />
                              <span>
                                温度：
                                <span className="font-medium text-ink-800">
                                  {r.temperature || '-'}
                                  {r.temperature ? '℃' : ''}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-ink-600">
                              <Timer className="h-4 w-4 text-medical-500" />
                              <span>
                                时长：
                                <span className="font-medium text-ink-800">
                                  {r.duration ? formatDuration(r.duration * 60) : '-'}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                            {r.operatorName && (
                              <div className="text-ink-500">
                                操作人：
                                <span className="font-medium text-ink-700">
                                  {r.operatorName}
                                </span>
                              </div>
                            )}
                            {r.handlerName && (
                              <div className="text-ink-500">
                                处理人：
                                <span className="font-semibold text-medical-700">
                                  {r.handlerName}
                                </span>
                              </div>
                            )}
                            {r.reviewedByName && (
                              <div className="text-ink-500">
                                复核：
                                <span className="font-medium text-mint-700">
                                  {r.reviewedByName}
                                </span>
                                {r.reviewedAt && (
                                  <span className="ml-1 text-ink-400">
                                    {formatDate(r.reviewedAt, true)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-medical-500" />
            借还扫码流水
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-100">
                <thead className="bg-ink-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                      动作
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                      物品
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                      操作人
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                      处理人
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-ink-50">
                  {scanRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-ink-400"
                      >
                        暂无扫码记录
                      </td>
                    </tr>
                  ) : (
                    scanRecords.map((sr) => (
                      <tr key={sr.id} className="hover:bg-ink-50/60">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-ink-700">
                          {formatDate(sr.timestamp, true)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-medical-50 px-2 py-0.5 text-xs font-medium text-medical-700">
                            {ACTION_LABELS[sr.action]}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-ink-800">
                          {sr.itemName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-ink-700">
                          {sr.operatorName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                              STATUS_STYLE[sr.status || 'success'] ||
                                STATUS_STYLE.success
                            )}
                          >
                            {sr.status === 'success'
                              ? '成功'
                              : sr.status === 'warning'
                              ? '警告'
                              : sr.status === 'error'
                              ? '异常'
                              : '成功'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {sr.handlerName ? (
                            <span className="font-semibold text-medical-700">
                              <UserCheck className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
                              {sr.handlerName}
                            </span>
                          ) : (
                            <span className="text-ink-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <div className="card w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h3 className="section-title">手工补录消毒记录</h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setForm(emptyForm);
                }}
                className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 px-5 py-4">
              <div>
                <label className="label-text">物品名称</label>
                <input
                  type="text"
                  required
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  className="input-field"
                  placeholder="如：奶瓶A1、餐具套装"
                />
              </div>

              <div>
                <label className="label-text">所属宝宝</label>
                <select
                  required
                  value={form.babyId}
                  onChange={(e) => setForm({ ...form, babyId: e.target.value })}
                  className="input-field appearance-none"
                >
                  <option value="">请选择宝宝</option>
                  {babies.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {classes.find((c) => c.id === b.classId)?.name
                        ? `（${classes.find((c) => c.id === b.classId)?.name}）`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">
                    <Thermometer className="mr-1 inline h-3.5 w-3.5 text-medical-500" />
                    温度（℃）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.temperature}
                    onChange={(e) =>
                      setForm({ ...form, temperature: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">
                    <Timer className="mr-1 inline h-3.5 w-3.5 text-medical-500" />
                    时长（分钟）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">
                  <Calendar className="mr-1 inline h-3.5 w-3.5 text-medical-500" />
                  预定时间
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.scheduledTime}
                  onChange={(e) =>
                    setForm({ ...form, scheduledTime: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-50 -mx-5 px-5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm(emptyForm);
                  }}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || !form.itemName || !form.babyId}
                >
                  <Plus className="h-4 w-4" />
                  {submitting ? '提交中...' : '提交补录'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
