import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(6, '密码至少6位'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.login(validated.username, validated.password);

    if (!result) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    res.json({
      message: '登录成功',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: '参数错误', details: error.errors });
      return;
    }
    res.status(500).json({ error: '登录失败', message: (error as Error).message });
  }
});

router.post('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = changePasswordSchema.parse(req.body);
    const success = await authService.changePassword(
      req.user!.id,
      validated.oldPassword,
      validated.newPassword
    );

    if (!success) {
      res.status(400).json({ error: '原密码错误' });
      return;
    }

    res.json({ message: '密码修改成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: '参数错误', details: error.errors });
      return;
    }
    res.status(500).json({ error: '密码修改失败', message: (error as Error).message });
  }
});

router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  res.json({
    user: req.user,
  });
});

export default router;
