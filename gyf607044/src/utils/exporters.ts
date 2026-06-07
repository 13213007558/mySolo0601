import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { ExportLog, RescheduleRecord } from '@/types';
import { SOURCE_LABEL, STATUS_LABEL } from '@/types';
import { formatDateTime, uid, nowIso } from './helpers';
import { loadExportLogsFromLS, saveExportLogsToLS } from './storage';

function flatForExport(r: RescheduleRecord) {
  return {
    编号: r.id.slice(0, 10),
    宝宝姓名: r.babyName,
    课程: r.courseName,
    原上课时间: formatDateTime(r.originalTime),
    期望改期时间: formatDateTime(r.expectedTime),
    改期原因: r.reason,
    来源文件: r.sourceFile || '-',
    来源类型: SOURCE_LABEL[r.sourceType],
    提交人: r.submitter,
    处理人: r.handler || '-',
    当前状态: STATUS_LABEL[r.currentStatus],
    最近说明: r.latestNote || '-',
    提交时间: formatDateTime(r.createdAt),
    最近更新: formatDateTime(r.updatedAt),
    是否异常: r.isCorrupted ? '是' : '否',
    异常原因: r.corruptionReason || '-',
  };
}

export function exportToExcel(
  records: RescheduleRecord[],
  operator: string
): void {
  const rows = records.map(flatForExport);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '课程改期交接本');
  const ts = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const name = `婴幼儿课程改期交接本-${ts.getFullYear()}${pad(
    ts.getMonth() + 1
  )}${pad(ts.getDate())}.xlsx`;
  XLSX.writeFile(wb, name);
  appendExportLog({
    operator,
    filters: { count: records.length },
    format: 'xlsx',
    count: records.length,
  });
}

export function exportToPDF(
  records: RescheduleRecord[],
  operator: string
): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text('婴幼儿课程改期交接本月子护理版', 40, 50);
  doc.setFontSize(10);
  doc.text(`导出时间: ${formatDateTime(nowIso())}  操作人: ${operator}`, 40, 72);

  const headers = [
    '编号',
    '宝宝',
    '课程',
    '原时间',
    '期望时间',
    '提交人',
    '处理人',
    '状态',
    '来源',
  ];
  const colX = [40, 95, 150, 220, 310, 400, 455, 510, 570];
  const startY = 100;
  const rowH = 22;

  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, colX[i], startY));
  doc.setFont('helvetica', 'normal');

  records.slice(0, 18).forEach((r, idx) => {
    const y = startY + rowH * (idx + 1);
    const row = [
      r.id.slice(0, 8),
      r.babyName,
      r.courseName,
      formatDateTime(r.originalTime).slice(5),
      formatDateTime(r.expectedTime).slice(5),
      r.submitter,
      r.handler || '-',
      STATUS_LABEL[r.currentStatus],
      SOURCE_LABEL[r.sourceType],
    ];
    row.forEach((txt, i) => doc.text(String(txt).slice(0, 14), colX[i], y));
  });
  if (records.length > 18) {
    doc.text(`...（共 ${records.length} 条，完整内容请导出 Excel）`, 40, startY + rowH * 20);
  }
  doc.save(`婴幼儿课程改期交接本-${Date.now()}.pdf`);
  appendExportLog({
    operator,
    filters: { count: records.length },
    format: 'pdf',
    count: records.length,
  });
}

export function appendExportLog(partial: Omit<ExportLog, 'id' | 'createdAt'>) {
  const logs = loadExportLogsFromLS<ExportLog>();
  logs.unshift({ ...partial, id: uid('el_'), createdAt: nowIso() });
  saveExportLogsToLS(logs.slice(0, 50));
}
