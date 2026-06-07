import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  FileText,
  Baby,
  AlertTriangle,
  CheckCircle2,
  FilePlus,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { BabyRecord } from '@/types';
import { statusLabelMap } from '@/types';

function groupRecords(records: BabyRecord[]) {
  return {
    normal: records.filter(
      (r) => r.status === 'normal' || r.status === 'overridden_normal',
    ),
    abnormal: records.filter(
      (r) => r.status === 'abnormal' || r.status === 'overridden_abnormal' || r.status === 'pending',
    ),
    supplemented: records.filter((r) => r.isSupplemented),
  };
}

function buildSummaryText(records: BabyRecord[]): string {
  const { normal, abnormal, supplemented } = groupRecords(records);
  const now = new Date().toLocaleString('zh-CN', { hour12: false });

  const lines: string[] = [];
  lines.push('══════════════════════════════════════════');
  lines.push('  婴幼儿辅食禁忌 · 夜班交接摘要');
  lines.push(`  生成时间：${now}`);
  lines.push('══════════════════════════════════════════');
  lines.push('');
  lines.push(`【总体统计】`);
  lines.push(`  总记录：${records.length} 人`);
  lines.push(`  正常：${normal.length} 人`);
  lines.push(`  异常/待复核：${abnormal.length} 人`);
  lines.push(`  手工补录：${supplemented.length} 人`);
  lines.push('');

  if (abnormal.length > 0) {
    lines.push('═══════════ 异常 / 待复核 ═══════════');
    abnormal.forEach((r, i) => {
      lines.push('');
      lines.push(`${i + 1}. ${r.name}（${r.ageMonths} 月龄）`);
      lines.push(`   状态：${statusLabelMap[r.status]}`);
      lines.push(`   过敏史：${r.allergyHistory}`);
      const issues = r.validations.filter((v) => v.status !== 'pass');
      if (issues.length > 0) {
        lines.push(`   需关注（${issues.length} 项）：`);
        issues.forEach((v) => {
          lines.push(`     · ${v.ingredientName}：${v.reason}`);
          lines.push(`       ${v.detail}`);
        });
      }
      if (r.override) {
        lines.push(`   人工改判：${statusLabelMap[r.override.fromStatus]} → ${statusLabelMap[r.override.toStatus]}`);
        lines.push(`   改判人：${r.override.by}（${new Date(r.override.time).toLocaleString('zh-CN', { hour12: false })}）`);
        lines.push(`   改判原因：${r.override.reason}`);
      }
    });
    lines.push('');
  }

  if (normal.length > 0) {
    lines.push('═══════════════ 正常 ═══════════════');
    normal.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.name}（${r.ageMonths}月龄）— ${r.allergyHistory}`);
      if (r.override) {
        lines.push(`   （人工改判：${r.override.reason}）`);
      }
    });
    lines.push('');
  }

  if (supplemented.length > 0) {
    lines.push('═════════════ 手工补录 ═════════════');
    supplemented.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.name}（${r.ageMonths}月龄）`);
      lines.push(`   补录人：${r.supplementedBy} · ${r.supplementTime ? new Date(r.supplementTime).toLocaleString('zh-CN', { hour12: false }) : ''}`);
      lines.push(`   补录原因：${r.supplementReason}`);
      lines.push(`   过敏史：${r.allergyHistory}`);
    });
    lines.push('');
  }

  lines.push('══════════════════════════════════════════');
  lines.push('夜班老师签字：______________');
  lines.push('白班老师签字：______________');
  lines.push('══════════════════════════════════════════');
  return lines.join('\n');
}

export default function ExportPage() {
  const navigate = useNavigate();
  const { records, activeDate } = useAppStore();
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => buildSummaryText(records), [records]);
  const groups = useMemo(() => groupRecords(records), [records]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败', e);
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `婴幼儿辅食禁忌夜班交接-${activeDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink-dark flex items-center gap-2">
              <FileText size={24} className="text-ink" />
              交接摘要预览
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              可直接复制或下载，转发给白班老师和厨房同事
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyToClipboard} className="btn-warm flex items-center gap-1.5">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '已复制' : '一键复制'}
            </button>
            <button onClick={downloadTxt} className="btn-primary flex items-center gap-1.5">
              <Download size={14} />
              下载 TXT
            </button>
          </div>
        </div>

        <div className="bg-cream/30 border border-cream-dark rounded-2xl p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap text-ink-dark shadow-inner">
          {summary}
        </div>
      </div>

      <div className="space-y-5 animate-fade-in">
        {groups.abnormal.length > 0 && (
          <div className="info-card border-l-4 border-status-abnormal">
            <h2 className="section-title mb-4 flex items-center gap-2" style={{ borderColor: '#C25B56' }}>
              <AlertTriangle size={18} className="text-status-abnormal" />
              异常 / 待复核（{groups.abnormal.length}）
            </h2>
            <div className="space-y-3">
              {groups.abnormal.map((r) => (
                <div key={r.id} className="bg-status-abnormal/5 border border-status-abnormal/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Baby size={16} className="text-status-abnormal" />
                    <p className="font-medium text-ink-dark">{r.name}</p>
                    <span className="text-xs text-gray-500">{r.ageMonths}月龄</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-status-abnormal/10 text-status-abnormal ml-auto">
                      {statusLabelMap[r.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">过敏史：{r.allergyHistory}</p>
                  {r.validations
                    .filter((v) => v.status !== 'pass')
                    .map((v) => (
                      <div key={v.id} className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 mb-1">
                        <span className="font-medium text-status-abnormal">⚠ {v.ingredientName}：</span>
                        {v.reason}
                        <br />
                        <span className="text-gray-400">{v.detail}</span>
                      </div>
                    ))}
                  {r.override && (
                    <p className="text-xs text-warm-dark mt-2 bg-warm/10 rounded-lg px-3 py-2">
                      ✎ 人工改判：{statusLabelMap[r.override.fromStatus]} → {statusLabelMap[r.override.toStatus]}
                      （{r.override.by}）— {r.override.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {groups.normal.length > 0 && (
          <div className="info-card border-l-4 border-status-normal">
            <h2 className="section-title mb-4 flex items-center gap-2" style={{ borderColor: '#3A7D5C' }}>
              <CheckCircle2 size={18} className="text-status-normal" />
              正常（{groups.normal.length}）
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.normal.map((r) => (
                <div
                  key={r.id}
                  className="bg-status-normal/5 border border-status-normal/10 rounded-xl px-4 py-3 flex items-center gap-2"
                >
                  <Baby size={16} className="text-status-normal shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-dark text-sm truncate">{r.name}</p>
                    <p className="text-xs text-gray-500 truncate">{r.allergyHistory}</p>
                  </div>
                  {r.override && (
                    <span className="text-warm-dark text-[10px] px-1.5 py-0.5 rounded bg-warm/10">已改判</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {groups.supplemented.length > 0 && (
          <div className="info-card border-l-4 border-status-supplemented">
            <h2 className="section-title mb-4 flex items-center gap-2" style={{ borderColor: '#4A6FA5' }}>
              <FilePlus size={18} className="text-status-supplemented" />
              手工补录（{groups.supplemented.length}）
            </h2>
            <div className="space-y-3">
              {groups.supplemented.map((r) => (
                <div
                  key={r.id}
                  className="bg-status-supplemented/5 border border-status-supplemented/10 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Baby size={16} className="text-status-supplemented" />
                    <p className="font-medium text-ink-dark">{r.name}</p>
                    <span className="text-xs text-gray-500">{r.ageMonths}月龄</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    补录人：{r.supplementedBy} · 原因：{r.supplementReason}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">过敏史：{r.allergyHistory}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
