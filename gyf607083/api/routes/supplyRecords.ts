import { Router, Request, Response } from 'express';
import { 
  getSupplyRecords, 
  getSupplyRecordById, 
  handleException, 
  createManualRecord,
  getPendingRecords,
  getExceptionRecords
} from '../services/supplyRecordService';
import { auditMiddleware } from '../middleware/audit';
import { HandleExceptionRequest, CreateManualRecordRequest, UserRole } from '../../shared/types';

const router = Router();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

router.get('/', 
  auditMiddleware('update', 'supply_record'),
  (req: Request, res: Response) => {
    try {
      const { classId, babyId, status, includeManual } = req.query;
      
      const records = getSupplyRecords({
        classId: classId as string,
        babyId: babyId as string,
        status: status as any,
        includeManual: includeManual !== 'false'
      });
      
      res.json({ success: true, data: records });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get('/pending', 
  auditMiddleware('update', 'supply_record'),
  (req: Request, res: Response) => {
    try {
      const records = getPendingRecords();
      res.json({ success: true, data: records });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get('/exceptions', 
  auditMiddleware('update', 'supply_record'),
  (req: Request, res: Response) => {
    try {
      const records = getExceptionRecords();
      res.json({ success: true, data: records });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get('/:id', 
  auditMiddleware('update', 'supply_record'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const record = getSupplyRecordById(id);
      if (!record) {
        return res.status(404).json({ success: false, error: '记录不存在' });
      }
      res.json({ success: true, data: record });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.post('/handle', 
  auditMiddleware('update', 'supply_record', (req) => req.body.recordId),
  (req: Request, res: Response) => {
    try {
      const request = req.body as HandleExceptionRequest;
      const operatorId = req.headers['x-user-id'] as string | undefined;
      const operatorRole = req.headers['x-user-role'] as UserRole | undefined;
      const ipAddress = getClientIp(req);
      
      const result = handleException(request, operatorId, operatorRole, ipAddress);
      
      if (result.success || result.partialSuccess) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        partialSuccess: false,
        successItems: [],
        failedItems: [],
        error: error.message,
        message: error.message
      });
    }
  }
);

router.post('/manual', 
  auditMiddleware('create', 'supply_record'),
  (req: Request, res: Response) => {
    try {
      const request = req.body as CreateManualRecordRequest;
      const operatorId = req.headers['x-user-id'] as string | undefined;
      const operatorRole = req.headers['x-user-role'] as UserRole | undefined;
      const ipAddress = getClientIp(req);
      
      const result = createManualRecord(request, operatorId, operatorRole, ipAddress);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        message: error.message
      });
    }
  }
);

export default router;
