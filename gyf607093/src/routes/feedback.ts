import { Router, Response } from 'express';
import { z } from 'zod';
import { feedbackService } from '../services/feedbackService';
import { authenticate, AuthRequest, requireAnyRole } from '../middleware/auth';
import { UserRoleType } from '../config';

const router = Router();

const createFeedbackSchema = z.object({
  babyId: z.number().int().positive(),
  courseId: z.number().int().positive().optional(),
  content: z.string().min(1, '反馈内容不能为空'),
  source: z.enum(['THERAPIST', 'RECEPTION', 'SUPERVISOR']),
});

router.post('/', authenticate, requireAnyRole(['THERAPIST', 'SUPERVISOR', 'ADMIN'] as UserRoleType[]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = createFeedbackSchema.parse(req.body);

    const feedback = await feedbackService.createFeedback({
      ...validated,
      createdById: req.user!.id,
    });

    res.json({
      message: '反馈创建成功',
      feedback,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: '参数错误', details: error.errors });
      return;
    }
    res.status(500).json({ error: '创建反馈失败', message: (error as Error).message });
  }
});

router.get('/baby/:babyId/latest', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const babyId = parseInt(req.params.babyId);
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;

    const feedback = await feedbackService.getLatestFeedback(
      babyId,
      courseId,
      req.user!.role
    );

    if (!feedback) {
      res.status(404).json({ error: '暂无反馈' });
      return;
    }

    res.json({ feedback });
  } catch (error) {
    res.status(500).json({ error: '获取反馈失败', message: (error as Error).message });
  }
});

router.get('/baby/:babyId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const babyId = parseInt(req.params.babyId);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await feedbackService.getBabyAllFeedbacks(
      babyId,
      req.user!.role,
      page,
      pageSize
    );

    res.json({
      ...result,
      page,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ error: '获取宝宝反馈失败', message: (error as Error).message });
  }
});

router.get('/baby/:babyId/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const babyId = parseInt(req.params.babyId);
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await feedbackService.getFeedbackHistory(
      babyId,
      courseId,
      page,
      pageSize
    );

    res.json({
      ...result,
      page,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ error: '获取反馈历史失败', message: (error as Error).message });
  }
});

router.get('/baby/:babyId/compare', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const babyId = parseInt(req.params.babyId);
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    const v1 = parseInt(req.query.v1 as string);
    const v2 = parseInt(req.query.v2 as string);

    if (!v1 || !v2) {
      res.status(400).json({ error: '请指定两个版本号 v1 和 v2' });
      return;
    }

    const result = await feedbackService.compareVersions(
      babyId,
      v1,
      v2,
      courseId
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '版本对比失败', message: (error as Error).message });
  }
});

router.put('/:id', authenticate, requireAnyRole(['THERAPIST', 'SUPERVISOR', 'ADMIN'] as UserRoleType[]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feedbackId = parseInt(req.params.id);
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);

    const feedback = await feedbackService.updateFeedback(
      feedbackId,
      content,
      req.user!.id
    );

    res.json({
      message: '反馈更新成功（已创建新版本）',
      feedback,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: '参数错误', details: error.errors });
      return;
    }
    res.status(500).json({ error: '更新反馈失败', message: (error as Error).message });
  }
});

export default router;
