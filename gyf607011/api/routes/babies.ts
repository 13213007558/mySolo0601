import { Router, type Request, type Response } from 'express';
import { babies } from '../data/mockData.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: babies });
});

router.get('/:id', (req: Request, res: Response) => {
  const baby = babies.find((b) => b.id === req.params.id);
  if (!baby) {
    res.status(404).json({ success: false, error: '宝宝信息不存在' });
    return;
  }
  res.json({ success: true, data: baby });
});

export default router;
