import { Router, Response } from 'express';
import { z } from 'zod';
import { disinfectionService } from '../services/disinfectionService';
import { authenticate, AuthRequest, requireAnyRole } from '../middleware/auth';
import { auditService } from '../services/auditService';
import { UserRoleType } from '../config';

const router = Router();

const scanSchema = z.object({
  barcode: z.string().min(1),
  babyId: z.number().int().positive(),
  classId: z.number().int().positive(),
  action: z.enum(['borrow', 'return']),
  scanResult: z.string().optional(),
});

const resolveAnomalySchema = z.object({
  anomalyType: z.string().min(1),
  description: z.string().min(1),
  resolution: z.string().min(1),
  partialSuccess: z.boolean().optional(),
});

const manualEntrySchema = z.object({
  itemId: z.number().int().positive(),
  babyId: z.number().int().positive(),
  classId: z.number().int().positive(),
  borrowTime: z.coerce.date(),
  returnTime: z.coerce.date(),
  scanResult: z.string().min(1),
  note: z.string().min(1),
});

const crossClassSchema = z.object({
  babyId: z.number().int().positive(),
  sourceClassId: z.number().int().positive(),
  targetClassIds: z.array(z.number().int().positive()),
});

router.post('/scan', authenticate, requireAnyRole(['RECEPTION', 'SUPERVISOR', 'ADMIN'] as UserRoleType[]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = scanSchema.parse(req.body);
    const ipAddress = req.ip;

    const record = await disinfectionService.scanRecord({
      ...validated,
      userId: req.user!.id,
      ipAddress,
    });

    res.json({
      message: validated.action === 'borrow' ? '借出成功' : '归还成功',
      record,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: '参数错误', details: error.errors });
      return;
    }
    res.status(500).json({ error: '操作失败', message: (error as Error).message });
  }
});

router.post('/:id/resolve', authenticate, requireAnyRole(['SUPERVISOR', 'ADMIN', 'THERAPIST'] as UserRoleType[]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recordId = parseInt(req.params.id);
    const validated = resolveAnomalySchema.parse(req.body);
    const ipAddress = req.ip;

    const result = await disinfectionService.resolveAnomaly({
      recordId,
      ...validated,
      handledById: req.user!.id,
      ipAddress,
    });

    res.json({
      message: '异常处理成功',
      record: result.record,
      syncResult: result.syncResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: '参数错误', details: error.errors });
      return;
    }
    res.status(500).json({ error: '异常处理失败', message: (error as Error).message });
  }
});

router.post('/manual', authenticate, requireAnyRole(['SUPERVISOR', 'ADMIN', 'RECEPTION'] as UserRoleType[]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = manualEntrySchema.parse(req.body);
    const ipAddress = req.ip;

    const record = await disinfectionService.manualEntry({
      ...validated,
      userId: req.user!.id,
      ipAddress,
    });

    res.json({
      message: '手工补录成功',
      record,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: '参数错误', details: error.errors });
      return;
    }
    res.status(500).json({ error: '手工补录失败', message: (error as Error).message });
  }
});

router.post('/cross-class', authenticate, requireAnyRole(['SUPERVISOR', 'ADMIN'] as UserRoleType[]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = crossClassSchema.parse(req.body);
    const ipAddress = req.ip;

    const result = await disinfectionService.processCrossClassBaby(
      validated.babyId,
      validated.sourceClassId,
      validated.targetClassIds,
      req.user!.id,
      ipAddress
    );

    res.json({
      message: result.success ? '跨班处理成功' : result.partialSuccess ? '跨班部分成功' : '跨班处理失败',
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: '参数错误', details: error.errors });
      return;
    }
    res.status(500).json({ error: '跨班处理失败', message: (error as Error).message });
  }
});

router.get('/class/:classId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classId = parseInt(req.params.classId);
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await disinfectionService.getClassRecords(
      classId,
      req.user!.role,
      status,
      page,
      pageSize
    );

    await auditService.logView(
      req.user!.id,
      'ClassRecords',
      classId,
      undefined,
      classId,
      req.ip
    );

    res.json({
      ...result,
      page,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ error: '获取班级记录失败', message: (error as Error).message });
  }
});

router.get('/baby/:babyId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const babyId = parseInt(req.params.babyId);
    const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await disinfectionService.getBabyRecords(
      babyId,
      req.user!.role,
      classId,
      page,
      pageSize
    );

    await auditService.logView(
      req.user!.id,
      'BabyRecords',
      babyId,
      babyId,
      classId,
      req.ip
    );

    res.json({
      ...result,
      page,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ error: '获取宝宝记录失败', message: (error as Error).message });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recordId = parseInt(req.params.id);
    const record = await disinfectionService.getRecordWithPrivacy(
      recordId,
      req.user!.role,
      'json'
    );

    if (!record) {
      res.status(404).json({ error: '记录不存在' });
      return;
    }

    await auditService.logView(
      req.user!.id,
      'DisinfectionRecord',
      recordId,
      record.babyId,
      record.classId,
      req.ip
    );

    res.json({ record });
  } catch (error) {
    res.status(500).json({ error: '获取记录失败', message: (error as Error).message });
  }
});

export default router;
