import { type Request, type Response, type NextFunction } from "express";
import { getSessionUser } from "../services/authService.js";
import type { SessionUser, UserRole } from "../types.js";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser | null;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const sessionId = req.cookies?.session_id;
  req.user = getSessionUser(sessionId);
  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    if (req.headers["hx-request"]) {
      res.setHeader("HX-Redirect", "/login");
      res.sendStatus(401);
    } else {
      res.redirect("/login");
    }
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      if (req.headers["hx-request"]) {
        res.sendStatus(403);
      } else {
        res.status(403).send("Forbidden");
      }
      return;
    }
    next();
  };
}
