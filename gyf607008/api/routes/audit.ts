import { Router, type Request, type Response } from 'express';
import type { AuditFilters } from '../../shared/types.js';
import { getAuditLogs, getAuditLogsByRecordId } from '../data/store.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const filters = req.query as unknown as AuditFilters;
  let result = getAuditLogs();

  if (filters.operator) {
    result = result.filter((a) => a.operator.includes(filters.operator!));
  }
  if (filters.action) {
    result = result.filter((a) => a.action === filters.action);
  }
  if (filters.dateFrom) {
    result = result.filter((a) => a.timestamp >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    result = result.filter((a) => a.timestamp <= filters.dateTo + ' 23:59:59');
  }
  if (filters.recordId) {
    result = result.filter((a) => a.recordId === filters.recordId);
  }

  res.json({ success: true, data: result });
});

router.get('/record/:recordId', (req: Request, res: Response) => {
  const result = getAuditLogsByRecordId(req.params.recordId);
  res.json({ success: true, data: result });
});

export default router;
