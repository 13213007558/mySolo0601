import { Router, type Request, type Response } from 'express';
import { getAllAuditLogs } from '../services/auditService.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get(
  '/',
  requireRole('supervisor', 'nurse'),
  (req: Request, res: Response): void => {
    const { recordId, isBoundaryAudit } = req.query;

    let logs = getAllAuditLogs();

    if (recordId && typeof recordId === 'string') {
      logs = logs.filter((l) => l.recordId === recordId);
    }
    if (isBoundaryAudit !== undefined) {
      const flag = isBoundaryAudit === 'true' || String(isBoundaryAudit) === 'true';
      logs = logs.filter((l) => l.isBoundaryAudit === flag);
    }

    logs.sort((a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime());

    res.status(200).json({
      success: true,
      data: logs,
    });
  },
);

router.get('/boundary', (req: Request, res: Response): void => {
  const logs = getAllAuditLogs().filter((l) => l.isBoundaryAudit);
  logs.sort((a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime());

  res.status(200).json({
    success: true,
    data: logs,
  });
});

export default router;
