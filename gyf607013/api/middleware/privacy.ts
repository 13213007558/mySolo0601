import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../../src/types/index.js';
import { desensitizeObject } from '../services/privacyService.js';

declare global {
  namespace Express {
    interface Response {
      desensitizedJson?: (data: unknown) => Response;
    }
  }
}

export function privacyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const originalJson = res.json.bind(res);
  const role: UserRole = (req.userRole as UserRole) || 'staff';

  res.json = function (data: unknown): Response {
    if (data && typeof data === 'object' && 'success' in (data as Record<string, unknown>)) {
      const obj = data as Record<string, unknown>;
      if ('data' in obj) {
        obj.data = desensitizeObject(obj.data, role);
      }
      return originalJson(obj);
    }
    const desensitized = desensitizeObject(data, role);
    return originalJson(desensitized);
  };

  res.desensitizedJson = function (data: unknown): Response {
    const desensitized = desensitizeObject(data, role);
    return originalJson(desensitized);
  };

  next();
}

export function desensitizeResponse(
  req: Request,
  data: unknown,
): unknown {
  const role: UserRole = (req.userRole as UserRole) || 'staff';
  return desensitizeObject(data, role);
}
