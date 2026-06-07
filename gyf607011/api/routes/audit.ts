import { Router, type Request, type Response } from 'express';
import { auditLogs } from '../data/mockData.js';

const router = Router();

router.get('/record/:recordId', (req: Request, res: Response) => {
  const logs = auditLogs.filter((a) => a.recordId === req.params.recordId);
  res.json({ success: true, data: logs });
});

router.post('/', (req: Request, res: Response) => {
  const log = {
    id: `a${Date.now()}`,
    ...req.body,
    operatedAt: new Date().toISOString(),
  };
  auditLogs.push(log);
  res.json({ success: true, data: log });
});

export default router;
