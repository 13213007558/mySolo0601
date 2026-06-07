import { Router } from 'express';
import { getAllBabySummaries, getBabyDetail, getStats, createRecord } from '../service/babyService';
import type { CreateRecordBody } from '../../shared/types';

const router = Router();

router.get('/babies', (_req, res) => {
  const summaries = getAllBabySummaries();
  res.json(summaries);
});

router.get('/babies/:id', (req, res) => {
  const detail = getBabyDetail(req.params.id);
  if (!detail) {
    res.status(404).json({ error: 'Baby not found' });
    return;
  }
  res.json(detail);
});

router.get('/stats', (_req, res) => {
  res.json(getStats());
});

router.post('/records', (req, res) => {
  const body = req.body as CreateRecordBody;
  if (!body.babyId || !body.status || !body.source || !body.operatorName) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  if (typeof body.photoPresent !== 'boolean') {
    body.photoPresent = true;
  }
  const result = createRecord(body);
  res.status(result.created ? 201 : 200).json(result);
});

export default router;
