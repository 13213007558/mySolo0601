import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import {
  ArrowLeft,
  Bed,
  AlertTriangle,
  PlusCircle,
  Clock,
  Edit3,
  Camera,
  FileText,
  User,
  HandCoins,
  ShieldAlert,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  History,
} from 'lucide-react';
import {
  ITEM_TYPE_LABEL,
  METHOD_LABEL,
  RECORD_STATUS_LABEL,
  RECORD_STATUS_CLASS,
  ANOMALY_SEVERITY_LABEL,
  ANOMALY_SEVERITY_CLASS,
  ANOMALY_TYPE_LABEL,
  AUDIT_ACTION_LABEL,
  AUDIT_ACTION_CLASS,
  formatDateTime,
  formatTime,
} from '@/utils/format';
import { applyPrivacyFilter, filterBabyByRole } from '@/utils/privacyFilter';
import type {
  DisinfectionRecord,
  ItemType,
  DisinfectionMethod,
  User as UserType,
  Anomaly,
  AuditLog,
  Baby,
  ClassInfo,
  Role,
} from '@/types';

export default function BabyDetailPage() {
  const { babyId } = useParams<{ babyId: string }>();
  const navigate = useNavigate();

  const allRecords = useAppStore((s) => s.records);
  const allAnomalies = useAppStore((s) => s.anomalies);
  const allAudits = useAppStore((s) => s.auditLogs);
  const allUsers = useAppStore((s) => s.users);
  const allBabies = useAppStore((s) => s.babies);
  const allClasses = useAppStore((s) => s.classes);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const role = useMemo(() => {
    const u = allUsers.find((x) => x.id === currentUserId);
    return u?.role ?? 'nurse';
  }, [allUsers, currentUserId]);

  const rawBaby = useMemo<Baby | undefined>(
    () => allBabies.find((b) => b.id === babyId),
    [allBabies, babyId]
  );

  const records = useMemo<DisinfectionRecord[]>(
    () =>
      allRecords
        .filter((r) => r.babyId === babyId)
        .sort(
          (a, b) =>
            new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime()
        ),
    [allRecords, babyId]
  );

  const anomaliesMap = useMemo<Map<string, Anomaly>>(
    () => new Map(allAnomalies.map((a) => [a.id, a])),
    [allAnomalies]
  );

  const auditMap = useMemo<Map<string, AuditLog[]>>(() => {
    const m = new Map<string, AuditLog[]>();
    for (const log of allAudits) {
      if (!m.has(log.recordId)) m.set(log.recordId, []);
      m.get(log.recordId)!.push(log);
    }
    for (const [k, v] of m.entries()) {
      v.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      m.set(k, v);
    }
    return m;
  }, [allAudits]);

  const usersMap = useMemo(
    () => new Map(allUsers.map((u) => [u.id, u])),
    [allUsers]
  );

  const classesMap = useMemo(
    () => new Map(allClasses.map((c) => [c.id, c])),
    [allClasses]
  );

  const getAnomalyById = (id: string) => anomaliesMap.get(id);
  const getAuditByRecord = (id: string) => auditMap.get(id) ?? [];
  const getUserById = (id: string) => usersMap.get(id);
  const getClassById = (id: string) => classesMap.get(id);
  const currentUser = usersMap.get(currentUserId)!;

  const withdrawRecord = useAppStore((s) => s.withdrawRecord);
  const createManualRecord = useAppStore((s) => s.createManualRecord);

  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DisinfectionRecord | null>(
    null
  );
  const [withdrawReason, setWithdrawReason] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const baby = rawBaby
    ? (filterBabyByRole(rawBaby, role) as typeof rawBaby)
    : null;
  const filteredRecords = applyPrivacyFilter(records, role) as typeof records;
  const cls = rawBaby ? getClassById(rawBaby.classId) : undefined;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handleWithdraw = () => {
    if (!selectedRecord || !withdrawReason.trim()) return;
    const ok = withdrawRecord(selectedRecord.id, withdrawReason.trim());
    if (ok) {
      showToast('记录已撤回，审计日志已保留');
      setShowWithdraw(false);
      setWithdrawReason('');
      setSelectedRecord(null);
    }
  };

  const [manualForm, setManualForm] = useState<{
    itemType: ItemType;
    method: DisinfectionMethod;
    operatedAt: string;
    photoRemark: string;
  }>({
    itemType: 'feeding_bottle',
    method: 'high_temp',
    operatedAt: new Date().toISOString().slice(0, 16),
    photoRemark: '',
  });

  const handleManualSubmit = () => {
    if (!rawBaby) return;
    createManualRecord({
      babyId: rawBaby.id,
      itemType: manualForm.itemType,
      disinfectionMethod: manualForm.method,
      operatorId: currentUser.id,
      operatedAt: new Date(manualForm.operatedAt).toISOString(),
      photoRemark: manualForm.photoRemark || undefined,
    });
    showToast('手工补录成功，已记录补录来源与操作人');
    setShowManualForm(false);
  };

  if (!baby || !rawBaby) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">宝宝信息不存在</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">
          返回总览
        </button>
      </div>
    );
  }

  const canWithdraw = role === 'supervisor' || role === 'admin';

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-slide-in-right flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-400" />
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            rawBaby ? navigate(`/class/${rawBaby.classId}`) : navigate('/')
          }
          className="btn-ghost -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回{cls ? ` ${cls.name}` : '班级'}
        </button>
      </div>

      {/* 宝宝信息头 */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <img
            src={baby.avatar}
            alt=""
            className="w-20 h-20 rounded-2xl bg-teal-50 border-2 border-white shadow-card"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-slate-900">
                {baby.name}
              </h1>
              <span className="chip bg-teal-50 text-teal-700 border border-teal-200">
                <Bed className="w-3 h-3" />
                {baby.bedNo}
              </span>
              {rawBaby.motherName && role !== 'nurse' && (
                <span className="chip bg-slate-50 text-slate-600 border border-slate-200">
                  <User className="w-3 h-3" />
                  家属：{rawBaby.motherName}
                </span>
              )}
              {baby.allergies.map((a) => (
                <span
                  key={a}
                  className="chip bg-coral-50 text-coral-700 border border-coral-100"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {a}过敏
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              入住日期：{baby.admissionDate} · 共 {records.length} 条消毒记录
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/review-wall" className="btn-secondary">
              <AlertTriangle className="w-4 h-4" />
              查看复核墙
            </Link>
            {canWithdraw && (
              <button
                onClick={() => setShowManualForm(true)}
                className="btn-primary"
              >
                <PlusCircle className="w-4 h-4" />
                手工补录
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 时间线记录 */}
      <div>
        <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
          消毒记录时间线
        </h2>
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-teal-200 via-slate-200 to-slate-100" />
          <div className="space-y-4">
            {filteredRecords.map((rec, idx) => {
              const realRec = records[idx];
              const anomaly = realRec.anomalyId
                ? getAnomalyById(realRec.anomalyId)
                : undefined;
              const audits = getAuditByRecord(realRec.id);
              const operator = realRec.operatorId
                ? getUserById(realRec.operatorId)
                : undefined;
              const isManual = rec.isManual;
              const isWithdrawn = rec.status === 'withdrawn';
              const hasAnomaly =
                anomaly && anomaly.status !== 'resolved' && !isWithdrawn;

              return (
                <div
                  key={rec.id}
                  className={`relative pl-10 ${
                    isWithdrawn ? 'opacity-70' : ''
                  }`}
                >
                  <div
                    className={`timeline-dot absolute left-[9px] top-6 ${
                      isWithdrawn
                        ? 'bg-slate-400'
                        : hasAnomaly
                        ? 'bg-coral-500 animate-pulse-dot'
                        : isManual
                        ? 'bg-amber-500'
                        : 'bg-teal-500'
                    }`}
                  />
                  <div
                    className={`card p-4 ${
                      hasAnomaly
                        ? 'ring-2 ring-coral-200 ring-offset-1 border-coral-100'
                        : ''
                    } ${
                      isManual
                        ? 'ring-2 ring-amber-200 ring-offset-1 border-amber-100'
                        : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display font-semibold text-slate-900">
                            {ITEM_TYPE_LABEL[rec.itemType]} ·{' '}
                            {METHOD_LABEL[rec.disinfectionMethod]}
                          </h3>
                          <span
                            className={`chip ${RECORD_STATUS_CLASS[rec.status]}`}
                          >
                            {RECORD_STATUS_LABEL[rec.status]}
                          </span>
                          {isManual && (
                            <span className="chip bg-amber-50 text-amber-700 border border-amber-200">
                              <HandCoins className="w-3 h-3" />
                              手工补录
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(rec.operatedAt)}
                          </span>
                          {operator && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              操作人：
                              {applyPrivacyFilter(operator, role).name ?? '—'}
                            </span>
                          )}
                          {isManual && rec.manualCreatedAt && (
                            <span className="text-amber-700">
                              补录于 {formatDateTime(rec.manualCreatedAt)}
                            </span>
                          )}
                        </div>

                        {rec.photoRemark && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 flex gap-2">
                            <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700">
                              {rec.photoRemark}
                            </p>
                          </div>
                        )}

                        {rec.correction && (
                          <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 mb-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              整改记录
                            </div>
                            <p className="text-sm text-emerald-800">
                              {rec.correction.description}
                            </p>
                            <p className="mt-1 text-xs text-emerald-600">
                              整改人：
                              {(() => {
                                const u = rec.correction.correctedBy
                                  ? getUserById(rec.correction.correctedBy)
                                  : undefined;
                                return u
                                  ? (applyPrivacyFilter(u, role) as Partial<UserType>)
                                      .name
                                  : '—';
                              })()}{' '}
                              · {formatDateTime(rec.correction.correctedAt)}
                            </p>
                          </div>
                        )}

                        {anomaly && (
                          <div
                            className={`mt-3 p-3 rounded-lg border ${ANOMALY_SEVERITY_CLASS[anomaly.severity]} bg-opacity-40`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {ANOMALY_SEVERITY_LABEL[anomaly.severity]} ·{' '}
                              {ANOMALY_TYPE_LABEL[anomaly.type]}
                            </div>
                            <p className="text-sm">{anomaly.description}</p>
                            {anomaly.conflictedRecordIds &&
                              anomaly.conflictedRecordIds.length > 0 && (
                                <p className="mt-1 text-xs opacity-80">
                                  ⚠ 存在预约冲突，需单独核对
                                </p>
                              )}
                          </div>
                        )}

                        {audits.length > 0 && (
                          <details className="mt-3 text-xs group">
                            <summary className="cursor-pointer list-none flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
                              <History className="w-3.5 h-3.5" />
                              审计日志（{audits.length} 条）
                            </summary>
                            <div className="mt-2 space-y-1.5 pl-5 border-l-2 border-slate-100">
                              {audits.map((a) => (
                                <div key={a.id} className="text-slate-600">
                                  <span
                                    className={`chip mr-1.5 ${AUDIT_ACTION_CLASS[a.action]}`}
                                  >
                                    {AUDIT_ACTION_LABEL[a.action]}
                                  </span>
                                  <span className="font-mono">
                                    {formatTime(a.timestamp)}
                                  </span>
                                  {a.reason && (
                                    <span className="text-slate-500">
                                      {' '}
                                      · {a.reason}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {rec.photoUrl ? (
                          <img
                            src={rec.photoUrl}
                            alt=""
                            className="w-24 h-20 object-cover rounded-xl border border-slate-200 cursor-zoom-in hover:scale-105 transition-transform"
                            onClick={() => setSelectedRecord(realRec)}
                          />
                        ) : (
                          <div className="w-24 h-20 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <Camera className="w-5 h-5" />
                            <span className="text-[10px] mt-0.5">
                              缺失照片
                            </span>
                          </div>
                        )}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setSelectedRecord(realRec)}
                            className="btn-ghost !px-2 !py-1 !text-xs"
                          >
                            详情
                          </button>
                          {canWithdraw && !isWithdrawn && (
                            <button
                              onClick={() => {
                                setSelectedRecord(realRec);
                                setShowWithdraw(true);
                              }}
                              className="btn-danger !px-2 !py-1 !text-xs"
                            >
                              <XCircle className="w-3 h-3" />
                              撤回
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 记录详情模态 */}
      {selectedRecord && !showWithdraw && !showManualForm && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onWithdraw={canWithdraw ? () => setShowWithdraw(true) : undefined}
          audits={getAuditByRecord(selectedRecord.id)}
          anomaly={
            selectedRecord.anomalyId
              ? getAnomalyById(selectedRecord.anomalyId)
              : undefined
          }
          operator={
            selectedRecord.operatorId
              ? getUserById(selectedRecord.operatorId)
              : undefined
          }
          role={role}
        />
      )}

      {/* 撤回确认模态 */}
      {showWithdraw && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-coral-50 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5 text-coral-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-slate-900">
                  撤回该条记录
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  撤回后原记录将被标记为"已撤回"，但所有字段及审计日志将完整保留，供主管复查。
                </p>
              </div>
              <button
                onClick={() => {
                  setShowWithdraw(false);
                  setSelectedRecord(null);
                  setWithdrawReason('');
                }}
                className="btn-ghost !p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4">
              <label className="label">撤回原因（必填）</label>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                className="input min-h-[88px] resize-none"
                placeholder="请详细说明撤回原因，将被写入审计日志..."
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowWithdraw(false);
                  setWithdrawReason('');
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawReason.trim()}
                className="btn-danger"
              >
                <XCircle className="w-4 h-4" />
                确认撤回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 手工补录模态 */}
      {showManualForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-600" />
                  手工补录消毒记录
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  补录记录将自动标记来源与操作人，写入审计日志
                </p>
              </div>
              <button
                onClick={() => setShowManualForm(false)}
                className="btn-ghost !p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <label className="label">用品类型</label>
                <select
                  value={manualForm.itemType}
                  onChange={(e) =>
                    setManualForm((f) => ({
                      ...f,
                      itemType: e.target.value as ItemType,
                    }))
                  }
                  className="input"
                >
                  {Object.entries(ITEM_TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">消毒方式</label>
                <select
                  value={manualForm.method}
                  onChange={(e) =>
                    setManualForm((f) => ({
                      ...f,
                      method: e.target.value as DisinfectionMethod,
                    }))
                  }
                  className="input"
                >
                  {Object.entries(METHOD_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">操作时间</label>
                <input
                  type="datetime-local"
                  value={manualForm.operatedAt}
                  onChange={(e) =>
                    setManualForm((f) => ({ ...f, operatedAt: e.target.value }))
                  }
                  className="input"
                />
              </div>
              <div className="col-span-2">
                <label className="label">照片说明 / 备注</label>
                <textarea
                  value={manualForm.photoRemark}
                  onChange={(e) =>
                    setManualForm((f) => ({ ...f, photoRemark: e.target.value }))
                  }
                  className="input min-h-[80px] resize-none"
                  placeholder="例如：8:00 床品紫外线消毒（补录说明）"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowManualForm(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleManualSubmit} className="btn-primary">
                <PlusCircle className="w-4 h-4" />
                确认补录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordDetailModal({
  record,
  onClose,
  onWithdraw,
  audits,
  anomaly,
  operator,
  role,
}: {
  record: DisinfectionRecord;
  onClose: () => void;
  onWithdraw?: () => void;
  audits: AuditLog[];
  anomaly?: Anomaly;
  operator?: UserType;
  role: Role;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-display font-semibold text-slate-900">
            记录详情
          </h3>
          <button onClick={onClose} className="btn-ghost !p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {record.photoUrl && (
            <img
              src={record.photoUrl}
              alt=""
              className="w-full h-56 object-cover rounded-xl border border-slate-200"
            />
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs">用品类型</p>
              <p className="font-medium text-slate-800 mt-0.5">
                {ITEM_TYPE_LABEL[record.itemType]}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">消毒方式</p>
              <p className="font-medium text-slate-800 mt-0.5">
                {METHOD_LABEL[record.disinfectionMethod]}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">操作时间</p>
              <p className="font-mono text-slate-800 mt-0.5">
                {formatDateTime(record.operatedAt)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">状态</p>
              <span className={`chip ${RECORD_STATUS_CLASS[record.status]} mt-0.5`}>
                {RECORD_STATUS_LABEL[record.status]}
              </span>
            </div>
            <div>
              <p className="text-slate-400 text-xs">操作人</p>
              <p className="font-medium text-slate-800 mt-0.5">
                {operator
                  ? (applyPrivacyFilter(operator, role) as any).name
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">记录来源</p>
              <p className="font-medium text-slate-800 mt-0.5">
                {record.isManual ? '手工补录' : '系统录入'}
              </p>
            </div>
          </div>

          {record.photoRemark && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-400">照片说明</p>
              <p className="text-sm text-slate-700 mt-1">{record.photoRemark}</p>
            </div>
          )}

          {record.correction && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium">整改记录</p>
              <p className="text-sm text-emerald-800 mt-1">
                {record.correction.description}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                整改于 {formatDateTime(record.correction.correctedAt)}
              </p>
            </div>
          )}

          {anomaly && (
            <div className={`p-3 rounded-lg border ${ANOMALY_SEVERITY_CLASS[anomaly.severity]}`}>
              <p className="text-xs font-medium">
                {ANOMALY_SEVERITY_LABEL[anomaly.severity]} ·{' '}
                {ANOMALY_TYPE_LABEL[anomaly.type]}
              </p>
              <p className="text-sm mt-1">{anomaly.description}</p>
            </div>
          )}

          {audits.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">审计日志</p>
              <div className="space-y-1.5 pl-4 border-l-2 border-slate-100">
                {audits.map((a) => (
                  <div key={a.id} className="text-xs">
                    <span className={`chip mr-1.5 ${AUDIT_ACTION_CLASS[a.action]}`}>
                      {AUDIT_ACTION_LABEL[a.action]}
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatDateTime(a.timestamp)}
                    </span>
                    {a.reason && (
                      <p className="text-slate-600 mt-0.5 ml-1">{a.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">
            关闭
          </button>
          {onWithdraw && record.status !== 'withdrawn' && (
            <button onClick={onWithdraw} className="btn-danger">
              <XCircle className="w-4 h-4" />
              撤回记录
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
