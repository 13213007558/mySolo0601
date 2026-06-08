import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, UserRoleType, canAccessRole } from '../config';
import { auditService } from '../services/auditService';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    name: string;
    role: UserRoleType;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name,
      role: decoded.role,
    };
    next();
  } catch (error) {
    logger.warn('认证令牌无效', { error: (error as Error).message });
    res.status(401).json({ error: '认证令牌无效或已过期' });
  }
};

export const requireRole = (requiredRole: UserRoleType) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }

    if (!canAccessRole(req.user.role, requiredRole)) {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await auditService.logUnauthorizedAccess(
        req.user.id,
        req.path,
        parseInt(req.params.id || '0'),
        req.user.role,
        requiredRole,
        ipAddress,
        userAgent
      );

      res.status(403).json({
        error: '权限不足',
        message: `您的角色(${req.user.role})无法访问此资源，需要${requiredRole}权限`,
      });
      return;
    }

    next();
  };
};

export const requireAnyRole = (requiredRoles: UserRoleType[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: '未登录' });
      return;
    }

    const hasPermission = requiredRoles.some((role) => canAccessRole(req.user!.role, role));

    if (!hasPermission) {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await auditService.logUnauthorizedAccess(
        req.user.id,
        req.path,
        parseInt(req.params.id || '0'),
        req.user.role,
        requiredRoles[0],
        ipAddress,
        userAgent
      );

      res.status(403).json({
        error: '权限不足',
        message: `您的角色(${req.user.role})无法访问此资源，需要以下任一权限: ${requiredRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
