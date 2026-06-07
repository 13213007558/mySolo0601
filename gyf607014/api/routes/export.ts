import { Router, type Request, type Response } from 'express';
import { filterRecords, exportLogs, addExportLog, getStats } from '../store/index.js';
import type { RecordFilters } from '../../shared/types';

const router = Router();

function toCSV(rows: any[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
}

router.get('/', (req: Request, res: Response) => {
  const f: RecordFilters = {
    status: req.query.status as any,
    dataSource: req.query.dataSource as any,
    operator: req.query.operator as string,
    search: req.query.search as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
  };
  const format = (req.query.format as string) || 'csv';
  const list = filterRecords(f);
  const fieldLabels: Record<string, string> = {
    id: '记录ID',
    infantName: '婴幼儿姓名',
    infantAge: '月龄',
    guardianName: '监护人',
    guardianPhone: '联系电话',
    courseName: '课程名称',
    originalDate: '原日期',
    newDate: '新日期',
    sourceFile: '来源文件',
    operator: '处理人',
    status: '状态',
    dataSource: '数据来源',
    latestNote: '最近说明',
    reviewCount: '复核次数',
    createdAt: '创建时间',
    updatedAt: '更新时间',
  };
  const statusLabel: Record<string, string> = {
    pending: '待复核', reviewed: '已复核', exception: '异常', supplemented: '已补录',
  };
  const sourceLabel: Record<string, string> = {
    normal: '正常录入', supplement: '手工补录', corrupted: '坏数据',
  };
  const flat = list.map((r) => ({
    '记录ID': r.id,
    '婴幼儿姓名': r.infantName,
    '月龄': r.infantAge,
    '监护人': r.guardianName,
    '联系电话': r.guardianPhone,
    '课程名称': r.courseName,
    '原日期': r.originalDate,
    '新日期': r.newDate,
    '来源文件': r.sourceFile,
    '处理人': r.operator,
    '状态': statusLabel[r.status],
    '数据来源': sourceLabel[r.dataSource],
    '最近说明': r.latestNote,
    '复核次数': r.reviewCount,
    '创建时间': r.createdAt,
    '更新时间': r.updatedAt,
    '变更历史条数': r.changeHistory.length,
    '异常事件数': r.exceptions.length,
  }));

  const stats = getStats();
  const log = addExportLog({
    operator: (req.query.operator as string) || '王园长',
    filters: f,
    format: format as any,
    recordCount: list.length,
    downloadUrl: '#',
  });

  if (format === 'csv') {
    const filename = `改期对账_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + toCSV(flat));
    return;
  }

  res.json({ success: true, data: flat, stats, log });
});

router.get('/logs', (_req: Request, res: Response) => {
  res.json({ success: true, data: exportLogs });
});

export default router;
