import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  X,
  Camera,
  Send,
  ChevronRight,
  AlertOctagon,
  Minus,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ITEM_TYPE_LABEL,
  METHOD_LABEL,
  ANOMALY_TYPE_LABEL,
  ANOMALY_SEVERITY_LABEL,
  ANOMALY_SEVERITY_CLASS,
  formatDateTime,
  formatTime,
} from '@/utils/format';
import { applyPrivacyFilter } from '@/utils/privacyFilter';
import type { Anomaly, DisinfectionRecord, Baby, User, Role } from '@/types';

export default function ReviewWallPage() {
  const navigate = useNavigate();

  const allAnomalies = useAppStore((s) => s.anomalies);
  const allRecords = useAppStore((s) => s.records);
  const allBabies = useAppStore((s) => s.babies);
  const allUsers = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const resolveAnomaly = useAppStore((s) => s.resolveAnomaly);

  const role = useMemo<Role>(() => {
    const u = allUsers.find((x) => x.id === currentUserId);
    return u?.role ?? 'nurse';
  }, [allUsers, currentUserId]);

  const recordsMap = useMemo<Map<string, DisinfectionRecord>>(
    () => new Map(allRecords.map((r) => [r.id, r])),
    [allRecords]
  );
  const babiesMap = useMemo<Map<string, Baby>>(
    () => new Map(allBabies.map((b) => [b.id, b])),
    [allBabies]
  );
  const usersMap = useMemo<Map<string, User>>(
    () => new Map(allUsers.map((u) => [u.id, u])),
    [allUsers]
  );

  const getRecordById = (id: string) => recordsMap.get(id);
  const getBabyById = (id: string) => babiesMap.get(id);
  const getUserById = (id: string) => usersMap.get(id);

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [partialResult, setPartialResult] = useState<{
    resolved: number;
    conflicted: number;
  } | null>(null);

  const pendingList = allAnomalies.filter((a) => a.status === 'pending');
  const resolvedList = allAnomalies.filter((a) => a.status !== 'pending');

  const groupedPending = useMemo(() => {
    return {
      high: pendingList.filter((a) => a.severity === 'high'),
      medium: pendingList.filter((a) => a.severity === 'medium'),
      low: pendingList.filter((a) => a.severity === 'low'),
    };
  }, [pendingList]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleResolve = () => {
    if (!selectedAnomaly || !resolutionNote.trim()) return;
    const result = resolveAnomaly(selectedAnomaly.id, {
      note: resolutionNote.trim(),
    });
    if (result.success) {
      if (result.conflictedIds.length > 0) {
        setPartialResult({
          resolved: result.resolvedIds.length,
          conflicted: result.conflictedIds.length,
        });
        setTimeout(() => setPartialResult(null), 4000);
      }
      showToast(result.message);
      setResolutionNote('');
      setSelectedAnomaly(null);
    }
  };

  const columns: { key: 'high' | 'medium' | 'low'; title: string; icon: any; color: string }[] = [
    { key: 'high', title: '高风险', icon: AlertOctagon, color: 'text-coral-600' },
    { key: 'medium', title: '中风险', icon: AlertTriangle, color: 'text-amber-600' },
    { key: 'low', title: '低风险', icon: AlertCircle, color: 'text-sky-600' },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-slide-in-right flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-400" />
          {toast}
        </div>
      )}
      {partialResult && (
        <div className="fixed top-36 right-6 z-50 bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-3 rounded-xl shadow-lg animate-slide-in-right flex items-start gap-2 max-w-sm">
          <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">部分成功</p>
            <p className="text-xs text-amber-700 mt-0.5">
              已处理 {partialResult.resolved} 项，仍有 {partialResult.conflicted} 项存在预约冲突，需单独核对
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">
          消毒复核墙
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          集中处理异常情况 · 整改后班级页、宝宝详情、接口数据、导出清单自动同步
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs text-slate-500">待处理异常</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-coral-600">
            {pendingList.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">高风险</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-coral-700">
            {groupedPending.high.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">已整改</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-teal-600">
            {resolvedList.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">今日累计</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-800">
            {allAnomalies.length}
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
          待处理看板
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <col.icon className={`w-4 h-4 ${col.color}`} />
                  <h3 className="font-medium text-slate-800 text-sm">
                    {col.title}
                  </h3>
                </div>
                <span className="chip bg-slate-50 text-slate-600 border border-slate-200 font-mono">
                  {groupedPending[col.key].length}
                </span>
              </div>
              <div className="space-y-3">
                {groupedPending[col.key].map((a) => {
                  const record = getRecordById(a.recordId);
                  const baby = record ? getBabyById(record.babyId) : undefined;
                  const filteredBaby = baby
                    ? (applyPrivacyFilter(baby, role) as typeof baby)
                    : null;
                  const operator = record
                    ? getUserById(record.operatorId)
                    : undefined;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAnomaly(a)}
                      className={`w-full text-left p-3 rounded-xl border ${ANOMALY_SEVERITY_CLASS[a.severity]} hover:shadow-sm transition-all group`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            {filteredBaby && (
                              <span className="font-medium text-slate-700">
                                {filteredBaby.name}
                              </span>
                            )}
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">
                              {ANOMALY_TYPE_LABEL[a.type]}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-900 line-clamp-2">
                            {a.description}
                          </p>
                          {record && (
                            <p className="mt-1.5 text-[11px] text-slate-500">
                              {ITEM_TYPE_LABEL[record.itemType]} ·{' '}
                              {METHOD_LABEL[record.disinfectionMethod]} ·{' '}
                              {formatTime(record.operatedAt)}
                            </p>
                          )}
                          {a.conflictedRecordIds &&
                            a.conflictedRecordIds.length > 0 && (
                              <p className="mt-1.5 text-[11px] font-medium text-coral-700 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                存在预约冲突：处理时将部分成功
                              </p>
                            )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
                {groupedPending[col.key].length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    暂无{col.title}异常
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {resolvedList.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
            已整改记录
          </h2>
          <div className="card divide-y divide-slate-100">
            {resolvedList.map((a) => {
              const record = getRecordById(a.recordId);
              const baby = record ? getBabyById(record.babyId) : undefined;
              const filteredBaby = baby
                ? (applyPrivacyFilter(baby, role) as typeof baby)
                : null;
              const resolver = a.resolverId ? getUserById(a.resolverId) : undefined;
              return (
                <div key={a.id} className="p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-medium text-slate-700">
                        {filteredBaby?.name ?? '—'}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">
                        {ANOMALY_TYPE_LABEL[a.type]}
                      </span>
                      {a.status === 'partial_resolved' && (
                        <span className="chip bg-amber-50 text-amber-700 border border-amber-200">
                          部分成功
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{a.description}</p>
                    {a.resolutionNote && (
                      <p className="mt-1 text-xs text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded mt-1">
                        整改说明：{a.resolutionNote}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      处理人：{resolver?.name ?? '—'} ·{' '}
                      {a.resolvedAt ? formatDateTime(a.resolvedAt) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 处理侧滑抽屉 */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-slate-900/30 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedAnomaly(null)}
          />
          <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold text-slate-900">
                  处理异常
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {ANOMALY_SEVERITY_LABEL[selectedAnomaly.severity]} ·{' '}
                  {ANOMALY_TYPE_LABEL[selectedAnomaly.type]}
                </p>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="btn-ghost !p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className={`p-3 rounded-lg border ${ANOMALY_SEVERITY_CLASS[selectedAnomaly.severity]}`}>
                <p className="text-sm">{selectedAnomaly.description}</p>
              </div>

              {(() => {
                const record = getRecordById(selectedAnomaly.recordId);
                const baby = record ? getBabyById(record.babyId) : undefined;
                const filteredBaby = baby
                  ? (applyPrivacyFilter(baby, role) as typeof baby)
                  : null;
                if (!record) return null;
                return (
                  <div className="card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {filteredBaby && (
                        <img
                          src={filteredBaby.avatar}
                          alt=""
                          className="w-10 h-10 rounded-xl bg-slate-100"
                        />
                      )}
                      <div>
                        <p className="font-medium text-slate-800">
                          {filteredBaby?.name ?? '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(record.operatedAt)}
                        </p>
                      </div>
                      {filteredBaby && (
                        <button
                          onClick={() => navigate(`/baby/${filteredBaby.id}`)}
                          className="ml-auto btn-ghost !text-xs"
                        >
                          宝宝详情
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">用品类型</p>
                        <p className="font-medium text-slate-700 mt-0.5">
                          {ITEM_TYPE_LABEL[record.itemType]}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">消毒方式</p>
                        <p className="font-medium text-slate-700 mt-0.5">
                          {METHOD_LABEL[record.disinfectionMethod]}
                        </p>
                      </div>
                    </div>
                    {record.photoRemark && (
                      <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600">
                        {record.photoRemark}
                      </div>
                    )}
                    {record.photoUrl && (
                      <img
                        src={record.photoUrl}
                        alt=""
                        className="w-full h-40 object-cover rounded-lg border border-slate-200"
                      />
                    )}
                  </div>
                );
              })()}

              {selectedAnomaly.conflictedRecordIds &&
                selectedAnomaly.conflictedRecordIds.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-800">
                          检测到预约冲突
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          该时段有 {selectedAnomaly.conflictedRecordIds.length}{' '}
                          条关联记录存在冲突，本次提交将执行「部分成功」：主记录处理完成，冲突项保留待单独核对。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              <div>
                <label className="label">整改说明（必填）</label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="input min-h-[100px] resize-none"
                  placeholder="请详细描述整改措施，例如：重新高温消毒奶瓶 30 分钟，更换全新安抚奶嘴，当班全员培训发放流程..."
                />
              </div>

              <div>
                <label className="label">整改照片（演示用，可留空）</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-500 cursor-pointer transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px] mt-1">添加照片</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="btn-secondary flex-1"
              >
                <Minus className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolutionNote.trim()}
                className="btn-primary flex-1"
              >
                <Send className="w-4 h-4" />
                {selectedAnomaly.conflictedRecordIds &&
                selectedAnomaly.conflictedRecordIds.length > 0
                  ? '提交（部分成功）'
                  : '提交整改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
