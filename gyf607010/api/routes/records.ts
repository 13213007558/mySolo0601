import { Router, type Request, type Response } from 'express';
import {
  listRecords,
  getRecordById,
  getRecordWithHistory,
  createRecord,
  updateRecord,
  reviewRecord,
  withdrawRecord,
  validateRecordInput,
} from '../services/recordsService.js';
import { listHistoryByRecordId } from '../services/historyService.js';
import type {
  RecordFilter,
  CreateRecordInput,
  UpdateRecordInput,
  ReviewPayload,
  WithdrawPayload,
} from '../../shared/types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: RecordFilter = {
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      babyName: req.query.babyName as string | undefined,
      status: req.query.status as RecordFilter['status'],
      operatorName: req.query.operatorName as string | undefined,
    };
    const list = await listRecords(filter);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const result = await getRecordWithHistory(req.params.id);
  if (!result) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(result);
});

router.get('/:id/history', async (req: Request, res: Response) => {
  const record = await getRecordById(req.params.id);
  if (!record) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  const history = await listHistoryByRecordId(req.params.id);
  res.json(history);
});

router.post('/', async (req: Request, res: Response) => {
  const input = req.body as CreateRecordInput;
  const errors = validateRecordInput(input);
  if (errors.length > 0) {
    res.status(400).json({ error: '数据校验失败', errors });
    return;
  }
  try {
    const record = await createRecord(input);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  const input = req.body as UpdateRecordInput;
  const existing = await getRecordById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  const errors = validateRecordInput({
    babyName: input.babyName ?? existing.babyName,
    recordDate: input.recordDate ?? existing.recordDate,
    shift: input.shift ?? existing.shift,
    milkAmountMl: input.milkAmountMl ?? existing.milkAmountMl,
    feedingMethod: input.feedingMethod ?? existing.feedingMethod,
    operator: input.operator,
  });
  if (errors.length > 0) {
    res.status(400).json({ error: '数据校验失败', errors });
    return;
  }
  const updated = await updateRecord(req.params.id, input);
  if (!updated) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(updated);
});

router.post('/:id/review', async (req: Request, res: Response) => {
  const payload = req.body as ReviewPayload;
  if (!payload.pass && (!payload.reason || !payload.reason.trim())) {
    res.status(400).json({ error: '复核退回必须填写原因' });
    return;
  }
  const record = await reviewRecord(req.params.id, payload);
  if (!record) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(record);
});

router.post('/:id/withdraw', async (req: Request, res: Response) => {
  const payload = req.body as WithdrawPayload;
  if (!payload.reason || !payload.reason.trim()) {
    res.status(400).json({ error: '撤回必须填写原因' });
    return;
  }
  const record = await withdrawRecord(req.params.id, payload);
  if (!record) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  res.json(record);
});

export default router;
