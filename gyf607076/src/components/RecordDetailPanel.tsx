import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusTag, ReasonTag } from './Tags';
import {
  X,
  Calendar,
  MapPin,
  Camera,
  FileText,
  User,
  Phone,
  AlertTriangle,
  Undo2,
  FilePlus,
  Clock,
  ChevronDown,
  ChevronUp,
  History,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  CHANGE_REASON_LABELS,
  STATUS_LABELS,
  SCOPE_OPTIONS,
  type AuthorizationStatus,
  type ChangeReason,
} from '../../shared/types';
import { CreateRecordForm } from './CreateRecordForm';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export function RecordDetailPanel() {
  const selected = useAppStore((s) => s.selectedRecord);
  const clearSelected = useAppStore((s) => s.clearSelected);
  const updateRecord = useAppStore((s) => s.updateRecord);
  const invalidateRecord = useAppStore((s) => s.invalidateRecord);
  const records = useAppStore((s) => s.records);

  const [showSupplementForm, setShowSupplementForm] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState<AuthorizationStatus>('authorized');
  const [changeReason, setChangeReason] = useState<ChangeReason>('status_update');
  const [changeNote, setChangeNote] = useState('');
  const [invalidateReason, setInvalidateReason] = useState('');
  const [showInvalidate, setShowInvalidate] = useState(false);
  const [error, setError] = useState('');

  if (!selected) return null;
  const { current, history } = selected;

  const supplementOf = current.supplementOf
    ? records.find((r) => r.id === current.supplementOf)
    : null;
  const supplements = records.filter((r) => r.supplementOf === current.id);

  async function handleUpdateStatus() {
    setError('');
    const res = await updateRecord(current.id, {
      status: newStatus,
      changeReason,
      changeReasonNote: changeNote || undefined,
    });
    if (res.success) {
      setShowStatusUpdate(false);
      setChangeNote('');
    } else {
      setError(res.error || '操作失败');
    }
  }

  async function handleInvalidate() {
    setError('');
    if (!invalidateReason.trim()) {
      setError('请填写作废原因');
      return;
    }
    const res = await invalidateRecord(current.id, invalidateReason.trim());
    if (res.success) {
      setShowInvalidate(false);
      setInvalidateReason('');
    } else {
      setError(res.error || '操作失败');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm"
        onClick={clearSelected}
      />
      <div className="relative w-full max-w-2xl bg-cream-50 h-full overflow-y-auto shadow-2xl animate-[slideIn_0.25s_ease-out]">
        <div className="sticky top-0 z-10 bg-cream-50/95 backdrop-blur-md border-b border-cream-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display text-xl font-semibold text-ink-900">
                {current.childName}
              </h2>
              <StatusTag status={current.status} />
              {current.isSupplement && (
                <span className="tag bg-sage-100 text-sage-500">
                  <FilePlus size={12} />
                  手工补录
                </span>
              )}
            </div>
            <div className="text-sm text-ink-500">
              {current.photoContext.activityDate} · {current.photoContext.activityName}
            </div>
          </div>
          <button onClick={clearSelected} className="btn-ghost p-2">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-500 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          {!current.dataValid && (
            <div className="bg-ink-300/20 border border-ink-300 rounded-xl p-4">
              <div className="flex items-center gap-2 text-ink-700 font-medium mb-1">
                <Trash2 size={16} />
                该记录已被标记为无效
              </div>
              {current.invalidationReason && (
                <div className="text-sm text-ink-500">{current.invalidationReason}</div>
              )}
            </div>
          )}

          <div className="card p-5 space-y-3">
            <h3 className="font-display text-base font-semibold text-ink-900 flex items-center gap-2">
              <FileText size={16} />
              活动信息
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar size={15} className="text-ink-300 mt-0.5" />
                <div>
                  <div className="text-ink-500 text-xs">活动日期</div>
                  <div className="text-ink-900">{current.photoContext.activityDate}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText size={15} className="text-ink-300 mt-0.5" />
                <div>
                  <div className="text-ink-500 text-xs">活动名称</div>
                  <div className="text-ink-900">{current.photoContext.activityName}</div>
                </div>
              </div>
              {current.photoContext.location && (
                <div className="flex items-start gap-2">
                  <MapPin size={15} className="text-ink-300 mt-0.5" />
                  <div>
                    <div className="text-ink-500 text-xs">活动地点</div>
                    <div className="text-ink-900">{current.photoContext.location}</div>
                  </div>
                </div>
              )}
              {current.photoContext.photographer && (
                <div className="flex items-start gap-2">
                  <Camera size={15} className="text-ink-300 mt-0.5" />
                  <div>
                    <div className="text-ink-500 text-xs">拍摄人</div>
                    <div className="text-ink-900">{current.photoContext.photographer}</div>
                  </div>
                </div>
              )}
            </div>
            {current.photoContext.description && (
              <div className="pt-2 border-t border-cream-200">
                <div className="text-ink-500 text-xs mb-1">补充说明</div>
                <div className="text-ink-700 text-sm">{current.photoContext.description}</div>
              </div>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-display text-base font-semibold text-ink-900 flex items-center gap-2">
              <User size={16} />
              监护人信息
            </h3>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="text-ink-500 text-xs">姓名</div>
                <div className="text-ink-900 font-medium">{current.guardianName}</div>
              </div>
              {current.guardianContact && (
                <div className="flex items-center gap-2">
                  <Phone size={15} className="text-ink-300" />
                  <div className="text-ink-900">{current.guardianContact}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-display text-base font-semibold text-ink-900 flex items-center gap-2">
              <CheckCircle2 size={16} />
              授权范围
            </h3>
            <div className="flex flex-wrap gap-2">
              {current.authorizedScopes.map((s) => (
                <span key={s} className="tag bg-sage-100 text-sage-500">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {current.conflictInfo && (
            <div className="card p-5 bg-warm-50 border-warm-200 space-y-2">
              <h3 className="font-display text-base font-semibold text-warm-600 flex items-center gap-2">
                <AlertTriangle size={16} />
                预约冲突原因
              </h3>
              <div className="text-sm text-ink-700">{current.conflictInfo.conflictDescription}</div>
              {current.conflictInfo.conflictingRecordId && (
                <div className="text-xs text-ink-500">
                  冲突记录 ID：{current.conflictInfo.conflictingRecordId}
                </div>
              )}
            </div>
          )}

          {current.revocationInfo && (
            <div className="card p-5 bg-rose-50 border-rose-200 space-y-2">
              <h3 className="font-display text-base font-semibold text-rose-500 flex items-center gap-2">
                <Undo2 size={16} />
                确认撤回详情
              </h3>
              <div className="text-sm text-ink-700">
                撤回原因：{current.revocationInfo.revocationReason}
              </div>
              <div className="flex gap-4 text-xs text-ink-500">
                <span>操作人：{current.revocationInfo.revokedBy}</span>
                <span>时间：{formatDateTime(current.revocationInfo.revokedAt)}</span>
              </div>
            </div>
          )}

          {supplementOf && (
            <div className="card p-5 bg-sage-50 border-sage-200 space-y-2">
              <h3 className="font-display text-base font-semibold text-sage-500 flex items-center gap-2">
                <FilePlus size={16} />
                原记录关联
              </h3>
              <div className="text-sm text-ink-700">
                本记录是针对「{supplementOf.childName} - {supplementOf.photoContext.activityName}」的手工补录
              </div>
              <div className="text-xs text-ink-500">原记录 ID：{supplementOf.id}</div>
            </div>
          )}

          {supplements.length > 0 && (
            <div className="card p-5 bg-sage-50 border-sage-200 space-y-3">
              <h3 className="font-display text-base font-semibold text-sage-500 flex items-center gap-2">
                <FilePlus size={16} />
                关联补录记录（{supplements.length}）
              </h3>
              {supplements.map((s) => (
                <div key={s.id} className="bg-white rounded-xl p-3 border border-sage-100">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-ink-900">{s.photoContext.activityName}</div>
                    <StatusTag status={s.status} />
                  </div>
                  {s.photoContext.description && (
                    <div className="text-xs text-ink-500 mb-1">{s.photoContext.description}</div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {s.authorizedScopes.map((sc) => (
                      <span key={sc} className="tag bg-cream-100 text-ink-700 text-[11px]">
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showStatusUpdate ? (
            current.dataValid && (
              <div className="card p-5 space-y-3">
                <h3 className="font-display text-base font-semibold text-ink-900">状态管理</h3>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary text-sm" onClick={() => setShowStatusUpdate(true)}>
                    更新授权状态
                  </button>
                  <button className="btn-secondary text-sm" onClick={() => setShowSupplementForm(true)}>
                    <FilePlus size={14} />
                    手工补录
                  </button>
                  <button className="btn-danger text-sm" onClick={() => setShowInvalidate(true)}>
                    <Trash2 size={14} />
                    标记作废
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="card p-5 space-y-4">
              <h3 className="font-display text-base font-semibold text-ink-900">更新授权状态</h3>
              <div>
                <label className="label">目标状态</label>
                <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value as AuthorizationStatus)}>
                  {(['authorized', 'pending', 'denied', 'conflicted', 'revoked'] as AuthorizationStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">变更原因</label>
                <select className="input" value={changeReason} onChange={(e) => setChangeReason(e.target.value as ChangeReason)}>
                  {(Object.keys(CHANGE_REASON_LABELS) as ChangeReason[]).map((r) => (
                    <option key={r} value={r}>{CHANGE_REASON_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">补充说明（可选）</label>
                <textarea className="input min-h-[80px]" value={changeNote} onChange={(e) => setChangeNote(e.target.value)} placeholder="填写变更的具体说明..." />
              </div>
              <div className="flex gap-2">
                <button className="btn-primary" onClick={handleUpdateStatus}>
                  确认更新
                </button>
                <button className="btn-secondary" onClick={() => { setShowStatusUpdate(false); setChangeNote(''); }}>
                  取消
                </button>
              </div>
            </div>
          )}

          {showInvalidate && (
            <div className="card p-5 space-y-4">
              <h3 className="font-display text-base font-semibold text-rose-500 flex items-center gap-2">
                <Trash2 size={16} />
                标记记录作废
              </h3>
              <div className="text-sm text-ink-500">作废后记录不会被删除，但会从正常列表中隐藏，所有历史版本仍可追溯。</div>
              <div>
                <label className="label">作废原因 *</label>
                <textarea className="input min-h-[80px]" value={invalidateReason} onChange={(e) => setInvalidateReason(e.target.value)} placeholder="请说明作废原因..." />
              </div>
              <div className="flex gap-2">
                <button className="btn-danger" onClick={handleInvalidate}>确认作废</button>
                <button className="btn-secondary" onClick={() => { setShowInvalidate(false); setInvalidateReason(''); }}>取消</button>
              </div>
            </div>
          )}

          {showSupplementForm && (
            <CreateRecordForm
              supplementOf={current}
              onClose={() => setShowSupplementForm(false)}
              onSuccess={() => setShowSupplementForm(false)}
            />
          )}

          <div className="card p-5 space-y-4">
            <h3 className="font-display text-base font-semibold text-ink-900 flex items-center gap-2">
              <History size={16} />
              历史版本（{history.length}）
            </h3>
            <div className="space-y-3">
              {history
                .slice()
                .sort((a, b) => b.version - a.version)
                .map((entry, idx) => {
                  const expanded = expandedHistory === idx;
                  return (
                    <div key={entry.version} className="border border-cream-200 rounded-xl overflow-hidden">
                      <button
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-cream-50 transition-colors"
                        onClick={() => setExpandedHistory(expanded ? null : idx)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-warm-100 text-warm-500 flex items-center justify-center text-sm font-bold">
                            v{entry.version}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-ink-900">版本 {entry.version}</span>
                              <ReasonTag reason={entry.changeReason} note={entry.changeReasonNote} />
                              <StatusTag status={entry.snapshot.status} />
                            </div>
                            <div className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                              <Clock size={11} />
                              {formatDateTime(entry.timestamp)}
                              <span className="mx-1">·</span>
                              {entry.operatorName}
                            </div>
                          </div>
                        </div>
                        {expanded ? <ChevronUp size={18} className="text-ink-300" /> : <ChevronDown size={18} className="text-ink-300" />}
                      </button>
                      {expanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-cream-100 bg-cream-50/50">
                          <div className="grid grid-cols-2 gap-3 text-sm pt-3">
                            <div>
                              <div className="text-ink-500 text-xs">状态</div>
                              <div className="text-ink-900">{STATUS_LABELS[entry.snapshot.status]}</div>
                            </div>
                            <div>
                              <div className="text-ink-500 text-xs">监护人</div>
                              <div className="text-ink-900">{entry.snapshot.guardianName}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-ink-500 text-xs">授权范围</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {entry.snapshot.authorizedScopes.map((s) => (
                                  <span key={s} className="tag bg-cream-100 text-ink-700">{s}</span>
                                ))}
                              </div>
                            </div>
                            {entry.changeReasonNote && (
                              <div className="col-span-2">
                                <div className="text-ink-500 text-xs">变更说明</div>
                                <div className="text-ink-700">{entry.changeReasonNote}</div>
                              </div>
                            )}
                            {entry.snapshot.conflictInfo && (
                              <div className="col-span-2">
                                <div className="text-ink-500 text-xs">冲突信息</div>
                                <div className="text-warm-600 text-sm">{entry.snapshot.conflictInfo.conflictDescription}</div>
                              </div>
                            )}
                            {entry.snapshot.revocationInfo && (
                              <div className="col-span-2">
                                <div className="text-ink-500 text-xs">撤回原因</div>
                                <div className="text-rose-500 text-sm">{entry.snapshot.revocationInfo.revocationReason}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
