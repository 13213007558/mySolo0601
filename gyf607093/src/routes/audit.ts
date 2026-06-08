import { Router, Response } from 'express';
import { auditService } from '../services/auditService';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { UserRoleType } from '../config';

const router = Router();

router.get('/', authenticate, requireRole('SUPERVISOR' as UserRoleType), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const action = req.query.action as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    const babyId = req.query.babyId ? parseInt(req.query.babyId as string) : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const isUnauthorized = req.query.isUnauthorized ? req.query.isUnauthorized === 'true' : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await auditService.getAuditLogs(
      { userId, action, targetType, babyId, startDate, endDate, isUnauthorized },
      page,
      pageSize
    );

    res.json({
      ...result,
      page,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ error: '获取审计日志失败', message: (error as Error).message });
  }
});

router.get('/unauthorized', authenticate, requireRole('SUPERVISOR' as UserRoleType), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await auditService.getUnauthorizedAccessLogs(
      startDate,
      endDate,
      page,
      pageSize
    );

    res.json({
      message: '越权访问审计日志（供主管复查）',
      ...result,
      page,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ error: '获取越权日志失败', message: (error as Error).message });
  }
});

export default router;
