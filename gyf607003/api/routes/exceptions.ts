import { Router } from 'express';
import { listExceptions, handleException } from '../services/exceptions.js';
import type { HandleExceptionRequest } from '../../shared/types.js';

const router = Router();

router.get('/', (req, res) => {
  const { status } = req.query as { status?: string };
  res.json(listExceptions(status));
});

router.put('/:id', (req, res) => {
  const { currentUser } = req;
  if (!currentUser) return res.status(401).json({ error: '未登录' });
  const { id } = req.params;
  const body = req.body as HandleExceptionRequest;
  if (!body.handleMeasure) return res.status(400).json({ error: '处理措施必填' });
  const handlerId = body.handlerId || currentUser.id;
  const result = handleException(id, { handleMeasure: body.handleMeasure, handlerId }, currentUser);
  if (!result.success) return res.status(404).json({ error: '异常记录不存在' });
  res.json(result);
});

export default router;
