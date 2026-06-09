import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  MeterRecord,
  ProblemRecord,
  MultiplierConfig,
  ReviewSummary,
  OperatorName,
  ErrorType,
  ERROR_TYPE_LABELS,
} from '@/types';

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
}

function formatDateShort(date: Date): string {
  return format(date, 'MM-dd HH:mm', { locale: zhCN });
}

export function generateReviewSummary(
  normalRecords: MeterRecord[],
  problemRecords: ProblemRecord[],
  multipliers: MultiplierConfig[],
  operator: OperatorName
): ReviewSummary {
  const allRecords = [...normalRecords, ...problemRecords];
  const pendingRecords = problemRecords.filter((r) => r.status === 'pending');

  const errorBreakdown = problemRecords.reduce((acc, record) => {
    acc[record.errorType] = (acc[record.errorType] || 0) + 1;
    return acc;
  }, {} as Record<ErrorType, number>);

  const dateRange = allRecords.length > 0
    ? {
        start: new Date(Math.min(...allRecords.map((r) => r.readingTime.getTime()))),
        end: new Date(Math.max(...allRecords.map((r) => r.readingTime.getTime()))),
      }
    : { start: new Date(), end: new Date() };

  const zhouMultipliers = multipliers.filter((m) => m.enteredBy === 'zhou');

  const totalReadingBefore = normalRecords.reduce((sum, r) => sum + r.reading, 0);
  const totalReadingAfter = normalRecords.reduce((sum, r) => sum + r.calculatedValue, 0);
  const differencePercentage = totalReadingBefore > 0
    ? ((totalReadingAfter - totalReadingBefore) / totalReadingBefore) * 100
    : 0;

  return {
    generatedAt: new Date(),
    operator,
    dateRange,
    statistics: {
      totalRecords: allRecords.length,
      normalRecords: normalRecords.length,
      problemRecords: problemRecords.length,
      pendingRecords: pendingRecords.length,
    },
    errorBreakdown: {
      format_error: 0,
      invalid_reading: 0,
      invalid_time: 0,
      missing_multiplier: 0,
      late_supplement: 0,
      ...errorBreakdown,
    },
    pendingItems: pendingRecords,
    multiplierChanges: zhouMultipliers,
    multiplierDifference: {
      before: totalReadingBefore,
      after: totalReadingAfter,
      percentage: differencePercentage,
    },
  };
}

export function generateMarkdownReport(summary: ReviewSummary): string {
  const { statistics, errorBreakdown, pendingItems, multiplierChanges, multiplierDifference } = summary;
  const total = statistics.totalRecords || 1;

  const errorTypes = Object.entries(errorBreakdown)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]) as [ErrorType, number][];

  let markdown = `# 青岚光伏二区电表复核摘要\n\n`;
  markdown += `**生成时间**：${formatDate(summary.generatedAt)}\n`;
  markdown += `**处理人**：${summary.operator}\n`;
  markdown += `**复核范围**：${formatDateShort(summary.dateRange.start)} ~ ${formatDateShort(summary.dateRange.end)}\n\n`;

  markdown += `## 一、数量统计\n\n`;
  markdown += `| 类别 | 数量 | 占比 |\n`;
  markdown += `|------|------|------|\n`;
  markdown += `| 总记录数 | ${formatNumber(statistics.totalRecords)} | 100% |\n`;
  markdown += `| ✅ 正常记录 | ${formatNumber(statistics.normalRecords)} | ${((statistics.normalRecords / total) * 100).toFixed(1)}% |\n`;
  markdown += `| ⚠️ 问题记录 | ${formatNumber(statistics.problemRecords)} | ${((statistics.problemRecords / total) * 100).toFixed(1)}% |\n`;
  markdown += `| 🔴 待拍板 | ${formatNumber(statistics.pendingRecords)} | ${((statistics.pendingRecords / total) * 100).toFixed(2)}% |\n\n`;

  markdown += `## 二、问题原因分类\n\n`;
  if (errorTypes.length > 0) {
    errorTypes.forEach(([type, count], index) => {
      const percentage = ((count / statistics.problemRecords) * 100).toFixed(1);
      const extra = type === 'late_supplement' ? ' - 详见待拍板' : '';
      markdown += `${index + 1}. **${ERROR_TYPE_LABELS[type]}**：${count}条（${percentage}%）${extra}\n`;
    });
  } else {
    markdown += `暂无问题记录\n`;
  }
  markdown += `\n`;

  markdown += `## 三、待拍板记录（需班组长决策）\n\n`;
  if (pendingItems.length > 0) {
    markdown += `| 电表编号 | 问题描述 | 上报时间 | 建议处理 |\n`;
    markdown += `|----------|----------|----------|----------|\n`;
    pendingItems.slice(0, 10).forEach((item) => {
      markdown += `| ${item.meterNo} | ${item.errorMessage} | ${formatDateShort(item.importedAt)} | 核实后${item.errorType === 'late_supplement' ? '补录' : '修正'} |\n`;
    });
    if (pendingItems.length > 10) {
      markdown += `| ... | 更多 ${pendingItems.length - 10} 条待处理记录 | ... | ... |\n`;
    }
  } else {
    markdown += `暂无待拍板记录\n`;
  }
  markdown += `\n`;

  markdown += `## 四、分表倍率变更说明\n\n`;
  if (multiplierChanges.length > 0) {
    const latestZhou = multiplierChanges[multiplierChanges.length - 1];
    markdown += `- 老周于${formatDateShort(latestZhou.createdAt)}手工更新${multiplierChanges.length}台电表倍率\n`;
    multiplierChanges.forEach((m) => {
      markdown += `  - ${m.meterNo}：倍率 ${m.multiplier}，${m.note}\n`;
    });
    markdown += `- 补录前后差异：总读数偏差 ${multiplierDifference.percentage >= 0 ? '+' : ''}${multiplierDifference.percentage.toFixed(2)}%（${Math.abs(multiplierDifference.percentage) <= 5 ? '在允许范围内' : '超出允许范围，请核实'}）\n`;
  } else {
    markdown += `- 暂无手工补录的倍率变更\n`;
  }
  markdown += `\n`;

  markdown += `---\n`;
  markdown += `*此摘要由能源园区电表复核台自动生成*\n`;

  return markdown;
}

export function exportSummaryToClipboard(summary: ReviewSummary): Promise<void> {
  const markdown = generateMarkdownReport(summary);
  return navigator.clipboard.writeText(markdown);
}

export function exportSummaryToFile(summary: ReviewSummary): void {
  const markdown = generateMarkdownReport(summary);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const fileName = `电表复核摘要_${format(summary.generatedAt, 'yyyyMMdd_HHmmss')}.md`;
  saveAs(blob, fileName);
}

export function exportFullDataToExcel(
  normalRecords: MeterRecord[],
  problemRecords: ProblemRecord[],
  multipliers: MultiplierConfig[]
): void {
  const normalData = normalRecords.map((r) => ({
    序号: r.rowIndex,
    电表编号: r.meterNo,
    电表读数: r.reading,
    抄表时间: formatDate(r.readingTime),
    倍率: r.multiplier,
    计算后数值: r.calculatedValue,
    数据来源: r.source === 'csv' ? 'CSV导入' : r.source === 'excel' ? 'Excel导入' : '手工录入',
    导入时间: formatDate(r.importedAt),
    操作人: r.operator,
  }));

  const problemData = problemRecords.map((r) => ({
    序号: r.rowIndex,
    电表编号: r.meterNo,
    电表读数: r.reading,
    抄表时间: formatDate(r.readingTime),
    倍率: r.multiplier,
    错误类型: ERROR_TYPE_LABELS[r.errorType],
    错误描述: r.errorMessage,
    状态: r.status === 'pending' ? '待处理' : r.status === 'reviewing' ? '复核中' : r.status === 'resolved' ? '已解决' : '已驳回',
    补录说明: r.supplementNote || '',
    数据来源: r.source === 'csv' ? 'CSV导入' : r.source === 'excel' ? 'Excel导入' : '手工录入',
    导入时间: formatDate(r.importedAt),
    操作人: r.operator,
  }));

  const multiplierData = multipliers.map((m) => ({
    电表编号: m.meterNo,
    倍率: m.multiplier,
    生效日期: formatDate(m.effectiveDate),
    失效日期: m.expiryDate ? formatDate(m.expiryDate) : '-',
    录入人: m.enteredBy === 'zhou' ? '老周（手工补录）' : '系统',
    说明: m.note,
    创建时间: formatDate(m.createdAt),
    版本: m.version,
  }));

  const wb = XLSX.utils.book_new();

  if (normalData.length > 0) {
    const ws1 = XLSX.utils.json_to_sheet(normalData);
    XLSX.utils.book_append_sheet(wb, ws1, '正常记录');
  }

  if (problemData.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(problemData);
    XLSX.utils.book_append_sheet(wb, ws2, '问题记录');
  }

  if (multiplierData.length > 0) {
    const ws3 = XLSX.utils.json_to_sheet(multiplierData);
    XLSX.utils.book_append_sheet(wb, ws3, '倍率说明');
  }

  const checksum = btoa(JSON.stringify({ normalRecords, problemRecords, multipliers, timestamp: Date.now() }));
  wb.Props = {
    Title: '青岚光伏二区电表复核数据',
    Subject: '电表数据复核',
    Author: '能源园区电表复核台',
    Comments: `校验和: ${checksum}`,
  };

  const fileName = `电表复核完整数据_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
