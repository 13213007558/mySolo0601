import { Router } from 'express';
import { listAuditLogs, markReviewed } from '../services/audit.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(listAuditLogs(200));
});

router.put('/:id/review', requireRole('supervisor', 'admin'), (req, res) => {
  const { currentUser } = req;
  if (!currentUser) return res.status(401).json({ error: '未登录' });
  const { comment } = req.body as { comment?: string };
  markReviewed(req.params.id, currentUser, comment || '');
  res.json({ ok: true });
});

export default router;
