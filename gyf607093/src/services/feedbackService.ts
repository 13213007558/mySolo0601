import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { privacyService } from './privacyService';
import { UserRoleType } from '../config';

const prisma = new PrismaClient();

interface CreateFeedbackParams {
  babyId: number;
  courseId?: number;
  content: string;
  source: string;
  createdById: number;
}

interface FeedbackWithVersion {
  id: number;
  babyId: number;
  courseId?: number;
  content: string;
  source: string;
  createdBy: {
    id: number;
    name: string;
    role: string;
  };
  version: number;
  isLatest: boolean;
  createdAt: Date;
  updatedAt: Date;
  baby?: any;
}

class FeedbackService {
  async createFeedback(params: CreateFeedbackParams): Promise<FeedbackWithVersion> {
    const { babyId, courseId, content, source, createdById } = params;

    const baby = await prisma.baby.findUnique({ where: { id: babyId } });
    if (!baby) {
      throw new Error('宝宝不存在');
    }

    const latestFeedback = await prisma.feedback.findFirst({
      where: {
        babyId,
        courseId: courseId || null,
        isLatest: true,
      },
      orderBy: { version: 'desc' },
    });

    const newVersion = latestFeedback ? latestFeedback.version + 1 : 1;

    const result = await prisma.$transaction(async (tx) => {
      if (latestFeedback) {
        await tx.feedback.update({
          where: { id: latestFeedback.id },
          data: { isLatest: false },
        });
      }

      const feedback = await tx.feedback.create({
        data: {
          babyId,
          courseId,
          content,
          source,
          createdById,
          version: newVersion,
          isLatest: true,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return feedback;
    });

    logger.info('课后反馈已创建', {
      feedbackId: result.id,
      babyId,
      courseId,
      version: newVersion,
      source,
    });

    return {
      ...result,
      courseId: result.courseId || undefined,
    };
  }

  async getLatestFeedback(
    babyId: number,
    courseId?: number,
    userRole?: UserRoleType
  ): Promise<FeedbackWithVersion | null> {
    const feedback = await prisma.feedback.findFirst({
      where: {
        babyId,
        courseId: courseId || null,
        isLatest: true,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        baby: true,
      },
    });

    if (!feedback) return null;

    const result: FeedbackWithVersion = {
      id: feedback.id,
      babyId: feedback.babyId,
      courseId: feedback.courseId || undefined,
      content: feedback.content,
      source: feedback.source,
      createdBy: feedback.createdBy,
      version: feedback.version,
      isLatest: feedback.isLatest,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    };

    if (userRole && feedback.baby) {
      result.baby = privacyService.processBabyData(
        feedback.baby as unknown as Record<string, unknown>,
        userRole,
        'json'
      );
    }

    return result;
  }

  async getFeedbackVersion(
    babyId: number,
    version: number,
    courseId?: number
  ): Promise<FeedbackWithVersion | null> {
    const feedback = await prisma.feedback.findFirst({
      where: {
        babyId,
        courseId: courseId || null,
        version,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!feedback) return null;

    return {
      ...feedback,
      courseId: feedback.courseId || undefined,
    };
  }

  async getFeedbackHistory(
    babyId: number,
    courseId?: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ feedbacks: FeedbackWithVersion[]; total: number; latestVersion: number }> {
    const where: any = { babyId };
    if (courseId) where.courseId = courseId;

    const [feedbacks, total, latest] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { version: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.feedback.count({ where }),
      prisma.feedback.findFirst({
        where: { ...where, isLatest: true },
        select: { version: true },
      }),
    ]);

    return {
      feedbacks: feedbacks.map((f) => ({
        ...f,
        courseId: f.courseId || undefined,
      })),
      total,
      latestVersion: latest?.version || 0,
    };
  }

  async getBabyAllFeedbacks(
    babyId: number,
    userRole: UserRoleType,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ feedbacks: FeedbackWithVersion[]; total: number; baby: any }> {
    const [baby, feedbacks, total] = await Promise.all([
      prisma.baby.findUnique({ where: { id: babyId } }),
      prisma.feedback.findMany({
        where: { babyId, isLatest: true },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          course: {
            include: {
              class: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.feedback.count({ where: { babyId, isLatest: true } }),
    ]);

    if (!baby) {
      throw new Error('宝宝不存在');
    }

    const processedBaby = privacyService.processBabyData(
      baby as unknown as Record<string, unknown>,
      userRole,
      'page'
    );

    return {
      feedbacks: feedbacks.map((f) => ({
        ...f,
        courseId: f.courseId || undefined,
        baby: processedBaby,
      })),
      total,
      baby: processedBaby,
    };
  }

  async compareVersions(
    babyId: number,
    version1: number,
    version2: number,
    courseId?: number
  ): Promise<{ v1: FeedbackWithVersion | null; v2: FeedbackWithVersion | null; diff: string[] }> {
    const [f1, f2] = await Promise.all([
      this.getFeedbackVersion(babyId, version1, courseId),
      this.getFeedbackVersion(babyId, version2, courseId),
    ]);

    const diff: string[] = [];

    if (f1 && f2) {
      if (f1.content !== f2.content) {
        diff.push('内容已变更');
      }
      if (f1.source !== f2.source) {
        diff.push(`来源变更: ${f1.source} -> ${f2.source}`);
      }
      if (f1.createdBy.id !== f2.createdBy.id) {
        diff.push(`创建人变更: ${f1.createdBy.name} -> ${f2.createdBy.name}`);
      }
      diff.push(`版本差异: v${version1} -> v${version2}`);
    }

    return { v1: f1, v2: f2, diff };
  }

  async updateFeedback(
    feedbackId: number,
    content: string,
    updatedById: number
  ): Promise<FeedbackWithVersion> {
    const existing = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: { createdBy: true },
    });

    if (!existing) {
      throw new Error('反馈不存在');
    }

    if (!existing.isLatest) {
      throw new Error('只能修改最新版本的反馈');
    }

    return this.createFeedback({
      babyId: existing.babyId,
      courseId: existing.courseId || undefined,
      content,
      source: existing.source,
      createdById: updatedById,
    });
  }
}

export const feedbackService = new FeedbackService();
