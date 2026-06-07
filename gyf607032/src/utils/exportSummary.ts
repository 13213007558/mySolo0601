import type { FoodRecord } from '@/types';
import { STATUS_LABEL } from '@/types';

export function formatDate(d: string): string {
  return d;
}

export function generateReadableSummary(record: FoodRecord): string {
  const lines: string[] = [];

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('      婴幼儿三日辅食安排 · 顾问摘要');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`【档案编号】${record.id}`);
  lines.push(`【宝宝姓名】${record.babyName || '（未填写）'}`);
  lines.push(`【宝宝月龄】${record.babyAgeMonths > 0 ? record.babyAgeMonths + ' 个月' : '（未填写）'}`);
  lines.push(`【过敏史】${record.allergies.length ? record.allergies.join('、') : '无'}`);
  lines.push('');
  lines.push(`【家长姓名】${record.parentName || '（未填写）'}`);
  lines.push(`【联系电话】${record.parentPhone || '（未填写）'}`);
  lines.push(`【负责顾问】${record.consultant}`);
  lines.push(`【试听课程】${record.trialCourse || '（未填写）'}`);
  lines.push(`【预约编号】${record.appointmentId || '（未填写）'}`);
  lines.push(`【当前状态】${STATUS_LABEL[record.status]}`);

  if (record.isManualEntry) {
    lines.push('【数据来源】手工补录');
  }

  lines.push('');

  if (record.originalPromise) {
    lines.push('【最初承诺】' + record.originalPromise);
    lines.push('');
  }

  lines.push('───────────────────────────────────────');
  lines.push('                三日食材安排');
  lines.push('───────────────────────────────────────');
  lines.push('');

  record.threeDayPlan.forEach((day) => {
    lines.push(`◈ ${day.date}`);
    lines.push(`  早餐：${day.breakfast.name}（${day.breakfast.ingredients.join('、') || '无'}）${day.breakfast.note ? '  备注：' + day.breakfast.note : ''}`);
    lines.push(`  午餐：${day.lunch.name}（${day.lunch.ingredients.join('、') || '无'}）${day.lunch.note ? '  备注：' + day.lunch.note : ''}`);
    lines.push(`  晚餐：${day.dinner.name}（${day.dinner.ingredients.join('、') || '无'}）${day.dinner.note ? '  备注：' + day.dinner.note : ''}`);
    lines.push(`  加餐：${day.snack.name || '无'}（${day.snack.ingredients.join('、') || '无'}）`);
    lines.push('');
  });

  if (record.detectedIssues && record.detectedIssues.length > 0) {
    lines.push('───────────────────────────────────────');
    lines.push('             ⚠ 巡检发现问题');
    lines.push('───────────────────────────────────────');
    lines.push('');
    record.detectedIssues.forEach((issue, i) => {
      lines.push(`  ${i + 1}. ${issue}`);
    });
    lines.push('');
  }

  if (record.conflictInfo) {
    lines.push('───────────────────────────────────────');
    lines.push('             ⚠ 预约冲突详情');
    lines.push('───────────────────────────────────────');
    lines.push('');
    lines.push(`  冲突预约：${record.conflictInfo.conflictingAppointmentId}`);
    lines.push(`  冲突课程：${record.conflictInfo.conflictingCourse}`);
    lines.push(`  冲突时段：${record.conflictInfo.conflictingTime}`);
    lines.push('');
  }

  if (record.withdrawInfo) {
    lines.push('───────────────────────────────────────');
    lines.push('             撤回确认原因');
    lines.push('───────────────────────────────────────');
    lines.push('');
    lines.push(`  撤回人：${record.withdrawInfo.withdrawOperator}`);
    lines.push(`  撤回时间：${record.withdrawInfo.withdrawTime}`);
    lines.push(`  撤回原因：${record.withdrawInfo.withdrawReason}`);
    lines.push('');
  }

  lines.push('───────────────────────────────────────');
  lines.push('             变更历史记录');
  lines.push('───────────────────────────────────────');
  lines.push('');

  const actionLabel: Record<string, string> = {
    status_change: '状态变更',
    note_add: '补充备注',
    withdraw: '撤回确认',
    conflict: '预约冲突',
    manual_create: '手工补录',
    override: '人工改判',
  };

  record.history.forEach((h, i) => {
    lines.push(`  ${i + 1}. [${h.timestamp}] ${h.operator} · ${actionLabel[h.action] || h.action}`);
    if (h.fromStatus && h.toStatus) {
      lines.push(`      ${STATUS_LABEL[h.fromStatus]}  →  ${STATUS_LABEL[h.toStatus]}`);
    }
    if (h.reason) lines.push(`      原因：${h.reason}`);
    if (h.parentNote) lines.push(`      家长原话：${h.parentNote}`);
    if (h.note && h.action === 'note_add') lines.push(`      顾问补充：${h.note}`);
    lines.push('');
  });

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`  生成时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push('  此摘要可直接转发给同事查阅');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}

export function downloadSummary(record: FoodRecord): void {
  const content = generateReadableSummary(record);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${record.babyName || '未命名'}_三日辅食安排_${record.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copySummaryToClipboard(record: FoodRecord): Promise<void> {
  const content = generateReadableSummary(record);
  return navigator.clipboard.writeText(content);
}
