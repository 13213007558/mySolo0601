import type { AuthorizationRecord, HistoryChange, ExportConfig } from '@/types';
import { STATUS_LABEL, FIELD_LABELS } from '@/types';
import { desensitizeField, formatDateTime, downloadFile } from '@/utils';

function escapeCsv(value: string): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getFieldValue(rec: AuthorizationRecord, fieldKey: string, desensitize: boolean): string {
  if (fieldKey === 'status') {
    return STATUS_LABEL[rec.status] || rec.status;
  }
  if (fieldKey === 'isSupplemented') {
    return rec.isSupplemented ? '是' : '否';
  }
  if (fieldKey === 'reviewTime' || fieldKey === 'createdAt' || fieldKey === 'updatedAt') {
    return rec[fieldKey] ? formatDateTime(rec[fieldKey]) : '';
  }
  const raw = String(rec[fieldKey as keyof AuthorizationRecord] ?? '');
  if (desensitize) {
    return desensitizeField(fieldKey, raw);
  }
  return raw;
}

export function exportToCsv(
  records: AuthorizationRecord[],
  history: HistoryChange[],
  config: ExportConfig,
): string {
  const header = config.fields.map((f) => FIELD_LABELS[f] || f);
  const rows = records.map((rec) =>
    config.fields.map((f) => escapeCsv(getFieldValue(rec, f, config.desensitizePrivate))).join(','),
  );

  let csv = '\uFEFF' + header.join(',') + '\n' + rows.join('\n');

  if (config.includeHistory && history.length > 0) {
    csv += '\n\n--- 历史变更记录 ---\n';
    csv += '记录ID,字段名,旧值,新值,处理人,变更原因,变更时间\n';
    for (const h of history) {
      const oldV = config.desensitizePrivate ? desensitizeField(h.fieldName, h.oldValue) : h.oldValue;
      const newV = config.desensitizePrivate ? desensitizeField(h.fieldName, h.newValue) : h.newValue;
      csv += [
        escapeCsv(h.recordId),
        escapeCsv(h.fieldLabel),
        escapeCsv(oldV),
        escapeCsv(newV),
        escapeCsv(h.changedByName),
        escapeCsv(h.changeReason),
        escapeCsv(h.changedAt),
      ].join(',') + '\n';
    }
  }
  return csv;
}

export function exportToMarkdown(
  records: AuthorizationRecord[],
  history: HistoryChange[],
  config: ExportConfig & { containsPrivateData?: boolean },
): string {
  const header = config.fields.map((f) => FIELD_LABELS[f] || f);
  const divider = config.fields.map(() => '---');
  const rows = records.map((rec) =>
    config.fields.map((f) => getFieldValue(rec, f, config.desensitizePrivate)).join(' | '),
  );

  let md = '# 婴幼儿接送授权复核报告\n\n';
  md += `> 导出时间：${formatDateTime(new Date())}\n\n`;
  md += `| ${header.join(' | ')} |\n`;
  md += `| ${divider.join(' | ')} |\n`;
  md += rows.map((r) => `| ${r} |`).join('\n') + '\n';

  if (config.includeHistory && history.length > 0) {
    md += '\n## 历史变更记录\n\n';
    md += '| 记录ID | 字段 | 旧值 | 新值 | 处理人 | 变更原因 | 变更时间 |\n';
    md += '| --- | --- | --- | --- | --- | --- | --- |\n';
    for (const h of history) {
      const oldV = config.desensitizePrivate ? desensitizeField(h.fieldName, h.oldValue) : h.oldValue;
      const newV = config.desensitizePrivate ? desensitizeField(h.fieldName, h.newValue) : h.newValue;
      md += `| ${h.recordId} | ${h.fieldLabel} | ${oldV} | ${newV} | ${h.changedByName} | ${h.changeReason} | ${h.changedAt} |\n`;
    }
  }

  if (config.containsPrivateData) {
    md += '\n---\n\n⚠️  **隐私数据标记**：本报告包含隐私字段数据，请妥善保管。\n';
    if (!config.desensitizePrivate) {
      md += '\n> 🔴 **审计提醒**：本次导出未进行脱敏处理，请确保符合数据安全规范。\n';
    }
  }

  return md;
}

export function performExport(
  records: AuthorizationRecord[],
  history: HistoryChange[],
  config: ExportConfig,
): void {
  const targetRecords = config.recordIds && config.recordIds.length > 0
    ? records.filter((r) => config.recordIds!.includes(r.id))
    : records;
  const targetHistory = config.recordIds && config.recordIds.length > 0
    ? history.filter((h) => config.recordIds!.includes(h.recordId))
    : history;

  const PRIVATE_FIELDS_LOCAL = ['babyIdCard', 'authorizerIdCard', 'emergencyContact', 'authorizerPhone'];
  const containsPrivateData = config.fields.some((f) => PRIVATE_FIELDS_LOCAL.includes(f));

  const timestamp = formatDateTime(new Date()).replace(/[:\s-]/g, '');
  if (config.format === 'csv') {
    const content = exportToCsv(targetRecords, targetHistory, config);
    downloadFile(content, `授权复核报告_${timestamp}.csv`, 'text/csv;charset=utf-8');
  } else {
    const content = exportToMarkdown(targetRecords, targetHistory, { ...config, containsPrivateData });
    downloadFile(content, `授权复核报告_${timestamp}.md`, 'text/markdown;charset=utf-8');
  }
}
