import type { BracketRecord, ProblemRecord, ManualAngleRecord, FilterParams } from '@/types';
import { ERROR_TYPE_LABELS, STATUS_LABELS } from '@/types';

const escapeCSV = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportToCSV = (
  normalRecords: BracketRecord[],
  problemRecords: ProblemRecord[],
  manualRecords: ManualAngleRecord[],
  filename: string
): void => {
  const normalHeaders = [
    '支架编号', '安装日期', '位置', '当前角度', '目标角度',
    '处理人', '处理日期', '状态', '版本', '备注'
  ];

  const problemHeaders = [
    ...normalHeaders, '错误类型', '错误详情', '是否已解决', '解决备注'
  ];

  const manualHeaders = [
    '支架编号', '原始角度', '补录角度', '差值', '操作人', '操作日期', '补录原因', '版本'
  ];

  let csvContent = '';

  if (normalRecords.length > 0) {
    csvContent += '=== 正常记录 ===\n';
    csvContent += normalHeaders.join(',') + '\n';
    normalRecords.forEach(r => {
      csvContent += [
        r.bracketNo, r.installDate, r.location, r.currentAngle, r.targetAngle,
        r.handler, r.processDate, STATUS_LABELS[r.status], r.version, r.remark
      ].map(escapeCSV).join(',') + '\n';
    });
    csvContent += '\n';
  }

  if (problemRecords.length > 0) {
    csvContent += '=== 问题记录 ===\n';
    csvContent += problemHeaders.join(',') + '\n';
    problemRecords.forEach(r => {
      csvContent += [
        r.bracketNo, r.installDate, r.location, r.currentAngle, r.targetAngle,
        r.handler, r.processDate, STATUS_LABELS[r.status], r.version, r.remark,
        ERROR_TYPE_LABELS[r.errorType], r.errorDetail, r.isResolved ? '是' : '否', r.resolveNote
      ].map(escapeCSV).join(',') + '\n';
    });
    csvContent += '\n';
  }

  if (manualRecords.length > 0) {
    csvContent += '=== 手工补录记录 ===\n';
    csvContent += manualHeaders.join(',') + '\n';
    manualRecords.forEach(r => {
      csvContent += [
        r.bracketNo, r.originalAngle, r.correctedAngle, r.difference,
        r.operator, r.operateDate, r.reason, r.version
      ].map(escapeCSV).join(',') + '\n';
    });
  }

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToMarkdown = (
  normalRecords: BracketRecord[],
  problemRecords: ProblemRecord[],
  manualRecords: ManualAngleRecord[],
  filterParams: FilterParams,
  filename: string
): void => {
  let mdContent = `# 能源跟踪支架对账报告\n\n`;
  mdContent += `> 生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  if (filterParams.bracketId || filterParams.status || filterParams.dateFrom || filterParams.dateTo || filterParams.handler) {
    mdContent += `## 筛选条件\n\n`;
    if (filterParams.bracketId) mdContent += `- 支架编号: ${filterParams.bracketId}\n`;
    if (filterParams.status) mdContent += `- 状态: ${filterParams.status}\n`;
    if (filterParams.dateFrom) mdContent += `- 起始日期: ${filterParams.dateFrom}\n`;
    if (filterParams.dateTo) mdContent += `- 结束日期: ${filterParams.dateTo}\n`;
    if (filterParams.handler) mdContent += `- 处理人: ${filterParams.handler}\n`;
    mdContent += '\n';
  }

  const traceUrl = generateTraceableURL(filterParams);
  mdContent += `> [🔗 追溯链接](${traceUrl}) - 点击返回当前筛选条件核对状态\n\n`;

  if (normalRecords.length > 0) {
    mdContent += `## 正常记录 (${normalRecords.length}条)\n\n`;
    mdContent += `| 支架编号 | 安装日期 | 位置 | 当前角度 | 目标角度 | 处理人 | 处理日期 | 状态 | 版本 | 备注 |\n`;
    mdContent += `|----------|----------|------|----------|----------|--------|----------|------|------|------|\n`;
    normalRecords.forEach(r => {
      mdContent += `| ${r.bracketNo} | ${r.installDate} | ${r.location} | ${r.currentAngle}° | ${r.targetAngle}° | ${r.handler} | ${r.processDate} | ${STATUS_LABELS[r.status]} | ${r.version} | ${r.remark} |\n`;
    });
    mdContent += '\n';
  }

  if (problemRecords.length > 0) {
    mdContent += `## 问题记录 (${problemRecords.length}条)\n\n`;
    mdContent += `| 支架编号 | 安装日期 | 位置 | 当前角度 | 目标角度 | 处理人 | 处理日期 | 状态 | 版本 | 错误类型 | 错误详情 | 是否已解决 |\n`;
    mdContent += `|----------|----------|------|----------|----------|--------|----------|------|------|----------|----------|------------|\n`;
    problemRecords.forEach(r => {
      mdContent += `| ${r.bracketNo} | ${r.installDate} | ${r.location} | ${r.currentAngle}° | ${r.targetAngle}° | ${r.handler} | ${r.processDate} | ${STATUS_LABELS[r.status]} | ${r.version} | ${ERROR_TYPE_LABELS[r.errorType]} | ${r.errorDetail} | ${r.isResolved ? '✅ 是' : '❌ 否'} |\n`;
    });
    mdContent += '\n';
  }

  if (manualRecords.length > 0) {
    mdContent += `## 手工补录记录 (${manualRecords.length}条)\n\n`;
    mdContent += `| 支架编号 | 原始角度 | 补录角度 | 差值 | 操作人 | 操作日期 | 补录原因 | 版本 |\n`;
    mdContent += `|----------|----------|----------|------|--------|----------|----------|------|\n`;
    manualRecords.forEach(r => {
      const diffClass = r.difference > 0 ? `+${r.difference}` : r.difference;
      mdContent += `| ${r.bracketNo} | ${r.originalAngle}° | ${r.correctedAngle}° | **${diffClass}°** | ${r.operator} | ${r.operateDate} | ${r.reason} | ${r.version} |\n`;
    });
    mdContent += '\n';
  }

  mdContent += `---\n\n`;
  mdContent += `*此报告由能源跟踪支架对账系统自动生成*\n`;

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.md`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateTraceableURL = (filterParams: FilterParams, recordId?: string): string => {
  const params = new URLSearchParams();

  if (filterParams.bracketId) params.set('bracketId', filterParams.bracketId);
  if (filterParams.status) params.set('status', filterParams.status);
  if (filterParams.dateFrom) params.set('dateFrom', filterParams.dateFrom);
  if (filterParams.dateTo) params.set('dateTo', filterParams.dateTo);
  if (filterParams.handler) params.set('handler', filterParams.handler);
  if (filterParams.sortBy) params.set('sortBy', filterParams.sortBy);
  if (filterParams.sortOrder) params.set('sortOrder', filterParams.sortOrder);
  if (recordId) params.set('highlight', recordId);

  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?${params.toString()}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
