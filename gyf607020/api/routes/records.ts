import { Router, Request, Response } from 'express';
import { recordRepo, reviewLogRepo } from '../repositories/recordRepository';
import { buildExport, verifyCount } from '../services/exportService';
import type { ListFilters, ReviewPayload } from '../../shared/types';

const router = Router();

function parseFilters(req: Request): ListFilters {
  const q = req.query;
  const filters: ListFilters = {};
  if (typeof q.phone === 'string' && q.phone.trim()) filters.phone = q.phone.trim();
  if (typeof q.status === 'string') filters.status = q.status as any;
  if (q.includeBadData === 'true' || q.includeBadData === '1') filters.includeBadData = true;
  if (typeof q.startDate === 'string') filters.startDate = q.startDate;
  if (typeof q.endDate === 'string') filters.endDate = q.endDate;
  return filters;
}

router.get('/records', (req: Request, res: Response) => {
  const filters = parseFilters(req);
  const data = recordRepo.list(filters);
  const stats = recordRepo.stats(filters);
  res.json({
    data,
    total: stats.total,
    normalCount: stats.normalCount,
    badCount: stats.badCount,
  });
});

router.get('/records/stats', (req: Request, res: Response) => {
  const filters = parseFilters(req);
  res.json(recordRepo.stats(filters));
});

router.get('/records/:id', (req: Request, res: Response) => {
  const record = recordRepo.getById(req.params.id);
  if (!record) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(record);
});

router.put('/records/:id', (req: Request, res: Response) => {
  const payload = req.body as ReviewPayload;
  if (!payload.status || !payload.handlerName) {
    res.status(400).json({ error: '状态和处理人必填' });
    return;
  }
  const updated = recordRepo.review(req.params.id, payload);
  if (!updated) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(updated);
});

router.post('/records/:id/mark-bad', (req: Request, res: Response) => {
  const { reason, handlerName } = req.body;
  if (!reason || !handlerName) {
    res.status(400).json({ error: '原因和处理人必填' });
    return;
  }
  const updated = recordRepo.markBad(req.params.id, reason, handlerName);
  if (!updated) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(updated);
});

router.post('/records/:id/restore', (req: Request, res: Response) => {
  const { handlerName } = req.body;
  if (!handlerName) {
    res.status(400).json({ error: '处理人必填' });
    return;
  }
  const updated = recordRepo.restore(req.params.id, handlerName);
  if (!updated) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(updated);
});

router.get('/records/:id/review-logs', (req: Request, res: Response) => {
  const record = recordRepo.getById(req.params.id);
  if (!record) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(reviewLogRepo.listByRecord(req.params.id));
});

router.get('/export/records', (req: Request, res: Response) => {
  const filters = parseFilters(req);
  const expectedCount =
    typeof req.query.expectedCount === 'string' ? parseInt(req.query.expectedCount, 10) : null;

  if (expectedCount !== null && !Number.isNaN(expectedCount)) {
    if (!verifyCount(filters, expectedCount)) {
      res.status(409).json({
        error: '页面显示数量与待导出数量不一致，请刷新页面后重试',
      });
      return;
    }
  }

  const result = buildExport(filters);
  const filename = `奶量交接表_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(filename)}"`
  );
  res.send('\uFEFF' + result.csv);
});

export default router;
