import { Router, Response } from 'express';
import { exportService } from '../services/exportService';
import { authenticate, AuthRequest, requireAnyRole } from '../middleware/auth';
import { UserRoleType } from '../config';
import * as fs from 'fs';

const router = Router();

router.post('/csv', authenticate, requireAnyRole(['SUPERVISOR', 'ADMIN', 'RECEPTION'] as UserRoleType[]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classId = req.body.classId ? parseInt(req.body.classId) : undefined;
    const babyId = req.body.babyId ? parseInt(req.body.babyId) : undefined;
    const startDate = req.body.startDate ? new Date(req.body.startDate) : undefined;
    const endDate = req.body.endDate ? new Date(req.body.endDate) : undefined;
    const status = req.body.status as string | undefined;
    const ipAddress = req.ip;

    const result = await exportService.exportToCsv(
      { classId, babyId, startDate, endDate, status },
      req.user!.id,
      req.user!.role,
      ipAddress
    );

    res.json({
      message: 'CSV导出成功',
      ...result,
      downloadUrl: `/api/export/download/${result.filename}`,
    });
  } catch (error) {
    res.status(500).json({ error: '导出失败', message: (error as Error).message });
  }
});

router.post('/json', authenticate, requireAnyRole(['SUPERVISOR', 'ADMIN', 'RECEPTION'] as UserRoleType[]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classId = req.body.classId ? parseInt(req.body.classId) : undefined;
    const babyId = req.body.babyId ? parseInt(req.body.babyId) : undefined;
    const startDate = req.body.startDate ? new Date(req.body.startDate) : undefined;
    const endDate = req.body.endDate ? new Date(req.body.endDate) : undefined;
    const status = req.body.status as string | undefined;
    const ipAddress = req.ip;

    const result = await exportService.exportToJson(
      { classId, babyId, startDate, endDate, status },
      req.user!.id,
      req.user!.role,
      ipAddress
    );

    res.json({
      message: 'JSON导出成功',
      ...result,
      downloadUrl: `/api/export/download/${result.filename}`,
    });
  } catch (error) {
    res.status(500).json({ error: '导出失败', message: (error as Error).message });
  }
});

router.get('/download/:filename', authenticate, requireAnyRole(['SUPERVISOR', 'ADMIN', 'RECEPTION'] as UserRoleType[]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filename = req.params.filename;

    if (!exportService.fileExists(filename)) {
      res.status(404).json({ error: '文件不存在' });
      return;
    }

    const filePath = exportService.getExportFilePath(filename);

    res.download(filePath, filename, (err) => {
      if (err) {
        res.status(500).json({ error: '下载失败', message: (err as Error).message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: '下载失败', message: (error as Error).message });
  }
});

router.get('/history', authenticate, requireAnyRole(['SUPERVISOR', 'ADMIN'] as UserRoleType[]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await exportService.getExportHistory(userId, page, pageSize);

    res.json({
      ...result,
      page,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ error: '获取导出历史失败', message: (error as Error).message });
  }
});

export default router;
