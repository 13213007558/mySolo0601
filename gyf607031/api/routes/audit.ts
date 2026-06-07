import express, { type Request, type Response } from 'express';
import { store } from '../store.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const audits = store.getAudits();
  res.json({
    success: true,
    data: audits,
  });
});

export default router;
