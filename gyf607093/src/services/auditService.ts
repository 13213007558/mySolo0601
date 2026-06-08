import { PrismaClient } from '@prisma/client';
import { auditLogger } from '../utils/logger';
import { UserRoleType } from '../config';

const prisma = new PrismaClient();

interface AuditLogOptions {
  userId: number;
  action: string;
  targetType: string;
  targetId?: number;
  babyId?: number;
  classId?: number;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  isUnauthorized?: boolean;
}

class AuditService {
  async log(options: AuditLogOptions): Promise<void> {
    const {
      userId,
      action,
      targetType,
      targetId,
      babyId,
      classId,
      ipAddress,
      userAgent,
      details,
      isUnauthorized = false,
    } = options;

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          targetType,
          targetId,
          babyId,
          classId,
          ipAddress,
          userAgent,
          details,
          isUnauthorized,
        },
      });

      const logMessage = `[${action}] ${targetType}` +
        (targetId ? ` #${targetId}` : '') +
        (babyId ? ` (Baby: ${babyId})` : '') +
        (classId ? ` (Class: ${classId})` : '') +
        (details ? ` - ${details}` : '');

      if (isUnauthorized) {
        auditLogger.warn(logMessage, { userId, ipAddress, unauthorized: true });
      } else {
        auditLogger.info(logMessage, { userId, ipAddress });
      }
    } catch (error) {
      auditLogger.error('记录审计日志失败', { error, ...options });
    }
  }

  async logUnauthorizedAccess(
    userId: number,
    targetType: string,
    targetId: number,
    userRole: UserRoleType,
    requiredRole: UserRoleType,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'UNAUTHORIZED_ACCESS',
      targetType,
      targetId,
      ipAddress,
      userAgent,
      details: `角色 ${userRole} 尝试访问需要 ${requiredRole} 权限的资源`,
      isUnauthorized: true,
    });
  }

  async logCrossClassProcess(
    userId: number,
    babyId: number,
    sourceClassId: number,
    targetClassId: number,
    partialSuccess: boolean,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'CROSS_CLASS_PROCESS',
      targetType: 'Baby',
      targetId: babyId,
      babyId,
      classId: targetClassId,
      ipAddress,
      details: `跨班处理: 从班级 ${sourceClassId} 到 ${targetClassId}, 部分成功: ${partialSuccess}`,
    });
  }

  async logManualEntry(
    userId: number,
    recordId: number,
    babyId: number,
    classId: number,
    note: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'MANUAL_ENTRY',
      targetType: 'DisinfectionRecord',
      targetId: recordId,
      babyId,
      classId,
      ipAddress,
      details: `手工补录: ${note}`,
    });
  }

  async logView(
    userId: number,
    targetType: string,
    targetId: number,
    babyId?: number,
    classId?: number,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'VIEW',
      targetType,
      targetId,
      babyId,
      classId,
      ipAddress,
    });
  }

  async logModify(
    userId: number,
    targetType: string,
    targetId: number,
    babyId?: number,
    classId?: number,
    changes?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'MODIFY',
      targetType,
      targetId,
      babyId,
      classId,
      ipAddress,
      details: changes,
    });
  }

  async logExport(
    userId: number,
    exportType: string,
    filters?: string,
    recordCount?: number,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'EXPORT',
      targetType: exportType,
      ipAddress,
      details: `导出 ${recordCount || 0} 条记录, 过滤条件: ${filters || '无'}`,
    });
  }

  async getAuditLogs(
    filters: {
      userId?: number;
      action?: string;
      targetType?: string;
      babyId?: number;
      startDate?: Date;
      endDate?: Date;
      isUnauthorized?: boolean;
    },
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ logs: any[]; total: number }> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.babyId) where.babyId = filters.babyId;
    if (filters.isUnauthorized !== undefined) where.isUnauthorized = filters.isUnauthorized;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async getUnauthorizedAccessLogs(
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ logs: any[]; total: number }> {
    return this.getAuditLogs(
      {
        action: 'UNAUTHORIZED_ACCESS',
        isUnauthorized: true,
        startDate,
        endDate,
      },
      page,
      pageSize
    );
  }
}

export const auditService = new AuditService();
