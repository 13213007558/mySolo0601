import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { importFromExcel, getImportAudits } from '../services/importService.js';
import { getOperationLogs } from '../services/auditService.js';
import type { ApiResponse } from '../../shared/types.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const router = Router();

router.get('/imports', (_req: Request, res: Response<ApiResponse<any>>) => {
  const audits = getImportAudits();
  res.json({ success: true, data: audits });
});

router.post('/import/excel', upload.single('file'), (req: Request, res: Response<ApiResponse<any>>) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: '未上传文件' });
    return;
  }
  const result = importFromExcel(req.file.buffer, req.file.originalname);
  const statusCode = result.success ? 200 : (result.partialSuccess ? 206 : 400);
  res.status(statusCode).json({ success: result.success, data: result, message: result.message });
});

router.get('/operations', (req: Request, res: Response<ApiResponse<any>>) => {
  const targetType = req.query.targetType as string | undefined;
  const targetId = req.query.targetId as string | undefined;
  const logs = getOperationLogs(targetType, targetId);
  res.json({ success: true, data: logs });
});

export default router;
