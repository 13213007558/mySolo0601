import { Router, type Request, type Response } from 'express';
import type { ExportOptions, ExportReport } from '../../shared/types.js';
import { getRecords, addAuditLog, genId, nowTimestamp } from '../data/store.js';
import { toCSV } from '../utils/validation.js';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const opts = req.body as ExportOptions;
  const operator = (req.body as { operator?: string })?.operator || '系统用户';
  const ts = nowTimestamp();

  let records = getRecords();
  if (opts.recordIds && opts.recordIds.length > 0) {
    records = records.filter((r) => opts.recordIds.includes(r.id));
  }
  if (opts.excludeAbnormal) {
    records = records.filter((r) => r.status !== 'abnormal');
  }

  const abnormalCount = records.filter((r) => r.status === 'abnormal').length;
  const warningCount = records.filter((r) => r.status === 'pending').length;
  const normalCount = records.filter((r) => r.status === 'normal').length;

  const csvContent = toCSV(records, {
    maskPhone: opts.maskPhone,
    excludeInternal: opts.excludeInternal,
  });

  const issuesSummary = records
    .filter((r) => r.issues.length > 0)
    .map((r) => ({
      recordId: r.id,
      babyName: r.babyName,
      issues: r.issues,
    }));

  const report: ExportReport = {
    totalCount: records.length,
    normalCount,
    abnormalCount,
    warningCount,
    issues: issuesSummary,
    csvContent,
  };

  records.forEach((r) => {
    addAuditLog({
      id: genId('audit'),
      recordId: r.id,
      babyName: r.babyName,
      operator,
      action: 'export',
      timestamp: ts,
      fieldChanges: [
        {
          field: 'export',
          oldValue: '',
          newValue: `导出CSV${opts.maskPhone ? '（手机号脱敏）' : ''}${opts.excludeInternal ? '（排除内部备注）' : ''}${opts.excludeAbnormal ? '（排除异常）' : ''}`,
        },
      ],
    });
  });

  res.json({ success: true, data: report });
});

export default router;
