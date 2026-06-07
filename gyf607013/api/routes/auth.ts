import { Router, type Request, type Response } from 'express';
import type { UserRole } from '../../src/types/index.js';
import { mockDb } from '../db/mockDb.js';

const router = Router();

function generateToken(userId: string, role: UserRole): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, role, ts: Date.now() }),
  ).toString('base64');
  return `mock.${payload}.signature`;
}

router.post('/login', (req: Request, res: Response): void => {
  const { userId, username, role } = req.body as {
    userId?: string;
    username?: string;
    role?: UserRole;
  };

  let user;

  if (userId) {
    user = mockDb.findUserById(userId);
  } else if (username) {
    user = mockDb.findUserByName(username);
  } else if (role) {
    const users = mockDb.getUsers().filter((u) => u.role === role);
    user = users.length > 0 ? users[0] : undefined;
  }

  if (!user) {
    user = mockDb.getUsers()[0];
  }

  req.user = user;
  req.userRole = user.role;
  req.userId = user.id;

  const token = generateToken(user.id, user.role);

  res.status(200).json({
    success: true,
    data: {
      user,
      token,
    },
  });
});

router.post('/register', (req: Request, res: Response): void => {
  res.status(501).json({
    success: false,
    error: '注册功能暂未实现',
  });
});

router.post('/logout', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: '已登出',
  });
});

router.get('/me', (req: Request, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({
      success: false,
      error: '未登录',
    });
    return;
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

export default router;
