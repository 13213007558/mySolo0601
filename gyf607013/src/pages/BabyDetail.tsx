import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Baby as BabyIcon,
  CalendarDays,
  Phone,
  User,
  AlertCircle,
  Stethoscope,
  MessageSquare,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Thermometer,
  Timer,
  ArrowLeft,
  UserCheck,
  Edit3,
  Plus,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PrivacyCell from '@/components/PrivacyCell';
import { api } from '@/utils/api';
import { formatDate, formatDuration, getSourceLabel } from '@/utils/format';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { DisinfectionRecord, FollowUpNote, AuditLog, Baby } from '@/types';

interface BabyStats {
  totalRecords: number;
  completed: number;
  pending: number;
  exceptions: number;
  boundaryAudits: number;
}

interface BabyDetailResponse {
  success: boolean;
  data: Baby & {
    className?: string;
    disinfectionRecords: DisinfectionRecord[];
    followUpNotes: FollowUpNote[];
    stats: BabyStats;
  };
  error?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export default function BabyDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const role = currentUser?.role ?? 'staff';
  const isNurse = role === 'nurse' || role === 'supervisor';

  const [loading, setLoading] = useState(true);
  const [babyData, setBabyData] = useState<BabyDetailResponse['data'] | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [recordHistory, setRecordHistory] = useState<Map<string, AuditLog[]>>(new Map());
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [followUpContent, setFollowUpContent] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function loadBabyDetail() {
      setLoading(true);
      try {
        const res = await api<BabyDetailResponse>(`/babies/${id}`);
        if (res.success && !cancelled) {
          setBabyData(res.data);
        }
      } catch (err) {
        console.error('加载宝宝详情失败:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBabyDetail();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function loadRecordHistory(recordId: string) {
    if (recordHistory.has(recordId)) return;
    try {
      const res = await api<ApiResponse<AuditLog[]>>(`/audit-logs?recordId=${recordId}`);
      if (res.success) {
        setRecordHistory((prev) => new Map(prev).set(recordId, res.data));
      }
    } catch (err) {
      console.error('加载变更历史失败:', err);
    }
  }

  function toggleHistory(recordId: string) {
    const isExpanded = expandedHistory.has(recordId);
    if (isExpanded) {
      setExpandedHistory((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    } else {
      loadRecordHistory(recordId);
      setExpandedHistory((prev) => new Set(prev).add(recordId));
    }
  }

  function isRecordModified(record: DisinfectionRecord): boolean {
    return record.createdAt !== record.updatedAt;
  }

  async function handleAddFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !followUpContent.trim() || !currentUser) return;

    setSubmittingFollowUp(true);
    try {
      const newNote: FollowUpNote = {
        id: `fn${Date.now()}`,
        babyId: id,
        content: followUpContent.trim(),
        nextFollowUp: nextFollowUp || undefined,
        createdById: currentUser.id,
        createdByName: currentUser.name,
        createdAt: new Date().toISOString(),
      };

      setBabyData((prev) =>
        prev
          ? {
              ...prev,
              followUpNotes: [newNote, ...prev.followUpNotes],
            }
          : prev
      );
      setFollowUpContent('');
      setNextFollowUp('');
      setShowAddFollowUp(false);
    } catch (err) {
      console.error('添加随访记录失败:', err);
    } finally {
      setSubmittingFollowUp(false);
    }
  }

  if (loading) {
    return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-medical-500" />
        </div>
    );
  }

  if (!babyData) {
    return (
        <div className="rounded-2xl border border-ink-200 bg-white p-12 text-center text-ink-500">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-ink-300" />
          <p>未找到该宝宝信息</p>
          <Link
            to="/classes"
            className="mt-4 inline-flex items-center gap-1 text-medical-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            返回班级总览
          </Link>
        </div>
    );
  }

  const { disinfectionRecords, followUpNotes, stats } = babyData;

  return (
    <>
      <div className="mb-6">
        <Link
          to="/classes"
          className="inline-flex items-center gap-1 text-sm text-ink-500 transition hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" />
          返回班级总览
        </Link>
      </div>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-50">
          <BabyIcon className="h-5 w-5 text-medical-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink-900 page-title">宝宝详情</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-medical-50">
                <BabyIcon className="h-6 w-6 text-medical-600" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">
                  <PrivacyCell value={babyData.name} field="baby.name" role={role} />
                </h2>
                <p className="text-sm text-ink-500">{babyData.className}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-ink-400" />
                <div>
                  <div className="text-xs text-ink-500">出生日期</div>
                  <div className="text-sm text-ink-800">
                    {formatDate(babyData.birthday)}
                  </div>
                </div>
              </div>

              {babyData.allergies && (
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-danger-500" />
                  <div>
                    <div className="text-xs text-ink-500">过敏史</div>
                    <div className="text-sm">
                      <PrivacyCell
                        value={babyData.allergies}
                        field="baby.name"
                        role={role}
                        className="text-danger-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {babyData.guardianName && (
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 text-ink-400" />
                  <div>
                    <div className="text-xs text-ink-500">家长姓名</div>
                    <div className="text-sm">
                      <PrivacyCell
                        value={babyData.guardianName}
                        field="guardianName"
                        role={role}
                      />
                    </div>
                  </div>
                </div>
              )}

              {babyData.guardianPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-ink-400" />
                  <div>
                    <div className="text-xs text-ink-500">联系电话</div>
                    <div className="text-sm">
                      <PrivacyCell
                        value={babyData.guardianPhone}
                        field="guardianPhone"
                        role={role}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
            <h3 className="mb-4 font-semibold text-ink-800">消毒统计</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-ink-50 p-3 text-center">
                <div className="text-2xl font-bold text-ink-800">{stats.totalRecords}</div>
                <div className="text-xs text-ink-500">总记录数</div>
              </div>
              <div className="rounded-xl bg-mint-50 p-3 text-center">
                <div className="text-2xl font-bold text-mint-600">{stats.completed}</div>
                <div className="text-xs text-mint-600">已完成</div>
              </div>
              <div className="rounded-xl bg-warm-50 p-3 text-center">
                <div className="text-2xl font-bold text-warm-600">{stats.pending}</div>
                <div className="text-xs text-warm-600">待执行</div>
              </div>
              <div className="rounded-xl bg-danger-50 p-3 text-center">
                <div className="text-2xl font-bold text-danger-600">{stats.exceptions}</div>
                <div className="text-xs text-danger-600">异常数</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-medical-600" />
                <h3 className="font-semibold text-ink-800">儿保随访记录</h3>
              </div>
              {isNurse && (
                <button
                  type="button"
                  onClick={() => setShowAddFollowUp(!showAddFollowUp)}
                  className="inline-flex items-center gap-1 rounded-lg bg-medical-50 px-2.5 py-1.5 text-xs font-medium text-medical-700 transition hover:bg-medical-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加记录
                </button>
              )}
            </div>

            {showAddFollowUp && isNurse && (
              <form onSubmit={handleAddFollowUp} className="mb-4 rounded-xl border border-ink-100 bg-ink-50 p-4">
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-ink-600">随访备注</label>
                  <textarea
                    value={followUpContent}
                    onChange={(e) => setFollowUpContent(e.target.value)}
                    rows={3}
                    placeholder="请输入随访内容..."
                    className="w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-ink-600">下次随访时间</label>
                  <input
                    type="date"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFollowUp(false)}
                    className="rounded-lg px-3 py-1.5 text-sm text-ink-600 transition hover:bg-ink-100"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={!followUpContent.trim() || submittingFollowUp}
                    className="inline-flex items-center gap-1 rounded-lg bg-medical-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-medical-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submittingFollowUp ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    保存
                  </button>
                </div>
              </form>
            )}

            {followUpNotes.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink-400">暂无随访记录</div>
            ) : (
              <div className="space-y-3">
                {followUpNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-ink-100 bg-ink-50/50 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-ink-500">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>{note.createdByName}</span>
                      </div>
                      <div className="text-xs text-ink-400">
                        {formatDate(note.createdAt, true)}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-ink-700">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-ink-400" />
                      <p className="flex-1">{note.content}</p>
                    </div>
                    {note.nextFollowUp && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-medical-600">
                        <Clock className="h-3.5 w-3.5" />
                        <span>下次随访：{formatDate(note.nextFollowUp)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
            <div className="mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4 text-medical-600" />
              <h3 className="font-semibold text-ink-800">消毒记录时间线</h3>
              <span className="ml-2 text-xs text-ink-400">共 {disinfectionRecords.length} 条</span>
            </div>

            {disinfectionRecords.length === 0 ? (
              <div className="py-12 text-center text-sm text-ink-400">暂无消毒记录</div>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-ink-200" />

                <div className="space-y-6">
                  {disinfectionRecords.map((record) => {
                    const isExpanded = expandedHistory.has(record.id);
                    const modified = isRecordModified(record);
                    const history = recordHistory.get(record.id) || [];

                    return (
                      <div key={record.id} className="relative pl-8">
                        <div
                          className={cn(
                            'absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow',
                            record.status === 'completed' && 'bg-mint-500',
                            record.status === 'processing' && 'bg-medical-500',
                            record.status === 'pending' && 'bg-warm-500',
                            record.status === 'exception' && 'bg-danger-500'
                          )}
                        >
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>

                        <div className="rounded-xl border border-ink-100 bg-white p-4 transition hover:border-ink-200 hover:shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-ink-800">{record.itemName}</h4>
                                <StatusBadge status={record.status} />
                                <span
                                  className={cn(
                                    'inline-flex items-center rounded-md px-2 py-0.5 text-xs',
                                    record.source === 'scan'
                                      ? 'bg-mint-50 text-mint-700'
                                      : 'bg-warm-50 text-warm-700'
                                  )}
                                >
                                  {getSourceLabel(record.source)}
                                </span>
                                {modified && (
                                  <button
                                    type="button"
                                    onClick={() => toggleHistory(record.id)}
                                    className={cn(
                                      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition',
                                      isExpanded
                                        ? 'bg-ink-100 text-ink-700'
                                        : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
                                    )}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    已变更
                                    {isExpanded ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-xs text-ink-500">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(record.actualTime || record.scheduledTime, true)}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Thermometer className="h-3 w-3" />
                                  {record.temperature > 0 ? `${record.temperature}℃` : '-'}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {record.duration > 0 ? formatDuration(record.duration) : '-'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                            <div className="rounded-lg bg-ink-50 px-3 py-2">
                              <div className="text-ink-400">操作人</div>
                              <div className="mt-0.5 text-ink-700">
                                {record.operatorName || '-'}
                              </div>
                            </div>
                            <div className="rounded-lg bg-ink-50 px-3 py-2">
                              <div className="text-ink-400">处理人</div>
                              <div className="mt-0.5 text-ink-700">
                                {record.handlerName || '-'}
                              </div>
                            </div>
                            <div className="rounded-lg bg-ink-50 px-3 py-2">
                              <div className="text-ink-400">复核</div>
                              <div className="mt-0.5 text-ink-700">
                                {record.reviewedByName
                                  ? `${record.reviewedByName} · ${formatDate(record.reviewedAt!, true)}`
                                  : '-'}
                              </div>
                            </div>
                          </div>

                          {record.exceptionNote && (
                            <div className="mt-3 flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">
                              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                              <span>{record.exceptionNote}</span>
                            </div>
                          )}

                          {isExpanded && modified && (
                            <div className="mt-4 border-t border-ink-100 pt-4">
                              <div className="mb-2 text-xs font-medium text-ink-600">变更历史</div>
                              {history.length === 0 ? (
                                <div className="text-xs text-ink-400">加载中...</div>
                              ) : (
                                <div className="space-y-2">
                                  {history.map((log) => (
                                    <div
                                      key={log.id}
                                      className="flex items-start justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs"
                                    >
                                      <div className="flex-1">
                                        <span className="font-medium text-ink-700">
                                          {log.fieldName}
                                        </span>
                                        <span className="mx-1 text-ink-400">:</span>
                                        <span className="text-ink-500">
                                          {String(log.oldValue ?? '无')}
                                        </span>
                                        <span className="mx-1 text-ink-400">→</span>
                                        <span className="text-ink-700">
                                          {String(log.newValue ?? '无')}
                                        </span>
                                      </div>
                                      <div className="ml-3 flex-shrink-0 text-ink-400">
                                        {log.operatorName} · {formatDate(log.operatedAt, true)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
