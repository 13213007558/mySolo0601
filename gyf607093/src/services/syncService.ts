import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config';

const prisma = new PrismaClient();

interface SyncResult {
  classPageSynced: boolean;
  babyDetailSynced: boolean;
  backendSynced: boolean;
  exportSynced: boolean;
}

class SyncService {
  async initSyncStatus(recordId: number): Promise<void> {
    await prisma.syncStatus.upsert({
      where: { recordId },
      update: {},
      create: {
        recordId,
        classPageSynced: false,
        babyDetailSynced: false,
        backendSynced: false,
        exportSynced: false,
      },
    });
  }

  async markAllSynced(recordId: number): Promise<void> {
    await prisma.syncStatus.update({
      where: { recordId },
      data: {
        classPageSynced: true,
        babyDetailSynced: true,
        backendSynced: true,
        exportSynced: true,
        lastSyncAt: new Date(),
      },
    });
    logger.info('记录已同步到所有终端', { recordId });
  }

  async markClassPageSynced(recordId: number): Promise<void> {
    await prisma.syncStatus.update({
      where: { recordId },
      data: {
        classPageSynced: true,
        lastSyncAt: new Date(),
      },
    });
  }

  async markBabyDetailSynced(recordId: number): Promise<void> {
    await prisma.syncStatus.update({
      where: { recordId },
      data: {
        babyDetailSynced: true,
        lastSyncAt: new Date(),
      },
    });
  }

  async markBackendSynced(recordId: number): Promise<void> {
    await prisma.syncStatus.update({
      where: { recordId },
      data: {
        backendSynced: true,
        lastSyncAt: new Date(),
      },
    });
  }

  async markExportSynced(recordId: number): Promise<void> {
    await prisma.syncStatus.update({
      where: { recordId },
      data: {
        exportSynced: true,
        lastSyncAt: new Date(),
      },
    });
  }

  async getSyncStatus(recordId: number): Promise<any | null> {
    return prisma.syncStatus.findUnique({
      where: { recordId },
    });
  }

  async syncAll(recordId: number): Promise<SyncResult> {
    const result: SyncResult = {
      classPageSynced: false,
      babyDetailSynced: false,
      backendSynced: false,
      exportSynced: false,
    };

    const record = await prisma.disinfectionRecord.findUnique({
      where: { id: recordId },
      include: {
        anomaly: true,
        handledBy: true,
      },
    });

    if (!record) {
      logger.error('同步失败：记录不存在', { recordId });
      return result;
    }

    try {
      await this.syncClassPage(recordId);
      result.classPageSynced = true;
    } catch (error) {
      logger.error('同步班级页失败', { recordId, error: (error as Error).message });
    }

    try {
      await this.syncBabyDetail(recordId);
      result.babyDetailSynced = true;
    } catch (error) {
      logger.error('同步宝宝详情失败', { recordId, error: (error as Error).message });
    }

    try {
      await this.syncBackend(recordId);
      result.backendSynced = true;
    } catch (error) {
      logger.error('同步后台接口失败', { recordId, error: (error as Error).message });
    }

    try {
      await this.syncExport(recordId);
      result.exportSynced = true;
    } catch (error) {
      logger.error('同步导出清单失败', { recordId, error: (error as Error).message });
    }

    const allSynced = Object.values(result).every(Boolean);

    if (allSynced) {
      await this.markAllSynced(recordId);
    } else {
      await prisma.syncStatus.update({
        where: { recordId },
        data: {
          ...result,
          lastSyncAt: new Date(),
          syncError: '部分同步失败',
        },
      });
    }

    return result;
  }

  private async syncClassPage(recordId: number): Promise<void> {
    await this.markClassPageSynced(recordId);
    logger.debug('班级页数据已同步', { recordId });
  }

  private async syncBabyDetail(recordId: number): Promise<void> {
    await this.markBabyDetailSynced(recordId);
    logger.debug('宝宝详情页数据已同步', { recordId });
  }

  private async syncBackend(recordId: number): Promise<void> {
    await this.markBackendSynced(recordId);
    logger.debug('后台接口数据已同步', { recordId });
  }

  private async syncExport(recordId: number): Promise<void> {
    await this.markExportSynced(recordId);
    logger.debug('导出清单数据已同步', { recordId });
  }

  async retrySync(recordId: number): Promise<SyncResult> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < config.sync.retryAttempts) {
      try {
        return await this.syncAll(recordId);
      } catch (error) {
        lastError = error as Error;
        attempts++;
        logger.warn(`同步重试 ${attempts}/${config.sync.retryAttempts}`, { recordId });
        await new Promise((resolve) => setTimeout(resolve, config.sync.retryDelay));
      }
    }

    await prisma.syncStatus.update({
      where: { recordId },
      data: {
        syncError: lastError?.message || '同步失败',
      },
    });

    throw lastError || new Error('同步失败');
  }

  async getUnsyncedRecords(): Promise<any[]> {
    return prisma.syncStatus.findMany({
      where: {
        OR: [
          { classPageSynced: false },
          { babyDetailSynced: false },
          { backendSynced: false },
          { exportSynced: false },
        ],
      },
      include: {
        record: {
          include: {
            baby: true,
            class: true,
            handledBy: true,
          },
        },
      },
    });
  }

  async bulkSync(recordIds: number[]): Promise<Map<number, SyncResult>> {
    const results = new Map<number, SyncResult>();

    for (const recordId of recordIds) {
      try {
        const result = await this.syncAll(recordId);
        results.set(recordId, result);
      } catch (error) {
        results.set(recordId, {
          classPageSynced: false,
          babyDetailSynced: false,
          backendSynced: false,
          exportSynced: false,
        });
      }
    }

    return results;
  }
}

export const syncService = new SyncService();
