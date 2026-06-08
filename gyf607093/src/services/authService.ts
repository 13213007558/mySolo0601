import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface LoginResult {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResult | null> {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      logger.warn('登录失败: 用户不存在', { username });
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      logger.warn('登录失败: 密码错误', { username, userId: user.id });
      return null;
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      config.jwtSecret as string,
      { expiresIn: config.jwtExpiresIn } as any
    );

    logger.info('用户登录成功', { userId: user.id, username: user.username, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }

  async getUserById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) return false;

    const newPasswordHash = await bcrypt.hash(newPassword, config.saltRounds);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    logger.info('用户修改密码成功', { userId });
    return true;
  }
}

export const authService = new AuthService();
