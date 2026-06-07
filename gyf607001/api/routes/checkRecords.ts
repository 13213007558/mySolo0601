import express from 'express';
import type { Baby, DailyCheckRecord, AuditLog, ImportResult, CheckStatus } from '../../shared/types';
import {
  mockBabies,
  mockRecords,
  mockAuditLogs,
  generateDirtyImportSample,
  generateEmptyImportSample,
} from '../../shared/mockData';

const router = express.Router();

let records: DailyCheckRecord[] = [...mockRecords];
let babies: Baby[] = [...mockBabies];
let auditLogs: AuditLog[] = [...mockAuditLogs];

router.post('/import', (_req, res) => {
  const scenario = (_req.body as { scenario?: string })?.scenario;
  let result: ImportResult;
  if (scenario === 'empty') {
    result = generateEmptyImportSample();
  } else if (scenario === 'dirty') {
    result = generateDirtyImportSample();
    records = [...result.importedRecords, ...records.filter(r => !result.importedRecords.some(nr => nr.babyId === r.babyId && nr.date === r.date))];
  } else {
    const todayRecords = records.filter(r => r.date === new Date().toISOString().split('T')[0]);
    result = {
      totalRows: todayRecords.length,
      successRows: todayRecords.length,
      dirtyRows: 0,
      emptyRows: 0,
      partialSuccess: false,
      dirtyRowDetails: [],
      importedRecords: todayRecords,
    };
  }
  res.json(result);
});

router.get('/records', (req, res) => {
  const { date, className, status, babyId } = req.query as Record<string, string>;
  let filtered = [...records];
  if (date) filtered = filtered.filter(r => r.date === date);
  if (className) {
    const babyIdsInClass = babies.filter(b => b.className === className).map(b => b.id);
    filtered = filtered.filter(r => babyIdsInClass.includes(r.babyId));
  }
  if (status) filtered = filtered.filter(r => r.status === status);
  if (babyId) filtered = filtered.filter(r => r.babyId === babyId);
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  res.json(filtered);
});

router.get('/records/:id', (req, res) => {
  const record = records.find(r => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });
  const relatedAudit = auditLogs.filter(a => a.recordId === record.id || a.babyId === record.babyId);
  res.json({ ...record, auditLogs: relatedAudit });
});

router.get('/babies', (_req, res) => {
  res.json(babies);
});

router.get('/babies/:id', (req, res) => {
  const baby = babies.find(b => b.id === req.params.id);
  if (!baby) return res.status(404).json({ error: '宝宝不存在' });
  const babyRecords = records.filter(r => r.babyId === baby.id).sort((a, b) => b.date.localeCompare(a.date));
  res.json({ baby, records: babyRecords });
});

router.post('/records/:id/review', (req, res) => {
  const record = records.find(r => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });

  const { newStatus, newReason, operatorName } = req.body as {
    newStatus: CheckStatus;
    newReason: string;
    operatorName: string;
  };

  const auditLog: AuditLog = {
    id: Math.random().toString(36).slice(2, 11),
    recordId: record.id,
    babyId: record.babyId,
    operatorId: 'op_current',
    operatorName: operatorName || '保健老师',
    oldStatus: record.status,
    newStatus,
    oldReason: record.initialReason,
    newReason,
    operatedAt: new Date().toISOString(),
  };

  auditLogs = [auditLog, ...auditLogs];
  record.status = newStatus;
  record.initialReason = newReason;
  record.reviewStatus = 'reviewed';
  record.auditLogs = [...(record.auditLogs || []), auditLog];

  res.json({ success: true, record, auditLog });
});

router.get('/audit', (_req, res) => {
  const enriched = auditLogs.map(log => ({
    ...log,
    babyName: babies.find(b => b.id === log.babyId)?.name || '未知',
    className: babies.find(b => b.id === log.babyId)?.className || '未知',
  }));
  res.json(enriched.sort((a, b) => b.operatedAt.localeCompare(a.operatedAt)));
});

router.post('/audit/:id/confirm', (req, res) => {
  const log = auditLogs.find(a => a.id === req.params.id);
  if (!log) return res.status(404).json({ error: '审计记录不存在' });
  log.reviewedBy = (req.body as { reviewedBy?: string })?.reviewedBy || '主管王主任';
  log.reviewedAt = new Date().toISOString();
  res.json({ success: true, auditLog: log });
});

export default router;
