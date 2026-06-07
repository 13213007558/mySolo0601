import * as XLSX from 'xlsx';
import { db } from '@/db';
import { RescheduleRecord, STATUS_LABELS, ANOMALY_LABELS } from '@/types';

const EXPORT_FIELD_LABELS: Record<keyof RescheduleRecord, string> = {
  id: '记录ID',
  babyName: '宝宝姓名',
  babyId: '宝宝ID',
  originalShift: '原班次',
  originalDate: '原日期',
  targetShift: '目标班次',
  targetDate: '目标日期',
  reason: '换班原因',
  sourceFileName: '来源文件名',
  sourceUploadedAt: '上传时间',
  handlerId: '负责人ID',
  handlerName: '负责人',
  status: '状态',
  latestNote: '最新备注',
  latestNoteAt: '备注时间',
  latestNoteBy: '备注人',
  anomaly: '异常详情',
  isIsolated: '是否隔离',
  createdAt: '创建时间',
  updatedAt: '更新时间',
};

const DEFAULT_FIELDS: Array<keyof RescheduleRecord> = [
  'babyName',
  'babyId',
  'originalShift',
  'originalDate',
  'targetShift',
  'targetDate',
  'reason',
  'handlerName',
  'status',
  'latestNote',
  'createdAt',
];

function formatRecordForExport(
  record: RescheduleRecord,
  fields: Array<keyof RescheduleRecord>
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of fields) {
    const value = record[field];
    const label = EXPORT_FIELD_LABELS[field] || field;
    if (field === 'status') {
      row[label] = STATUS_LABELS[record.status] || record.status;
    } else if (field === 'anomaly') {
      row[label] = record.anomaly
        ? `${ANOMALY_LABELS[record.anomaly.type] || record.anomaly.type}: ${record.anomaly.message}`
        : '';
    } else if (field === 'isIsolated') {
      row[label] = record.isIsolated ? '是' : '否';
    } else {
      row[label] = value ?? '';
    }
  }
  return row;
}

export const ExportService = {
  async exportToExcel(
    records: RescheduleRecord[],
    fields?: string[]
  ): Promise<Blob> {
    const exportFields = (fields as Array<keyof RescheduleRecord> | undefined) || DEFAULT_FIELDS;
    const rows = records.map((r) => formatRecordForExport(r, exportFields));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '换班记录');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },

  async exportToCSV(
    records: RescheduleRecord[],
    fields?: string[]
  ): Promise<Blob> {
    const exportFields = (fields as Array<keyof RescheduleRecord> | undefined) || DEFAULT_FIELDS;
    const rows = records.map((r) => formatRecordForExport(r, exportFields));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const bom = '\uFEFF';
    return new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  },

  async logExport(
    operatorId: string,
    operatorName: string,
    recordCount: number,
    filters?: string
  ): Promise<void> {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.audit_logs.add({
      id,
      recordId: `export-${Date.now()}`,
      action: 'export',
      operatorId,
      operatorName,
      note: filters
        ? `导出${recordCount}条记录，筛选条件：${filters}`
        : `导出${recordCount}条记录`,
      createdAt: new Date().toISOString(),
    });
  },

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
