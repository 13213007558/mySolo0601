import { Router, type Request, type Response } from 'express';
import { morningChecks, auditLogs, manualEntries } from '../data/mockData.js';
import type { MorningCheck, AuditLog } from '../../shared/types.js';

const router = Router();

const fieldLabels: Record<string, string> = {
  temperature: '体温',
  oralCheck: '口腔检查',
  handCheck: '手部检查',
  skinCheck: '皮肤检查',
  status: '晨检状态',
  reviewStatus: '复核状态',
  remark: '备注',
};

function buildAuditLogs(oldRec: MorningCheck | undefined, newRec: MorningCheck, operator: string) {
  const logs: AuditLog[] = [];
  const fields = ['temperature', 'oralCheck', 'handCheck', 'skinCheck', 'status', 'reviewStatus', 'remark'] as const;
  for (const f of fields) {
    const oldVal = oldRec ? (oldRec[f] as string | number | undefined) : undefined;
    const newVal = newRec[f] as string | number | undefined;
    if (oldVal !== newVal) {
      logs.push({
        id: `a${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        recordId: newRec.id,
        fieldName: fieldLabels[f] ?? f,
        oldValue: oldVal ?? null,
        newValue: newVal ?? null,
        operator,
        operatedAt: new Date().toISOString(),
        operationType: oldRec ? 'update' : 'create',
        isAutoRollback: false,
      });
    }
  }
  return logs;
}

router.get('/', (req: Request, res: Response) => {
  const { babyId, date, dataQuality, reviewStatus } = req.query;
  let result = [...morningChecks];
  if (babyId) result = result.filter((r) => r.babyId === babyId);
  if (date) result = result.filter((r) => r.date === date);
  if (dataQuality) result = result.filter((r) => r.dataQuality === dataQuality);
  if (reviewStatus) result = result.filter((r) => r.reviewStatus === reviewStatus);
  result.sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json({ success: true, data: result });
});

router.get('/baby/:babyId', (req: Request, res: Response) => {
  const records = morningChecks
    .filter((r) => r.babyId === req.params.babyId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json({ success: true, data: records });
});

router.get('/:id', (req: Request, res: Response) => {
  const rec = morningChecks.find((r) => r.id === req.params.id);
  if (!rec) {
    res.status(404).json({ success: false, error: '晨检记录不存在' });
    return;
  }
  const manual = manualEntries.find((m) => m.recordId === rec.id);
  res.json({ success: true, data: { record: rec, manualEntry: manual } });
});

router.post('/', (req: Request, res: Response) => {
  const items = Array.isArray(req.body) ? req.body : [req.body];
  const successIdx: number[] = [];
  const failed: { index: number; error: string }[] = [];

  items.forEach((item, idx) => {
    try {
      if (!item.babyId || !item.date) {
        throw new Error('缺少必填字段：宝宝ID 或 日期');
      }
      const dup = morningChecks.find((r) => r.babyId === item.babyId && r.date === item.date);
      if (dup) {
        throw new Error('该宝宝当日已有晨检记录');
      }
      const record: MorningCheck = {
        id: `r${Date.now()}-${idx}`,
        temperature: item.temperature ?? 0,
        oralCheck: item.oralCheck ?? 'normal',
        handCheck: item.handCheck ?? 'normal',
        skinCheck: item.skinCheck ?? 'normal',
        status: item.status ?? 'normal',
        reviewStatus: 'pending',
        dataQuality: item.temperature ? 'clean' : 'empty',
        isManualEntry: false,
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      morningChecks.push(record);
      const logs = buildAuditLogs(undefined, record, item.operator ?? '护士');
      auditLogs.push(...logs);
      successIdx.push(idx);
    } catch (e) {
      failed.push({ index: idx, error: (e as Error).message });
    }
  });

  const result = {
    success: successIdx,
    failed,
    message: `成功 ${successIdx.length} 条，失败 ${failed.length} 条`,
  };
  const statusCode = failed.length === 0 ? 200 : successIdx.length > 0 ? 207 : 400;
  res.status(statusCode).json({ success: failed.length === 0, data: result });
});

router.put('/:id', (req: Request, res: Response) => {
  const idx = morningChecks.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: '晨检记录不存在' });
    return;
  }
  const oldRec = { ...morningChecks[idx] };
  const updated: MorningCheck = {
    ...morningChecks[idx],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };
  morningChecks[idx] = updated;
  const logs = buildAuditLogs(oldRec, updated, req.body.operator ?? '护士');
  auditLogs.push(...logs);
  res.json({ success: true, data: { record: updated, auditLogs: logs } });
});

router.post('/manual', (req: Request, res: Response) => {
  const { babyId, date, data, operator } = req.body;
  let recIdx = morningChecks.findIndex((r) => r.babyId === babyId && r.date === date);
  const beforeSnapshot = recIdx >= 0 ? { ...morningChecks[recIdx] } : { remark: '无晨检数据，待补录' };

  const recordData: MorningCheck = {
    id: recIdx >= 0 ? morningChecks[recIdx].id : `r${Date.now()}`,
    babyId,
    date,
    temperature: data.temperature ?? 0,
    oralCheck: data.oralCheck ?? 'normal',
    handCheck: data.handCheck ?? 'normal',
    skinCheck: data.skinCheck ?? 'normal',
    status: data.status ?? 'normal',
    reviewStatus: 'pending',
    dataQuality: 'clean',
    isManualEntry: true,
    remark: data.remark ?? '手工补录',
    createdAt: recIdx >= 0 ? morningChecks[recIdx].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (recIdx >= 0) {
    morningChecks[recIdx] = recordData;
  } else {
    morningChecks.push(recordData);
    recIdx = morningChecks.length - 1;
  }

  manualEntries.push({
    id: `m${Date.now()}`,
    recordId: recordData.id,
    beforeSnapshot,
    afterSnapshot: { ...recordData },
    enteredBy: operator ?? '护士',
    enteredAt: new Date().toISOString(),
  });

  const logs = buildAuditLogs(undefined, recordData, operator ?? '护士');
  logs.forEach((l) => (l.operationType = 'manual-entry'));
  auditLogs.push(...logs);

  res.json({ success: true, data: { record: morningChecks[recIdx], manualEntry: manualEntries[manualEntries.length - 1] } });
});

router.get('/:id/audit', (req: Request, res: Response) => {
  const logs = auditLogs.filter((a) => a.recordId === req.params.id);
  res.json({ success: true, data: logs });
});

router.get('/:id/manual', (req: Request, res: Response) => {
  const manual = manualEntries.find((m) => m.recordId === req.params.id);
  if (!manual) {
    res.status(404).json({ success: false, error: '未找到补录记录' });
    return;
  }
  res.json({ success: true, data: manual });
});

export default router;
