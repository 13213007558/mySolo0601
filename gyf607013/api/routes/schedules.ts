import { Router, type Request, type Response } from 'express';
import type { DisinfectionRecord } from '../../src/types/index.js';
import { mockDb } from '../db/mockDb.js';
import {
  checkTemperatureBoundary,
  logRecordUpdate,
} from '../services/auditService.js';
import {
  validateDisinfectionRecord,
} from '../services/validationService.js';

const router = Router();

router.post('/', (req: Request, res: Response): void => {
  const payload = req.body as Partial<DisinfectionRecord>;
  const operator = req.user;

  const validation = validateDisinfectionRecord(payload);
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      error: '数据校验失败',
      errors: validation.errors,
    });
    return;
  }

  const now = new Date().toISOString();
  const id = `dr${Date.now()}`;

  let finalRecord: Partial<DisinfectionRecord> = {
    ...payload,
    id,
    source: payload.source || 'manual',
    status: payload.status || 'pending',
    createdAt: now,
    updatedAt: now,
  };

  if (payload.temperature !== undefined) {
    const boundaryCheck = checkTemperatureBoundary(payload.temperature);
    if (boundaryCheck.isBoundary) {
      finalRecord = {
        ...finalRecord,
        isBoundaryAudit: true,
        boundaryReason: boundaryCheck.reason,
      };
    }
  }

  if (operator) {
    finalRecord.operatorId = finalRecord.operatorId || operator.id;
    finalRecord.operatorName = finalRecord.operatorName || operator.name;
  }

  const created = mockDb.addDisinfectionRecord(finalRecord);

  res.status(201).json({
    success: true,
    data: created,
  });
});

router.get('/', (req: Request, res: Response): void => {
  const { classId, status, babyId } = req.query;

  let records = mockDb.getDisinfectionRecords();

  if (classId && typeof classId === 'string') {
    records = records.filter((r) => r.classId === classId);
  }
  if (status && typeof status === 'string') {
    records = records.filter((r) => r.status === status);
  }
  if (babyId && typeof babyId === 'string') {
    records = records.filter((r) => r.babyId === babyId);
  }

  records.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());

  res.status(200).json({
    success: true,
    data: records,
  });
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const record = mockDb.findDisinfectionRecordById(id);

  if (!record) {
    res.status(404).json({
      success: false,
      error: `排程记录不存在: ${id}`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: record,
  });
});

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const updates = req.body as Partial<DisinfectionRecord>;
  const operator = req.user;

  const existing = mockDb.findDisinfectionRecordById(id);
  if (!existing) {
    res.status(404).json({
      success: false,
      error: `排程记录不存在: ${id}`,
    });
    return;
  }

  let finalUpdates: Partial<DisinfectionRecord> = { ...updates };

  if (updates.status === 'completed' && !updates.actualTime && !existing.actualTime) {
    finalUpdates.actualTime = new Date().toISOString();
  }

  if (operator) {
    if (updates.status && !finalUpdates.operatorId && !existing.operatorId) {
      finalUpdates.operatorId = operator.id;
      finalUpdates.operatorName = operator.name;
    }
  }

  const mergedForValidation: Partial<DisinfectionRecord> = {
    ...existing,
    ...finalUpdates,
  };

  const validation = validateDisinfectionRecord(mergedForValidation);
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      error: '数据校验失败',
      errors: validation.errors,
      warnings: validation.warnings,
    });
    return;
  }

  if (updates.temperature !== undefined) {
    const boundaryCheck = checkTemperatureBoundary(updates.temperature);
    if (boundaryCheck.isBoundary) {
      finalUpdates = {
        ...finalUpdates,
        isBoundaryAudit: true,
        boundaryReason: boundaryCheck.reason,
      };
    }
  }

  const updated = mockDb.updateDisinfectionRecord(id, finalUpdates);

  if (operator && updated) {
    logRecordUpdate(existing, updated, operator);
  }

  res.status(200).json({
    success: true,
    data: updated,
    warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
  });
});

export default router;
