import type { Request, Response, NextFunction } from 'express';
import type { User, UserRole } from '../../shared/types.js';

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

const MOCK_USERS: Record<string, User> = {
  u_disinfector: { id: 'u_disinfector', name: '张消毒', role: 'disinfector' },
  u_teacher: { id: 'u_teacher', name: '李老师', role: 'teacher' },
  u_supervisor: { id: 'u_supervisor', name: '王主管', role: 'supervisor' },
  u_admin: { id: 'u_admin', name: '赵管理员', role: 'admin' },
};

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.header('X-User-Id') || 'u_supervisor';
  req.currentUser = MOCK_USERS[userId] || MOCK_USERS.u_disinfector;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      res.status(401).json({ error: '未登录' });
      return;
    }
    if (!roles.includes(req.currentUser.role)) {
      res.status(403).json({ error: '权限不足' });
      return;
    }
    next();
  };
}
