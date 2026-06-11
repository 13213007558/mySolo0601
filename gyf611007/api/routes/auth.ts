import { Router, type Request, type Response } from "express";
import { findUserByUsername, verifyPassword } from "../repositories/userRepository.js";
import { createSession, destroySession } from "../services/authService.js";

const router = Router();

router.post("/login", (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).send(`
      <div id="login-error" class="text-copper-400 text-sm mb-4">
        请输入用户名和密码
      </div>
    `);
    return;
  }

  const user = findUserByUsername(username as string);
  if (!user || !verifyPassword(user, password as string)) {
    res.status(401).send(`
      <div id="login-error" class="text-copper-400 text-sm mb-4">
        用户名或密码错误
      </div>
    `);
    return;
  }

  const sessionId = createSession(user.id);
  res.cookie("session_id", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.setHeader("HX-Redirect", "/dashboard");
  res.sendStatus(200);
});

router.post("/logout", (req: Request, res: Response): void => {
  const sessionId = req.cookies?.session_id;
  if (sessionId) {
    destroySession(sessionId);
  }
  res.clearCookie("session_id");
  res.setHeader("HX-Redirect", "/login");
  res.sendStatus(200);
});

export default router;
