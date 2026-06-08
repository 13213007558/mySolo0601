import { PrismaClient, DisinfectionRecord } from '@prisma/client';
import { logger } from '../utils/logger';
import { syncService } from './syncService';
import { auditService } from './auditService';
import { privacyService } from './privacyService';
import { UserRoleType } from '../config';

const prisma = new PrismaClient();

interface ScanRecordParams {
  barcode: string;
  babyId: number;
  classId: number;
  action: 'borrow' | 'return';
  userId: number;
  scanResult?: string;
  ipAddress?: string;
}

interface ResolveAnomalyParams {
  recordId: number;
  anomalyType: string;
  description: string;
  resolution: string;
  handledById: number;
  partialSuccess?: boolean;
  ipAddress?: string;
}

interface ManualEntryParams {
  itemId: number;
  babyId: number;
  classId: number;
  borrowTime: Date;
  returnTime: Date;
  scanResult: string;
  userId: number;
  note: string;
  ipAddress?: string;
}

interface CrossClassProcessResult {
  success: boolean;
  partialSuccess: boolean;
  processedClasses: number[];
  failedClasses: { classId: number; reason: string }[];
  recordId?: number;
}

class DisinfectionService {
  async scanRecord(params: ScanRecordParams): Promise<DisinfectionRecord> {
    const { barcode, babyId, classId, action, userId, scanResult, ipAddress } = params;

    const item = await prisma.disinfectionItem.findUnique({ where: { barcode } });
    if (!item) {
      throw new Error('物品不存在');
    }

    const baby = await prisma.baby.findUnique({ where: { id: babyId } });
    if (!baby) {
      throw new Error('宝宝不存在');
    }

    const enrollment = await prisma.classEnrollment.findUnique({
      where: { babyId_classId: { babyId, classId } },
    });
    if (!enrollment) {
      throw new Error('宝宝未报名该班级');
    }

    let record: DisinfectionRecord | null;

    if (action === 'borrow') {
      record = await prisma.disinfectionRecord.create({
        data: {
          itemId: item.id,
          babyId,
          classId,
          borrowTime: new Date(),
          status: 'PENDING',
          createdById: userId,
          scanResult,
        },
      });
      logger.info('物品借出', { recordId: record.id, item: item.name, babyId, classId });
    } else {
      record = await prisma.disinfectionRecord.findFirst({
        where: {
          itemId: item.id,
          babyId,
          classId,
          returnTime: null,
          borrowTime: { not: null },
        },
        orderBy: { borrowTime: 'desc' },
      });

      if (!record) {
        throw new Error('未找到待归还记录');
      }

      const isAbnormal = scanResult && scanResult.includes('异常');
      const status = isAbnormal ? 'ABNORMAL' : 'NORMAL';

      record = await prisma.disinfectionRecord.update({
        where: { id: record.id },
        data: {
          returnTime: new Date(),
          status,
          scanResult,
          handledById: isAbnormal ? userId : null,
        },
      });

      if (isAbnormal) {
        logger.warn('归还异常', { recordId: record.id, scanResult });
      } else {
        logger.info('物品归还正常', { recordId: record.id, item: item.name });
      }
    }

    await syncService.initSyncStatus(record.id);

    return record;
  }

  async resolveAnomaly(params: ResolveAnomalyParams): Promise<{
    record: any;
    syncResult: any;
  }> {
    const { recordId, anomalyType, description, resolution, handledById, partialSuccess = false, ipAddress } = params;

    const record = await prisma.disinfectionRecord.findUnique({
      where: { id: recordId },
      include: { baby: true, class: true },
    });

    if (!record) {
      throw new Error('记录不存在');
    }

    if (record.status !== 'ABNORMAL') {
      throw new Error('该记录无异常');
    }

    const updatedRecord = await prisma.$transaction(async (tx) => {
      const anomaly = await tx.anomalyResolution.create({
        data: {
          recordId,
          anomalyType,
          description,
          resolution,
          handledById,
          partialSuccess,
        },
      });

      const updated = await tx.disinfectionRecord.update({
        where: { id: recordId },
        data: {
          status: partialSuccess ? 'PARTIAL_SUCCESS' : 'RESOLVED',
          handledById,
        },
        include: {
          anomaly: true,
          handledBy: true,
          baby: true,
          class: true,
          item: true,
        },
      });

      return updated;
    });

    const syncResult = await syncService.syncAll(recordId);

    await auditService.logModify(
      handledById,
      'DisinfectionRecord',
      recordId,
      record.babyId,
      record.classId,
      `异常处理: ${anomalyType} - ${resolution}`,
      ipAddress
    );

    logger.info('异常已处理', {
      recordId,
      handledById,
      partialSuccess,
      syncResult,
    });

    return { record: updatedRecord, syncResult };
  }

  async manualEntry(params: ManualEntryParams): Promise<DisinfectionRecord> {
    const { itemId, babyId, classId, borrowTime, returnTime, scanResult, userId, note, ipAddress } = params;

    const record = await prisma.disinfectionRecord.create({
      data: {
        itemId,
        babyId,
        classId,
        borrowTime,
        returnTime,
        status: 'RESOLVED',
        scanResult: `补录-${scanResult}`,
        createdById: userId,
        handledById: userId,
        isManualEntry: true,
        manualEntryNote: note,
      },
      include: {
        baby: true,
        class: true,
        item: true,
        handledBy: true,
      },
    });

    await syncService.initSyncStatus(record.id);
    await syncService.markAllSynced(record.id);

    await auditService.logManualEntry(
      userId,
      record.id,
      babyId,
      classId,
      note,
      ipAddress
    );

    logger.info('手工补录记录', { recordId: record.id, userId, note });

    return record;
  }

  async processCrossClassBaby(
    babyId: number,
    sourceClassId: number,
    targetClassIds: number[],
    userId: number,
    ipAddress?: string
  ): Promise<CrossClassProcessResult> {
    const result: CrossClassProcessResult = {
      success: false,
      partialSuccess: false,
      processedClasses: [],
      failedClasses: [],
    };

    const baby = await prisma.baby.findUnique({
      where: { id: babyId },
      include: { enrollments: true },
    });

    if (!baby) {
      throw new Error('宝宝不存在');
    }

    const enrolledClassIds = baby.enrollments.map((e) => e.classId);

    for (const targetClassId of targetClassIds) {
      if (!enrolledClassIds.includes(targetClassId)) {
        result.failedClasses.push({
          classId: targetClassId,
          reason: '宝宝未报名该班级',
        });
        continue;
      }

      try {
        const pendingRecord = await prisma.disinfectionRecord.findFirst({
          where: {
            babyId,
            classId: sourceClassId,
            status: 'ABNORMAL',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (pendingRecord) {
          await prisma.disinfectionRecord.create({
            data: {
              itemId: pendingRecord.itemId,
              babyId,
              classId: targetClassId,
              borrowTime: pendingRecord.borrowTime,
              returnTime: pendingRecord.returnTime,
              status: 'RESOLVED',
              scanResult: `跨班同步-${pendingRecord.scanResult}`,
              createdById: userId,
              handledById: userId,
            },
          });
          result.processedClasses.push(targetClassId);
        }
      } catch (error) {
        result.failedClasses.push({
          classId: targetClassId,
          reason: (error as Error).message,
        });
      }
    }

    result.success = result.failedClasses.length === 0;
    result.partialSuccess = result.processedClasses.length > 0 && !result.success;

    if (result.processedClasses.length > 0) {
      for (const classId of result.processedClasses) {
        await auditService.logCrossClassProcess(
          userId,
          babyId,
          sourceClassId,
          classId,
          result.partialSuccess,
          ipAddress
        );
      }
    }

    logger.info('跨班处理完成', {
      babyId,
      processed: result.processedClasses.length,
      failed: result.failedClasses.length,
      partialSuccess: result.partialSuccess,
    });

    return result;
  }

  async getRecordWithPrivacy(
    recordId: number,
    userRole: UserRoleType,
    context: 'json' | 'export' | 'page' = 'json'
  ): Promise<any> {
    const record = await prisma.disinfectionRecord.findUnique({
      where: { id: recordId },
      include: {
        baby: true,
        class: true,
        item: true,
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        handledBy: {
          select: { id: true, name: true, role: true },
        },
        anomaly: {
          include: {
            handledBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        syncStatus: true,
      },
    });

    if (!record) return null;

    const processedBaby = privacyService.processBabyData(
      record.baby as unknown as Record<string, unknown>,
      userRole,
      context
    );

    return {
      ...record,
      baby: processedBaby,
      handledBy: record.handledBy
        ? {
            id: record.handledBy.id,
            name: record.handledBy.name,
            role: record.handledBy.role,
          }
        : null,
    };
  }

  async getClassRecords(
    classId: number,
    userRole: UserRoleType,
    status?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ records: any[]; total: number }> {
    const where: any = { classId };
    if (status) where.status = status;

    const [records, total] = await Promise.all([
      prisma.disinfectionRecord.findMany({
        where,
        include: {
          baby: true,
          item: true,
          handledBy: {
            select: { id: true, name: true, role: true },
          },
          anomaly: true,
          syncStatus: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.disinfectionRecord.count({ where }),
    ]);

    const processedRecords = records.map((record) => ({
      ...record,
      baby: privacyService.processBabyData(
        record.baby as unknown as Record<string, unknown>,
        userRole,
        'page'
      ),
    }));

    return { records: processedRecords, total };
  }

  async getBabyRecords(
    babyId: number,
    userRole: UserRoleType,
    classId?: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ records: any[]; total: number; baby: any }> {
    const where: any = { babyId };
    if (classId) where.classId = classId;

    const [baby, records, total] = await Promise.all([
      prisma.baby.findUnique({ where: { id: babyId } }),
      prisma.disinfectionRecord.findMany({
        where,
        include: {
          class: true,
          item: true,
          handledBy: {
            select: { id: true, name: true, role: true },
          },
          anomaly: {
            include: {
              handledBy: {
                select: { id: true, name: true, role: true },
              },
            },
          },
          syncStatus: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.disinfectionRecord.count({ where }),
    ]);

    if (!baby) {
      throw new Error('宝宝不存在');
    }

    const processedBaby = privacyService.processBabyData(
      baby as unknown as Record<string, unknown>,
      userRole,
      'page'
    );

    const processedRecords = records.map((record) => ({
      ...record,
      baby: processedBaby,
    }));

    return { records: processedRecords, total, baby: processedBaby };
  }

  async getRecordsForExport(
    filters: {
      classId?: number;
      babyId?: number;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    },
    userRole: UserRoleType
  ): Promise<any[]> {
    const where: any = {};

    if (filters.classId) where.classId = filters.classId;
    if (filters.babyId) where.babyId = filters.babyId;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const records = await prisma.disinfectionRecord.findMany({
      where,
      include: {
        baby: true,
        class: true,
        item: true,
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        handledBy: {
          select: { id: true, name: true, role: true },
        },
        anomaly: {
          include: {
            handledBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => {
      const processed = {
        ...record,
        baby: privacyService.processBabyData(
          record.baby as unknown as Record<string, unknown>,
          userRole,
          'export'
        ),
      };
      return processed;
    });
  }
}

export const disinfectionService = new DisinfectionService();
