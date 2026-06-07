import { Router } from 'express';
import * as authRepo from '../repositories/authRepository.js';
import * as auditRepo from '../repositories/auditRepository.js';
import * as exportRepo from '../repositories/exportRepository.js';
import * as exportService from '../services/exportService.js';
import * as correctionService from '../services/correctionService.js';

const router = Router();

router.get('/authorizations/summary', (req, res) => {
  const stats = authRepo.getSummaryStats();
  res.json(stats);
});

router.get('/authorizations', (req, res) => {
  const { parentPhone, authStatus, storeName, authType, page, pageSize } = req.query as Record<string, string>;
  const result = authRepo.findAuthorizations({
    parentPhone,
    authStatus,
    storeName,
    authType,
    page: page ? parseInt(page, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
  });
  res.json(result);
});

router.get('/authorizations/:id', (req, res) => {
  const auth = authRepo.findAuthorizationById(req.params.id);
  if (!auth) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  const audits = auditRepo.findAuditsByAuthId(req.params.id);
  res.json({ ...auth, audits });
});

router.post('/authorizations/:id/correct', (req, res) => {
  const { beforeData, afterData, reason, operator } = req.body;
  if (!beforeData || !afterData || !reason || !operator) {
    res.status(400).json({ error: '缺少必填参数' });
    return;
  }
  const result = correctionService.submitCorrection({
    authId: req.params.id,
    beforeData,
    afterData,
    reason,
    operator,
  });
  res.json(result);
});

router.post('/export/csv', (req, res) => {
  const { ids, operator, filterCriteria, pageCount, allowPartial } = req.body;
  if (!ids || !operator || pageCount === undefined) {
    res.status(400).json({ error: '缺少必填参数' });
    return;
  }
  const result = exportService.performExport({
    ids, format: 'csv', operator,
    filterCriteria: filterCriteria ?? {},
    pageCount,
    allowPartial: allowPartial ?? true,
  });
  if (result.status === 'rejected') {
    res.status(409).json(result);
    return;
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
  res.json(result);
});

router.post('/export/markdown', (req, res) => {
  const { ids, operator, filterCriteria, pageCount, allowPartial } = req.body;
  if (!ids || !operator || pageCount === undefined) {
    res.status(400).json({ error: '缺少必填参数' });
    return;
  }
  const result = exportService.performExport({
    ids, format: 'markdown', operator,
    filterCriteria: filterCriteria ?? {},
    pageCount,
    allowPartial: allowPartial ?? true,
  });
  if (result.status === 'rejected') {
    res.status(409).json(result);
    return;
  }
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
  res.json(result);
});

router.get('/export/records', (_req, res) => {
  const records = exportRepo.findAllExports();
  res.json(records);
});

router.get('/export/:id/diff', async (req, res) => {
  const diffs = await exportRepo.getExportDiff(req.params.id);
  res.json(diffs);
});

router.get('/audit/timeline', (req, res) => {
  const { action, operator, limit } = req.query as Record<string, string>;
  const logs = auditRepo.findAllAudits({
    action,
    operator,
    limit: limit ? parseInt(limit, 10) : undefined,
  });
  res.json(logs);
});

router.get('/audit/failure-paths', (_req, res) => {
  const records = correctionService.getFailurePathRecords();
  res.json(records);
});

router.get('/corrections/pending', (_req, res) => {
  const records = exportRepo.findCorrectionsByStatus();
  res.json(records);
});

export default router;
