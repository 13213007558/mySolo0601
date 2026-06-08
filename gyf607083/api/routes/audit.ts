import { Router, Request, Response } from 'express';
import { getAuditLogs, getAuditLogById, getAuditLogsByEntity } from '../services/auditService';
import { auditMiddleware } from '../middleware/audit';
import { UserRole } from '../../shared/types';

const router = Router();

router.get('/', 
  auditMiddleware('update', 'audit_log'),
  (req: Request, res: Response) => {
    try {
      const { entityType, entityId, operatorId, startTime, endTime } = req.query;
      const userRole = req.headers['x-user-role'] as UserRole | undefined;
      
      const logs = getAuditLogs({
        entityType: entityType as string,
        entityId: entityId as string,
        operatorId: operatorId as string,
        startTime: startTime as string,
        endTime: endTime as string,
        userRole
      });
      
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get('/:id', 
  auditMiddleware('update', 'audit_log'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userRole = req.headers['x-user-role'] as UserRole | undefined;
      
      const log = getAuditLogById(id, userRole);
      if (!log) {
        return res.status(404).json({ success: false, error: '审计记录不存在' });
      }
      res.json({ success: true, data: log });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get('/entity/:entityType/:entityId', 
  auditMiddleware('update', 'audit_log'),
  (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      const userRole = req.headers['x-user-role'] as UserRole | undefined;
      
      const logs = getAuditLogsByEntity(entityType, entityId, userRole);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
