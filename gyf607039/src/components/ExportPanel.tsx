import { useState, useMemo, useEffect } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import {
  statusLabel,
  identityLabel,
  materialLabel,
  photoLabel,
} from '@/store/useScheduleStore';
import type { ExportOptions, Schedule, SummaryStats } from '../../shared/types';
import { Download, FileSpreadsheet, FileText, CheckSquare, Square, X, Copy, Check } from 'lucide-react';

function escapeCSV(v: string) {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function computeStats(schedules: Schedule[]): SummaryStats {
  const result: SummaryStats = {
    total: schedules.length,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    partialSuccess: 0,
    pendingIdentity: 0,
    missingMaterial: 0,
    missingPhoto: 0,
    manuallyCorrected: 0,
  };
  schedules.forEach((s) => {
    if (s.status === 'confirmed') result.confirmed++;
    if (s.status === 'in_progress') result.inProgress++;
    if (s.status === 'completed') result.completed++;
    if (s.status === 'failed') result.failed++;
    if (s.isPartialSuccess) result.partialSuccess++;
    if (s.identityStatus !== 'verified') result.pendingIdentity++;
    if (s.materialStatus === 'missing' || s.materialStatus === 'partial') result.missingMaterial++;
    if (s.photoStatus === 'missing' || s.photoStatus === 'rejected') result.missingPhoto++;
    if (s.status === 'manually_corrected') result.manuallyCorrected++;
  });
  return result;
}

function computeFiltered(
  schedules: Schedule[],
  searchKeyword: string,
  statusFilter: string
): Schedule[] {
  return schedules.filter((s) => {
    const kw = searchKeyword.trim().toLowerCase();
    const matchKw =
      !kw ||
      s.childName.toLowerCase().includes(kw) ||
      s.childNickname.toLowerCase().includes(kw) ||
      s.id.toLowerCase().includes(kw) ||
      s.trialCourseName.toLowerCase().includes(kw) ||
      s.consultant.toLowerCase().includes(kw);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchKw && matchStatus;
  });
}

function buildReport(
  schedules: Schedule[],
  stats: SummaryStats,
  operator: string,
  options: ExportOptions
): string {
  const header = [
    '排程编号', '幼儿姓名', '昵称', '试听课程', '排程日期', '排程时间', '接车时间', '送达时间',
    '顾问', '排程状态', '身份核验', '材料状态', '照片状态', '是否部分成功',
    '失败原因', '部分成功原因', '人工更正备注',
  ];
  const rows = schedules.map((s) => [
    s.id, s.childName, s.childNickname, s.trialCourseName, s.scheduledDate, s.scheduledTime,
    s.pickUpTime, s.dropOffTime, s.consultant, statusLabel[s.status],
    identityLabel[s.identityStatus], materialLabel[s.materialStatus], photoLabel[s.photoStatus],
    s.isPartialSuccess ? '是' : '否', s.failureReason ?? '', s.partialSuccessReason ?? '',
    s.manualCorrection?.correctionNote ?? '',
  ]);

  if (options.format === 'csv') {
    let csv = header.map(escapeCSV).join(',') + '\n';
    rows.forEach((r) => { csv += r.map(escapeCSV).join(',') + '\n'; });
    if (options.includeNotes) {
      csv += '\n--- 备注历史 ---\n';
      csv += ['排程编号', '时间', '作者', '是否修订', '原承诺', '内容'].map(escapeCSV).join(',') + '\n';
      schedules.forEach((s) => {
        s.notes.forEach((n) => {
          csv += [s.id, n.timestamp, n.author, n.isRevision ? '是' : '否', n.originalPromise ?? '', n.content]
            .map(escapeCSV).join(',') + '\n';
        });
      });
    }
    if (options.includeAudit) {
      csv += '\n--- 审计日志 ---\n';
      csv += ['排程编号', '时间', '操作人', '动作', '详情', '旧值', '新值'].map(escapeCSV).join(',') + '\n';
      schedules.forEach((s) => {
        s.auditLogs.forEach((a) => {
          csv += [s.id, a.timestamp, a.operator, a.action, a.details, a.oldValue ?? '', a.newValue ?? '']
            .map(escapeCSV).join(',') + '\n';
        });
      });
    }
    csv += '\n--- 汇总统计 ---\n' + Object.entries(stats).map(([k, v]) => `${k},${v}`).join('\n');
    return csv;
  }

  let md = `# 婴幼儿接送授权排程板 · 试听顾问版报告\n\n`;
  md += `> 导出时间：${new Date().toLocaleString('zh-CN')}  操作员：${operator}\n\n`;
  md += `## 汇总统计\n\n`;
  md += `| 指标 | 数量 |\n|---|---|\n`;
  md += `| 排程总数 | ${stats.total} |\n`;
  md += `| 已确认 | ${stats.confirmed} |\n`;
  md += `| 进行中 | ${stats.inProgress} |\n`;
  md += `| 已完成 | ${stats.completed} |\n`;
  md += `| 失败 | ${stats.failed} |\n`;
  md += `| 部分成功 | ${stats.partialSuccess} |\n`;
  md += `| 身份待核验 | ${stats.pendingIdentity} |\n`;
  md += `| 材料不完整 | ${stats.missingMaterial} |\n`;
  md += `| 照片异常 | ${stats.missingPhoto} |\n`;
  md += `| 人工更正 | ${stats.manuallyCorrected} |\n\n`;
  md += `## 排程明细\n\n`;
  md += `| ${header.join(' | ')} |\n`;
  md += `|${header.map(() => '---').join('|')}|\n`;
  rows.forEach((r) => { md += `| ${r.map((v) => v || '—').join(' | ')} |\n`; });
  if (options.includeNotes) {
    md += `\n## 备注历史（原承诺保留不可抹除）\n\n`;
    schedules.forEach((s) => {
      if (s.notes.length === 0) return;
      md += `### ${s.id} · ${s.childName}（${s.childNickname}）\n\n`;
      s.notes.forEach((n) => {
        md += `- **${n.timestamp.replace('T', ' ').slice(0, 19)}** · ${n.author}${n.isRevision ? ' · ✏️ 修订' : ''}\n`;
        md += `  - 内容：${n.content}\n`;
        if (n.originalPromise) md += `  - ⛓️ 原承诺：${n.originalPromise}\n`;
        md += `\n`;
      });
    });
  }
  if (options.includeAudit) {
    md += `\n## 审计日志（异常与更正全部可追溯）\n\n`;
    schedules.forEach((s) => {
      md += `### ${s.id} · ${s.childName}（${s.childNickname}）\n\n`;
      md += `| 时间 | 操作人 | 动作 | 详情 | 旧值 → 新值 |\n|---|---|---|---|---|\n`;
      s.auditLogs.slice().sort((a, b) => a.timestamp.localeCompare(b.timestamp)).forEach((a) => {
        md += `| ${a.timestamp.replace('T', ' ').slice(0, 19)} | ${a.operator} | ${a.action} | ${a.details} | ${a.oldValue ?? '—'} → ${a.newValue ?? '—'} |\n`;
      });
      md += `\n`;
    });
  }
  md += `\n---\n\n## 失败与人工更正路径（主管复盘用）\n\n`;
  const failed = schedules.filter((s) => s.status === 'failed');
  const corrected = schedules.filter((s) => s.status === 'manually_corrected');
  md += `### 失败路径（共 ${failed.length} 条）\n\n`;
  if (failed.length === 0) md += `> 暂无失败排程\n\n`;
  failed.forEach((s) => {
    md += `1. **${s.id} · ${s.childName}（${s.childNickname}）**\n`;
    md += `   - 失败原因：${s.failureReason ?? '未记录'}\n`;
    md += `   - 最后操作时间：${s.auditLogs[s.auditLogs.length - 1]?.timestamp.replace('T', ' ').slice(0, 19)}\n\n`;
  });
  md += `### 人工更正路径（共 ${corrected.length} 条）\n\n`;
  if (corrected.length === 0) md += `> 暂无更正排程\n\n`;
  corrected.forEach((s) => {
    md += `1. **${s.id} · ${s.childName}（${s.childNickname}）**\n`;
    md += `   - 更正人：${s.manualCorrection?.correctedBy}\n`;
    md += `   - 更正时间：${s.manualCorrection?.correctedAt.replace('T', ' ').slice(0, 19)}\n`;
    md += `   - 原状态：${statusLabel[s.manualCorrection?.originalStatus ?? s.status]}\n`;
    md += `   - 更正说明：${s.manualCorrection?.correctionNote}\n\n`;
  });
  return md;
}

export default function ExportPanel() {
  const allSchedules = useScheduleStore((s) => s.schedules);
  const searchKeyword = useScheduleStore((s) => s.searchKeyword);
  const statusFilter = useScheduleStore((s) => s.statusFilter);
  const operator = useScheduleStore((s) => s.operator);

  const filtered = useMemo(
    () => computeFiltered(allSchedules, searchKeyword, statusFilter),
    [allSchedules, searchKeyword, statusFilter]
  );
  const stats = useMemo(() => computeStats(allSchedules), [allSchedules]);

  const [show, setShow] = useState(false);
  const [format, setFormat] = useState<'csv' | 'markdown'>('markdown');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeAudit, setIncludeAudit] = useState(true);
  const [preview, setPreview] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const options: ExportOptions = { format, includeAudit, includeNotes };

  const refresh = () => {
    setPreview(buildReport(filtered, stats, operator, options));
  };

  useEffect(() => {
    if (show) refresh();
  }, [show, format, includeNotes, includeAudit, filtered.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = () => {
    setShow(true);
  };

  const download = () => {
    const content = buildReport(filtered, stats, operator, options);
    const ext = format === 'csv' ? 'csv' : 'md';
    const mime = format === 'csv' ? 'text/csv;charset=utf-8' : 'text/markdown;charset=utf-8';
    const blob = new Blob(['\uFEFF' + content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0, 10);
    a.download = `接送授权排程板-试听顾问版-${ts}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <button
        onClick={open}
        className="group inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/20"
      >
        <Download className="h-3.5 w-3.5" />
        导出报告
        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">
          {filtered.length} 条
        </span>
      </button>

      {show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
          onClick={() => setShow(false)}
        >
          <div
            className="flex h-[88vh] w-full max-w-5xl flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#141827] to-[#0d101c] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/5 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">导出报告 · 与页面摘要、详情状态对齐</h3>
                </div>
                <p className="mt-0.5 text-[11px] text-white/40">
                  操作员：{operator} · 当前筛选 {filtered.length} 条 · 汇总统计：共 {stats.total}，
                  失败 {stats.failed}，部分成功 {stats.partialSuccess}，人工更正 {stats.manuallyCorrected}
                </p>
              </div>
              <button
                onClick={() => setShow(false)}
                className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b border-white/5 p-3 text-[12px]">
              <span className="text-white/50">格式：</span>
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
                <button
                  onClick={() => {
                    setFormat('markdown');
                    setTimeout(refresh, 0);
                  }}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                    format === 'markdown'
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <FileText className="h-3 w-3" /> Markdown
                </button>
                <button
                  onClick={() => {
                    setFormat('csv');
                    setTimeout(refresh, 0);
                  }}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                    format === 'csv'
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <FileSpreadsheet className="h-3 w-3" /> CSV
                </button>
              </div>

              <span className="mx-1 h-4 w-px bg-white/10" />

              <label className="inline-flex cursor-pointer items-center gap-1.5 text-white/70">
                {includeNotes ? (
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-300" onClick={() => setIncludeNotes(false)} />
                ) : (
                  <Square className="h-3.5 w-3.5 text-white/40" onClick={() => setIncludeNotes(true)} />
                )}
                包含备注历史（含原承诺）
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-white/70">
                {includeAudit ? (
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-300" onClick={() => setIncludeAudit(false)} />
                ) : (
                  <Square className="h-3.5 w-3.5 text-white/40" onClick={() => setIncludeAudit(true)} />
                )}
                包含审计日志（异常追溯）
              </label>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={refresh}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70 hover:bg-white/10"
                >
                  刷新预览
                </button>
                <button
                  onClick={copyAll}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70 hover:bg-white/10"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                  {copied ? '已复制' : '复制'}
                </button>
                <button
                  onClick={download}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/25"
                >
                  <Download className="h-3 w-3" /> 下载文件
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <pre className="h-full overflow-auto rounded-xl border border-white/5 bg-[#0a0d17] p-4 font-mono text-[11px] leading-relaxed text-white/80 whitespace-pre-wrap">
                {preview}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
