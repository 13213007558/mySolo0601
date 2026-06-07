import { Router } from 'express';

const router = Router();

router.get('/me', (req, res) => {
  res.json(req.currentUser || { id: 'u_supervisor', name: '王主管', role: 'supervisor' });
});

export default router;
