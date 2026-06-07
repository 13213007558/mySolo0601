import { Router, Request, Response } from 'express';
import { db } from '../db';

export const babiesRouter = Router();

babiesRouter.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT * FROM babies ORDER BY room_no, bed_no
  `).all();
  res.json(rows);
});

babiesRouter.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: '婴儿信息不存在' });
    return;
  }
  res.json(row);
});
