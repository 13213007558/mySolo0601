import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  XCircle,
  Gavel,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  PencilLine,
  Download,
  Copy,
  Check,
  Leaf,
} from 'lucide-react';
import { useRecordStore } from '@/store/useRecordStore';
import type { TrackRecord } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import ExportModal from '@/components/ExportModal';
import OverrideModal from '@/components/OverrideModal';
import RectificationNoteModal from '@/components/RectificationNoteModal';
import {
  buildSummaryText,
  copySummaryToClipboard,
  downloadSummaryAsText,
} from '@/utils/exportSummary';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

const actionLabelMap: Record<string, { label: string; color: string }> = {
  create: { label: '系统创建', color: 'text-warm-500' },
  status_change: { label: '状态变更', color: 'text-sage-500' },
  rectify: { label: '整改记录', color: 'text-coral-500' },
  override: { label: '人工改判', color: 'text-amber2-500' },
  manual_entry: { label: '手工补录', color: 'text-amber2-500' },
};

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getById = useRecordStore((s) => s.getById);
  const setStatus = useRecordStore((s) => s.setStatus);
  const addRectificationLog = useRecordStore((s) => s.addRectificationLog);

  const record: TrackRecord | undefined = id ? getById(id) : undefined;

  const [showExport, setShowExport] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [showRectify, setShowRectify] = useState(false);
  const [showValidation, setShowValidation] = useState(true);
  const [showDiff, setShowDiff] = useState(true);
  const [copiedQuick, setCopiedQuick] = useState(false);

  if (!record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-50 text-coral-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-lg font-semibold text-warm-900">
            未找到该记录
          </h2>
          <p className="mt-1 text-sm text-warm-500">记录可能已被删除或链接无效</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-sage-400 px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-sage-500"
          >
            <ArrowLeft className="h-4 w-4" />
            返回追踪台
          </button>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    setStatus(record.id, 'normal', '护理主管', '复核通过，状态改为正常');
  };

  const handleReject = () => {
    setShowRectify(true);
  };

  const confirmReject = (note: string, operator: string) => {
    setStatus(
      record.id,
      'abnormal',
      operator,
      note || '确认存在禁忌风险，需整改'
    );
    if (note) {
      addRectificationLog(record.id, {
        action: 'rectify',
        operator,
        note,
      });
    }
    setShowRectify(false);
  };

  const confirmOverride = (reason: string, operator: string) => {
    setStatus(record.id, 'manual_overridden', operator, undefined, reason);
    setShowOverride(false);
  };

  const handleQuickCopy = async () => {
    const ok = await copySummaryToClipboard(record);
    if (ok) {
      setCopiedQuick(true);
      setTimeout(() => setCopiedQuick(false), 2000);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-warm-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-base font-semibold text-warm-900">
                  {record.roomNo} 房 · {record.babyName}
                </h1>
                <StatusBadge status={record.status} />
              </div>
              <p className="text-xs text-warm-500">
                {record.mealDate} {record.mealType}
                {record.isManualEntry && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber2-500">
                    <PencilLine className="h-3 w-3" />
                    手工补录
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickCopy}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-all duration-200 ${
                copiedQuick
                  ? 'border-sage-200 bg-sage-50 text-sage-600'
                  : 'border-warm-200 bg-white text-warm-700 hover:border-sage-300 hover:text-sage-500'
              }`}
            >
              {copiedQuick ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {copiedQuick ? '已复制摘要' : '复制摘要'}
              </span>
            </button>
            <button
              onClick={() => downloadSummaryAsText(record)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm text-warm-700 transition-all duration-200 hover:border-sage-300 hover:text-sage-500"
            >
              <Download className="h-4 w-4" />
              下载
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sage-400 px-3.5 py-2 text-sm font-medium text-white transition-all duration-200 shadow-soft hover:bg-sage-500 hover:shadow-card"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">导出给同事</span>
              <span className="sm:hidden">导出</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-5">
            <section className="animate-fade-in-up overflow-hidden rounded-xl2 border border-warm-100 bg-white shadow-soft">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-warm-50">
                <img
                  src={record.photoUrl}
                  alt={record.photoCaption}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="border-t border-warm-100 bg-warm-50/70 px-5 py-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs text-warm-500">
                  <FileText className="h-3.5 w-3.5" />
                  照片说明
                </div>
                <p className="text-sm leading-relaxed text-warm-700">
                  {record.photoCaption}
                </p>
                <p className="mt-2 text-[11px] text-warm-400">
                  上传时间：{formatDateTime(record.createdAt)} · 最近更新：
                  {formatDateTime(record.updatedAt)}
                </p>
              </div>
            </section>

            <section className="animate-fade-in-up rounded-xl2 border border-warm-100 bg-white p-5 shadow-soft" style={{ animationDelay: '60ms' }}>
              <h3 className="mb-3 flex items-center gap-1.5 font-serif text-sm font-semibold text-warm-900">
                <Leaf className="h-4 w-4 text-sage-500" />
                食材清单与禁忌比对
              </h3>
              <div className="overflow-hidden rounded-xl border border-warm-100">
                <table className="w-full text-sm">
                  <thead className="bg-warm-50 text-xs text-warm-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">食材</th>
                      <th className="px-4 py-2.5 text-left font-medium">类别</th>
                      <th className="px-4 py-2.5 text-left font-medium">核查结果</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {record.ingredients.map((ing, idx) => {
                      const matched = record.taboosMatched.find(
                        (t) => t.ingredientName === ing.name
                      );
                      const isAbnormal = !!matched || ing.isForbidden;
                      return (
                        <tr
                          key={idx}
                          className={
                            isAbnormal
                              ? 'bg-coral-50/40'
                              : idx % 2 === 0
                              ? 'bg-white'
                              : 'bg-warm-50/40'
                          }
                        >
                          <td className="relative px-4 py-3">
                            {isAbnormal && (
                              <span className="absolute left-0 top-0 h-full w-1 bg-coral-400" />
                            )}
                            <span className="font-medium text-warm-900">
                              {ing.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-warm-500">{ing.category}</td>
                          <td className="px-4 py-3">
                            {isAbnormal ? (
                              <span className="inline-flex items-center gap-1 text-xs text-coral-500">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                命中禁忌
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-sage-500">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                正常
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {record.taboosMatched.length > 0 && (
                <div className="mt-4 space-y-2">
                  {record.taboosMatched.map((t, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-coral-200/70 bg-coral-50/60 p-3.5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            t.riskLevel === '高'
                              ? 'bg-coral-500 text-white'
                              : t.riskLevel === '中'
                              ? 'bg-amber2-500 text-white'
                              : 'bg-warm-500 text-white'
                          }`}
                        >
                          {t.riskLevel}风险
                        </span>
                        <span className="text-sm font-medium text-warm-900">
                          {t.tabooName}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-warm-700">
                        涉及食材：<span className="text-coral-500">{t.ingredientName}</span>
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-warm-600">
                        {t.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {record.supplementDiffs && record.supplementDiffs.length > 0 && (
              <section className="animate-fade-in-up rounded-xl2 border border-warm-100 bg-white shadow-soft" style={{ animationDelay: '120ms' }}>
                <button
                  onClick={() => setShowDiff((v) => !v)}
                  className="flex w-full items-center justify-between px-5 py-4"
                >
                  <h3 className="flex items-center gap-1.5 font-serif text-sm font-semibold text-warm-900">
                    <PencilLine className="h-4 w-4 text-amber2-500" />
                    补录差异对照
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-normal text-amber2-500">
                      {record.supplementDiffs.length} 处差异
                    </span>
                  </h3>
                  {showDiff ? (
                    <ChevronUp className="h-4 w-4 text-warm-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-warm-400" />
                  )}
                </button>
                {showDiff && (
                  <div className="border-t border-warm-100 px-5 pb-4 pt-3">
                    <div className="overflow-hidden rounded-xl border border-warm-100">
                      <table className="w-full text-sm">
                        <thead className="bg-warm-50 text-xs text-warm-500">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-medium">字段</th>
                            <th className="px-4 py-2.5 text-left font-medium">补录前</th>
                            <th className="px-4 py-2.5 text-left font-medium">补录后</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-warm-100">
                          {record.supplementDiffs.map((d, idx) => (
                            <tr
                              key={idx}
                              className={idx % 2 === 0 ? 'bg-white' : 'bg-warm-50/40'}
                            >
                              <td className="px-4 py-3 font-medium text-warm-700">
                                {d.field}
                              </td>
                              <td className="px-4 py-3 text-warm-400 line-through">
                                {d.before}
                              </td>
                              <td className="px-4 py-3 text-sage-600">{d.after}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="lg:col-span-2 space-y-5">
            <section className="animate-fade-in-up rounded-xl2 border border-warm-100 bg-white p-5 shadow-soft" style={{ animationDelay: '40ms' }}>
              <h3 className="mb-3 font-serif text-sm font-semibold text-warm-900">
                核查操作
              </h3>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm text-warm-500">当前状态</span>
                <StatusBadge status={record.status} size="md" />
              </div>

              {record.status === 'manual_overridden' && record.overrideReason && (
                <div className="mb-4 rounded-xl border border-amber-200/60 bg-amber-50/50 p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber2-500">
                    <Gavel className="h-3.5 w-3.5" />
                    人工改判理由
                  </div>
                  <p className="text-sm leading-relaxed text-warm-700">
                    {record.overrideReason}
                  </p>
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  onClick={handleApprove}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sage-400 px-3 py-2.5 text-sm font-medium text-white transition-all duration-200 shadow-soft hover:bg-sage-500 hover:shadow-card"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  通过
                </button>
                <button
                  onClick={handleReject}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-coral-400 px-3 py-2.5 text-sm font-medium text-white transition-all duration-200 shadow-soft hover:bg-coral-500 hover:shadow-card"
                >
                  <XCircle className="h-4 w-4" />
                  驳回整改
                </button>
                <button
                  onClick={() => setShowOverride(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber2-500/40 bg-amber-50/50 px-3 py-2.5 text-sm font-medium text-amber2-500 transition-all duration-200 hover:bg-amber-100/60"
                >
                  <Gavel className="h-4 w-4" />
                  人工改判
                </button>
              </div>
              <p className="mt-3 text-[11px] text-warm-400">
                操作后将自动写入整改记录时间线，并在服务重启后保留。
              </p>
            </section>

            {record.validationIssues.length > 0 && (
              <section className="animate-fade-in-up rounded-xl2 border border-warm-100 bg-white shadow-soft" style={{ animationDelay: '80ms' }}>
                <button
                  onClick={() => setShowValidation((v) => !v)}
                  className="flex w-full items-center justify-between px-5 py-4"
                >
                  <h3 className="flex items-center gap-1.5 font-serif text-sm font-semibold text-warm-900">
                    <AlertCircle className="h-4 w-4 text-amber2-500" />
                    数据校验提醒
                    <span className="rounded-full bg-coral-50 px-2 py-0.5 text-[11px] font-normal text-coral-500">
                      {record.validationIssues.length} 条
                    </span>
                  </h3>
                  {showValidation ? (
                    <ChevronUp className="h-4 w-4 text-warm-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-warm-400" />
                  )}
                </button>
                {showValidation && (
                  <div className="border-t border-warm-100 px-5 pb-4 pt-3 space-y-3">
                    {record.validationIssues.map((v, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl p-3.5 border ${
                          v.severity === 'error'
                            ? 'bg-coral-50/60 border-coral-200/70'
                            : 'bg-amber-50/40 border-amber-200/50'
                        }`}
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-warm-700">
                            {v.severity === 'error' ? (
                              <XCircle className="h-3.5 w-3.5 text-coral-500" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber2-500" />
                            )}
                            {v.field}
                            <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] text-warm-500">
                              {v.issue}
                            </span>
                          </span>
                          <span className="text-[10px] text-warm-400">
                            严重程度：{v.severity === 'error' ? '错误' : '警告'}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-warm-700">
                          {v.humanReadable}
                        </p>
                        <details className="mt-2 group">
                          <summary className="cursor-pointer text-[11px] text-warm-400 hover:text-warm-600 inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            查看原始数据
                          </summary>
                          <code className="mt-1.5 block rounded-lg bg-warm-900/90 px-3 py-2 text-[11px] text-warm-100 overflow-x-auto">
                            {v.rawValue}
                          </code>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="animate-fade-in-up rounded-xl2 border border-warm-100 bg-white p-5 shadow-soft" style={{ animationDelay: '100ms' }}>
              <h3 className="mb-4 font-serif text-sm font-semibold text-warm-900">
                整改记录时间线
              </h3>
              <ol className="relative space-y-4 border-l border-warm-200 pl-5">
                {[...record.rectificationLogs]
                  .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                  .map((log, idx) => {
                    const meta =
                      actionLabelMap[log.action] ||
                      actionLabelMap.status_change;
                    return (
                      <li key={log.id} className="relative">
                        <span
                          className={`absolute -left-[26px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-warm-100`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              log.action === 'override' || log.action === 'manual_entry'
                                ? 'bg-amber2-500'
                                : log.action === 'rectify'
                                ? 'bg-coral-400'
                                : log.action === 'create'
                                ? 'bg-warm-400'
                                : 'bg-sage-400'
                            }`}
                          />
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`font-medium ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-warm-500">{log.operator}</span>
                          <span className="text-warm-300">·</span>
                          <span className="text-warm-400">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-warm-700">
                          {log.note}
                        </p>
                      </li>
                    );
                  })}
              </ol>
            </section>
          </div>
        </div>
      </main>

      {showExport && <ExportModal record={record} onClose={() => setShowExport(false)} />}
      {showOverride && (
        <OverrideModal
          onClose={() => setShowOverride(false)}
          onConfirm={confirmOverride}
        />
      )}
      {showRectify && (
        <RectificationNoteModal
          title="填写整改备注"
          onClose={() => setShowRectify(false)}
          onConfirm={confirmReject}
        />
      )}
    </div>
  );
}
