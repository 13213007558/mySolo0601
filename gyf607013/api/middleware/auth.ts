import type { Request, Response, NextFunction } from 'express';
import type { UserRole, User } from '../../src/types/index.js';
import { mockDb } from '../db/mockDb.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userRole?: UserRole;
      userId?: string;
    }
  }
}

const VALID_ROLES: UserRole[] = ['staff', 'nurse', 'supervisor'];

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const role = req.header('x-user-role') as UserRole | undefined;
  const userId = req.header('x-user-id');

  if (!role) {
    res.status(401).json({
      success: false,
      error: '缺少x-user-role请求头',
    });
    return;
  }

  if (!VALID_ROLES.includes(role)) {
    res.status(401).json({
      success: false,
      error: `无效的角色: ${role}，有效角色为: ${VALID_ROLES.join(', ')}`,
    });
    return;
  }

  let user: User | undefined;
  if (userId) {
    user = mockDb.findUserById(userId);
  }

  if (!user) {
    const users = mockDb.getUsers().filter((u) => u.role === role);
    user = users.length > 0 ? users[0] : mockDb.getUsers()[0];
  }

  req.user = user;
  req.userRole = role;
  req.userId = user?.id;

  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        error: `权限不足，需要角色: ${roles.join(', ')}`,
      });
      return;
    }
    next();
  };
}

export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const role = req.header('x-user-role') as UserRole | undefined;
  const userId = req.header('x-user-id');

  if (role && VALID_ROLES.includes(role)) {
    let user: User | undefined;
    if (userId) {
      user = mockDb.findUserById(userId);
    }
    if (!user) {
      const users = mockDb.getUsers().filter((u) => u.role === role);
      user = users.length > 0 ? users[0] : mockDb.getUsers()[0];
    }
    req.user = user;
    req.userRole = role;
    req.userId = user?.id;
  }

  next();
}
