import { Router, type Request, type Response } from 'express';
import { mockDb } from '../db/mockDb.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const { recordId, action, operatorId } = req.query;

  let records = mockDb.getScanRecords();

  if (recordId && typeof recordId === 'string') {
    records = records.filter((s) => s.recordId === recordId);
  }
  if (action && typeof action === 'string') {
    records = records.filter((s) => s.action === action);
  }
  if (operatorId && typeof operatorId === 'string') {
    records = records.filter((s) => s.operatorId === operatorId);
  }

  records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.status(200).json({
    success: true,
    data: records,
  });
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const records = mockDb.getScanRecordsByRecordId(id);

  records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  res.status(200).json({
    success: true,
    data: records,
  });
});

export default router;
