import type { TrackRecord } from '@/types';
import { maskPhone, maskName } from './validationEngine';

const statusLabel: Record<TrackRecord['status'], string> = {
  normal: '✅ 合规通过',
  abnormal: '⚠️ 存在禁忌风险',
  manual_overridden: '📝 人工改判通过',
  pending: '⏳ 待审核',
};

const riskLabel: Record<string, string> = {
  高: '🔴 高风险',
  中: '🟠 中风险',
  低: '🟡 低风险',
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

export function buildSummaryText(record: TrackRecord): string {
  const lines: string[] = [];
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`  婴幼儿辅食禁忌追踪台 · 膳食核查摘要`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`【基本信息】`);
  lines.push(`  房间号：${record.roomNo} 房`);
  lines.push(`  宝宝：${maskName(record.babyNameRaw)}（已脱敏）`);
  lines.push(`  联系电话：${maskPhone(record.motherPhone)}`);
  lines.push(`  餐次：${record.mealDate} ${record.mealType}`);
  lines.push(`  核查结果：${statusLabel[record.status]}`);
  if (record.isManualEntry) {
    lines.push(`  备注：本记录为手工补录`);
  }
  lines.push('');

  lines.push(`【食材清单】`);
  const ingLines = record.ingredients.map(
    (i) =>
      `  · ${i.name}（${i.category}）${
        i.isForbidden ? '  ⚠️ 系统初判为禁忌食材' : ''
      }`
  );
  lines.push(ingLines.length ? ingLines.join('\n') : '  （无）');
  lines.push('');

  if (record.taboosMatched.length > 0) {
    lines.push(`【禁忌命中提醒】`);
    record.taboosMatched.forEach((t) => {
      lines.push(`  ${riskLabel[t.riskLevel]} ${t.tabooName}`);
      lines.push(`    涉及食材：${t.ingredientName}`);
      lines.push(`    说明：${t.description}`);
    });
    lines.push('');
  }

  if (record.validationIssues.length > 0) {
    lines.push(`【数据校验提醒】`);
    record.validationIssues.forEach((v) => {
      lines.push(`  ${v.severity === 'error' ? '🔴' : '🟡'} ${v.humanReadable}`);
    });
    lines.push('');
  }

  if (record.status === 'manual_overridden' && record.overrideReason) {
    lines.push(`【人工改判理由】`);
    lines.push(`  ${record.overrideReason}`);
    lines.push('');
  }

  if (record.rectificationLogs.length > 0) {
    lines.push(`【操作时间线】`);
    record.rectificationLogs.forEach((log) => {
      lines.push(`  · ${formatTime(log.timestamp)}  ${log.operator} → ${log.note}`);
    });
    lines.push('');
  }

  if (record.supplementDiffs && record.supplementDiffs.length > 0) {
    lines.push(`【补录差异对照】`);
    record.supplementDiffs.forEach((d) => {
      lines.push(`  · ${d.field}：「${d.before}」 → 「${d.after}」`);
    });
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`  导出时间：${formatTime(new Date().toISOString())}`);
  lines.push(`  来源：婴幼儿辅食禁忌追踪台（月子护理版）`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}

export function downloadSummaryAsText(record: TrackRecord) {
  const text = buildSummaryText(record);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `膳食核查摘要_${record.roomNo}房_${record.mealDate}_${record.mealType}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copySummaryToClipboard(record: TrackRecord): Promise<boolean> {
  const text = buildSummaryText(record);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}
