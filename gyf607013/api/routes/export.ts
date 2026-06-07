import { Router, type Request, type Response } from 'express';
import type { ExportResult, DisinfectionRecord, UserRole } from '../../src/types/index.js';
import { mockDb } from '../db/mockDb.js';
import { desensitizeBaby } from '../services/privacyService.js';
import { processWithPartialSuccess } from '../services/validationService.js';

const router = Router();

function recordsToCsv(records: DisinfectionRecord[]): string {
  const headers = [
    'ID',
    '宝宝ID',
    '班级ID',
    '物品名称',
    '计划时间',
    '实际时间',
    '状态',
    '温度(℃)',
    '时长(分钟)',
    '操作人',
    '处理人',
    '审核人',
    '异常说明',
    '来源',
    '是否边界审计',
    '边界原因',
  ];
  const rows = records.map((r) => [
    r.id,
    r.babyId,
    r.classId,
    r.itemName,
    r.scheduledTime,
    r.actualTime || '',
    r.status,
    String(r.temperature),
    String(r.duration),
    r.operatorName || '',
    r.handlerName || '',
    r.reviewedByName || '',
    (r.exceptionNote || '').replace(/,/g, '，'),
    r.source,
    r.isBoundaryAudit ? '是' : '否',
    (r.boundaryReason || '').replace(/,/g, '，'),
  ]);
  const escape = (val: string) => (val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val);
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

router.post('/', (req: Request, res: Response): void => {
  const {
    format = 'json',
    classId,
    startDate,
    endDate,
    includeBabies = false,
  } = req.body as {
    format?: 'csv' | 'json';
    classId?: string;
    startDate?: string;
    endDate?: string;
    includeBabies?: boolean;
  };

  const role = (req.userRole as UserRole) || 'staff';

  let records = mockDb.getDisinfectionRecords();

  if (classId) {
    records = records.filter((r) => r.classId === classId);
  }
  if (startDate) {
    records = records.filter((r) => new Date(r.scheduledTime) >= new Date(startDate));
  }
  if (endDate) {
    records = records.filter((r) => new Date(r.scheduledTime) <= new Date(endDate));
  }

  const processed = processWithPartialSuccess(records, (record, index) => {
    if (record.temperature < 0 || record.duration < 0) {
      return { result: null, error: '温度或时长数据无效' };
    }
    return { result: record };
  });

  const responseData: unknown = processed.items;
  let dataUrl: string | undefined;

  if (format === 'csv') {
    dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(recordsToCsv(processed.items));
  }

  let babies = undefined;
  if (includeBabies) {
    const babyIds = [...new Set(processed.items.map((r) => r.babyId))];
    babies = babyIds
      .map((id) => mockDb.findBabyById(id))
      .filter(Boolean)
      .map((b) => desensitizeBaby(b!, role));
  }

  const result: ExportResult = {
    success: processed.failedCount === 0,
    totalCount: processed.totalCount,
    successCount: processed.successCount,
    failedCount: processed.failedCount,
    failedItems: processed.failedItems.map((f) => ({
      rowIndex: f.index,
      reason: f.reason,
    })),
    format,
    dataUrl,
    data: format === 'json' ? (responseData as unknown[]) : undefined,
  };

  if (includeBabies) {
    (result as ExportResult & { babies?: unknown }).babies = babies;
  }

  const statusCode = processed.failedCount > 0 ? 207 : 200;
  res.status(statusCode).json({
    success: result.success,
    data: result,
  });
});

export default router;
