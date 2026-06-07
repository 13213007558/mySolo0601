import { Router, type Request, type Response } from 'express';
import type { InfantRecord, RecordFilters } from '../../shared/types.js';
import {
  getRecords,
  getRecordById,
  addRecord,
  updateRecord,
  addAuditLog,
  diffFields,
  nowTimestamp,
  genId,
} from '../data/store.js';
import { validateAll, computeStatus } from '../utils/validation.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const filters = req.query as unknown as RecordFilters;
  let result = getRecords();

  if (filters.batchNo) {
    result = result.filter((r) => r.batchNo.includes(filters.batchNo!));
  }
  if (filters.babyName) {
    result = result.filter((r) => r.babyName.includes(filters.babyName!));
  }
  if (filters.status) {
    result = result.filter((r) => r.status === filters.status);
  }
  if (filters.source) {
    result = result.filter((r) => r.source === filters.source);
  }
  if (filters.dateFrom) {
    result = result.filter((r) => r.createdAt >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    result = result.filter((r) => r.createdAt <= filters.dateTo + ' 23:59:59');
  }

  res.json({ success: true, data: result });
});

router.get('/:id', (req: Request, res: Response) => {
  const rec = getRecordById(req.params.id);
  if (!rec) {
    return res.status(404).json({ success: false, error: '记录不存在' });
  }
  res.json({ success: true, data: rec });
});

router.post('/', (req: Request, res: Response) => {
  const body = req.body as Partial<InfantRecord>;
  const issues = validateAll(body);
  const status = computeStatus(issues);
  const ts = nowTimestamp();
  const operator = body.createdBy || '系统用户';

  const newRec: InfantRecord = {
    id: genId('rec'),
    batchNo: body.batchNo || '',
    babyName: body.babyName || '',
    gender: body.gender || '',
    birthDate: body.birthDate || '',
    parentPhone: body.parentPhone || '',
    source: body.source || 'supplement',
    status,
    createdAt: ts,
    updatedAt: ts,
    createdBy: operator,
    updatedBy: operator,
    parentVisible: {
      feeding: body.parentVisible?.feeding || '',
      temperature: body.parentVisible?.temperature || '',
      sleep: body.parentVisible?.sleep || '',
    },
    internalNotes: body.internalNotes || '',
    issues,
  };

  addRecord(newRec);
  addAuditLog({
    id: genId('audit'),
    recordId: newRec.id,
    babyName: newRec.babyName,
    operator,
    action: 'create',
    timestamp: ts,
    fieldChanges: [],
  });

  res.status(201).json({ success: true, data: newRec });
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = getRecordById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: '记录不存在' });
  }
  const body = req.body as Partial<InfantRecord>;
  const operator = body.updatedBy || '系统用户';
  const ts = nowTimestamp();

  const merged: InfantRecord = {
    ...existing,
    batchNo: body.batchNo ?? existing.batchNo,
    babyName: body.babyName ?? existing.babyName,
    gender: body.gender ?? existing.gender,
    birthDate: body.birthDate ?? existing.birthDate,
    parentPhone: body.parentPhone ?? existing.parentPhone,
    source: body.source ?? existing.source,
    internalNotes: body.internalNotes ?? existing.internalNotes,
    parentVisible: {
      feeding: body.parentVisible?.feeding ?? existing.parentVisible.feeding,
      temperature: body.parentVisible?.temperature ?? existing.parentVisible.temperature,
      sleep: body.parentVisible?.sleep ?? existing.parentVisible.sleep,
    },
    updatedAt: ts,
    updatedBy: operator,
  };
  merged.issues = validateAll(merged);
  merged.status = computeStatus(merged.issues);

  const fieldChanges = diffFields(existing, merged);
  const updated = updateRecord(req.params.id, () => merged);

  if (fieldChanges.length > 0) {
    addAuditLog({
      id: genId('audit'),
      recordId: merged.id,
      babyName: merged.babyName,
      operator,
      action: 'update',
      timestamp: ts,
      fieldChanges,
    });
  }

  res.json({ success: true, data: updated });
});

router.patch('/:id/review', (req: Request, res: Response) => {
  const existing = getRecordById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: '记录不存在' });
  }
  const operator = (req.body as { operator?: string })?.operator || '系统用户';
  const ts = nowTimestamp();

  const updated = updateRecord(req.params.id, (r) => {
    const issues = validateAll(r);
    return {
      ...r,
      issues,
      status: computeStatus(issues) === 'normal' ? 'normal' : 'pending',
      updatedAt: ts,
      updatedBy: operator,
    };
  });

  addAuditLog({
    id: genId('audit'),
    recordId: existing.id,
    babyName: existing.babyName,
    operator,
    action: 'review',
    timestamp: ts,
    fieldChanges: [
      {
        field: 'status',
        oldValue: existing.status,
        newValue: updated?.status || existing.status,
      },
    ],
  });

  res.json({ success: true, data: updated });
});

export default router;
