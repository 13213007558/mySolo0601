import { Router, Request, Response } from 'express';
import { exportToExcel, exportToJson, generateExportData } from '../services/exportService';
import { auditMiddleware } from '../middleware/audit';
import { ExportOptions, UserRole } from '../../shared/types';

const router = Router();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

router.post('/preview', 
  auditMiddleware('export', 'export'),
  (req: Request, res: Response) => {
    try {
      const options = req.body as ExportOptions;
      const userRole = req.headers['x-user-role'] as UserRole | undefined;
      const operatorId = req.headers['x-user-id'] as string | undefined;
      const ipAddress = getClientIp(req);
      
      const data = generateExportData(options, userRole, operatorId, ipAddress);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.post('/excel', 
  auditMiddleware('export', 'export'),
  (req: Request, res: Response) => {
    try {
      const options = req.body as ExportOptions;
      const userRole = req.headers['x-user-role'] as UserRole | undefined;
      const operatorId = req.headers['x-user-id'] as string | undefined;
      const ipAddress = getClientIp(req);
      
      const buffer = exportToExcel(options, userRole, operatorId, ipAddress);
      
      const fileName = `用品发放记录_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.post('/json', 
  auditMiddleware('export', 'export'),
  (req: Request, res: Response) => {
    try {
      const options = req.body as ExportOptions;
      const userRole = req.headers['x-user-role'] as UserRole | undefined;
      const operatorId = req.headers['x-user-id'] as string | undefined;
      const ipAddress = getClientIp(req);
      
      const jsonData = exportToJson(options, userRole, operatorId, ipAddress);
      
      const fileName = `用品发放记录_${new Date().toISOString().slice(0, 10)}.json`;
      
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.send(jsonData);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
