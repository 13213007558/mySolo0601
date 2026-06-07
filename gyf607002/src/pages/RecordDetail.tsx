import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Baby,
  Calendar,
  FileText,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileEdit,
  AlertCircle,
  Scale,
  Ban,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge, ValidationBadge, getStatusConfig } from '@/components/StatusBadge';
import {
  mealTypeLabelMap,
  restrictionTypeLabelMap,
  statusLabelMap,
} from '@/types';
import type { RecordStatus } from '@/types';

function formatTime(iso?: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', { hour12: false });
}

export default function RecordDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { records, overrideRecord } = useAppStore();

  const record = useMemo(() => records.find((r) => r.id === id), [records, id]);

  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideBy, setOverrideBy] = useState('夜班老师');
  const [overrideTarget, setOverrideTarget] = useState<RecordStatus>('overridden_normal');

  if (!record) {
    return (
      <div className="container max-w-4xl px-4 py-10">
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-1 mb-6">
          <ArrowLeft size={16} />
          返回列表
        </button>
        <div className="info-card text-center py-16">
          <AlertCircle size={40} className="mx-auto text-status-abnormal mb-3" />
          <p className="text-gray-500">未找到该记录，可能已被删除或 ID 错误。</p>
        </div>
      </div>
    );
  }

  const statusCfg = getStatusConfig(record.status);

  const abnormalValidations = record.validations.filter(
    (v) => v.status !== 'pass',
  );
  const normalValidations = record.validations.filter((v) => v.status === 'pass');

  const handleOverride = () => {
    if (!overrideReason.trim()) return;
    overrideRecord(record.id, {
      by: overrideBy || '夜班老师',
      reason: overrideReason.trim(),
      toStatus: overrideTarget,
    });
    setShowOverrideForm(false);
    setOverrideReason('');
  };

  return (
    <div className="container max-w-4xl px-4 md:px-6 py-6 pb-20">
      <button
        onClick={() => navigate('/')}
        className="btn-secondary flex items-center gap-1.5 mb-5 animate-fade-in"
      >
        <ArrowLeft size={16} />
        返回交接本
      </button>

      <div className="bg-white rounded-2xl shadow-soft p-6 mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl ${statusCfg.bg} flex items-center justify-center`}>
              <Baby size={28} className={statusCfg.text} />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-ink-dark">{record.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {record.ageMonths} 月龄
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  建档 {formatTime(record.createdAt)}
                </span>
                {record.isSupplemented && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-supplemented/10 text-status-supplemented text-xs font-medium">
                    <FileText size={11} />
                    手工补录
                  </span>
                )}
              </div>
            </div>
          </div>
          <StatusBadge status={record.status} size="md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-cream/40 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <AlertTriangle size={12} /> 过敏史
            </p>
            <p className="text-sm text-ink-dark font-medium">{record.allergyHistory}</p>
          </div>
          {record.isSupplemented && (
            <div className="bg-status-supplemented/5 border border-status-supplemented/15 rounded-xl p-4">
              <p className="text-xs text-status-supplemented mb-1 flex items-center gap-1">
                <FileText size={12} /> 补录信息
              </p>
              <p className="text-sm text-ink-dark">
                <span className="font-medium">{record.supplementedBy}</span>
                {' · '}
                {formatTime(record.supplementTime)}
              </p>
              <p className="text-xs text-gray-500 mt-1">原因：{record.supplementReason}</p>
            </div>
          )}
        </div>
      </div>

      <div className="info-card mb-6 animate-fade-in">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Ban size={18} className="text-status-abnormal" />
          禁忌食材清单
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {record.restrictions.map((r) => (
            <div
              key={r.id}
              className="border border-cream-dark rounded-xl p-4 bg-cream/20 hover:bg-cream/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-ink-dark">{r.ingredientName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {restrictionTypeLabelMap[r.restrictionType]}
                  </p>
                </div>
                <span className="text-sm font-semibold text-status-abnormal flex items-center gap-1">
                  <Scale size={13} />
                  {r.maxAmount === 0 ? '禁食' : `≤ ${r.maxAmount}${r.unit}`}
                </span>
              </div>
              {r.note && (
                <p className="text-xs text-gray-500 mt-2 border-t border-cream-dark pt-2">
                  📌 {r.note}
                </p>
              )}
              {r.synonyms && r.synonyms.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  别名：{r.synonyms.join('、')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {record.override && (
        <div className="info-card mb-6 border-2 border-warm/30 animate-fade-in bg-warm/5">
          <h2 className="section-title mb-3 flex items-center gap-2" style={{ borderColor: '#C78A5E' }}>
            <FileEdit size={18} className="text-warm-dark" />
            人工改判记录
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">原状态</p>
              <p className="font-medium">{statusLabelMap[record.override.fromStatus]}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">改判为</p>
              <p className="font-medium">{statusLabelMap[record.override.toStatus]}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">改判人</p>
              <p className="font-medium flex items-center gap-1">
                <User size={12} />
                {record.override.by}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">改判时间</p>
              <p className="font-medium">{formatTime(record.override.time)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-cream-dark">
            <p className="text-xs text-gray-500 mb-1">改判原因</p>
            <p className="text-sm text-ink-dark">{record.override.reason}</p>
          </div>
        </div>
      )}

      <div className="info-card mb-6 animate-fade-in">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-status-abnormal" />
          需关注项（{abnormalValidations.length}）
        </h2>
        {abnormalValidations.length === 0 ? (
          <div className="bg-status-normal/5 border border-status-normal/15 rounded-xl p-5 text-center">
            <CheckCircle2 size={28} className="mx-auto text-status-normal mb-2" />
            <p className="text-sm text-status-normal font-medium">未发现异常匹配项</p>
            <p className="text-xs text-gray-500 mt-1">三日食材表与禁忌清单比对均通过</p>
          </div>
        ) : (
          <div className="space-y-3">
            {abnormalValidations.map((v) => (
              <div
                key={v.id}
                className={`rounded-xl p-4 border ${
                  v.status === 'unit_mismatch'
                    ? 'bg-status-pending/5 border-status-pending/20'
                    : 'bg-status-abnormal/5 border-status-abnormal/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {v.status === 'unit_mismatch' ? (
                      <AlertTriangle size={18} className="text-status-pending shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-status-abnormal shrink-0" />
                    )}
                    <p className="font-medium text-ink-dark">{v.ingredientName}</p>
                    <ValidationBadge status={v.status} />
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    {v.mealType && <span>餐次：{mealTypeLabelMap[v.mealType]}</span>}
                    {v.amount !== undefined && v.unit && (
                      <span>
                        食材：{v.amount}
                        {v.unit}
                      </span>
                    )}
                    {v.maxAllowed !== undefined && v.maxUnit && (
                      <span>
                        限量：{v.maxAllowed}
                        {v.maxUnit}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-ink-dark font-medium mb-1">{v.reason}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{v.detail}</p>
                {v.status === 'unit_mismatch' && (
                  <p className="text-xs text-status-pending mt-2 flex items-center gap-1 bg-white/60 rounded-lg px-2 py-1.5">
                    <AlertTriangle size={12} />
                    原因说明：禁忌表和食材表使用了不同计量单位（{v.maxUnit} vs {v.unit}），系统无法自动换算，请夜班老师人工核对实际用量后决定是否改判。
                  </p>
                )}
                {v.status === 'boundary_triggered' && (
                  <p className="text-xs text-status-abnormal mt-2 flex items-center gap-1 bg-white/60 rounded-lg px-2 py-1.5">
                    <Ban size={12} />
                    原因说明：该食材标注为「完全禁食」（最大摄入量 = 0{v.maxUnit}），即使极少量（{v.amount}{v.unit}）也触发边界值规则。若宝宝已确认耐受，可人工改判。
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {normalValidations.length > 0 && (
        <div className="info-card mb-6 animate-fade-in">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-status-normal" />
            已通过校验（{normalValidations.length}）
          </h2>
          <div className="space-y-2">
            {normalValidations.map((v) => (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-status-normal/5 border border-status-normal/10 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-status-normal shrink-0" />
                  <span className="text-sm text-ink-dark">{v.ingredientName}</span>
                  <ValidationBadge status={v.status} />
                </div>
                <p className="text-xs text-gray-500">{v.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showOverrideForm ? (
        <div className="info-card border-2 border-warm/20 animate-fade-in">
          <h2 className="section-title mb-3" style={{ borderColor: '#C78A5E' }}>
            人工改判
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            如系统判定与实际情况不符（如极微量耐受、单位换算后确认安全等），可在此处人工改判。改判原因将记录并展示在交接摘要中。
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setOverrideTarget('overridden_normal');
                setShowOverrideForm(true);
              }}
              className="btn-secondary"
            >
              改判为「正常」
            </button>
            <button
              onClick={() => {
                setOverrideTarget('overridden_abnormal');
                setShowOverrideForm(true);
              }}
              className="btn-danger"
            >
              改判为「异常」
            </button>
          </div>
        </div>
      ) : (
        <div className="info-card border-2 border-warm animate-fade-in bg-warm/5">
          <h2 className="section-title mb-4" style={{ borderColor: '#C78A5E' }}>
            确认人工改判：
            <span className="ml-2">
              {statusLabelMap[overrideTarget]}
            </span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-dark mb-1.5">
                改判原因 <span className="text-status-abnormal">*</span>
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="例如：虾粉 0.1g 为极微量调味，该宝宝已确认耐受，家长签字同意..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-ink/15 bg-white focus:outline-none focus:ring-2 focus:ring-warm/40 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-dark mb-1.5">改判人</label>
              <input
                type="text"
                value={overrideBy}
                onChange={(e) => setOverrideBy(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-ink/15 bg-white focus:outline-none focus:ring-2 focus:ring-warm/40 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleOverride}
                disabled={!overrideReason.trim()}
                className={`btn-warm ${!overrideReason.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                确认改判
              </button>
              <button
                onClick={() => {
                  setShowOverrideForm(false);
                  setOverrideReason('');
                }}
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
