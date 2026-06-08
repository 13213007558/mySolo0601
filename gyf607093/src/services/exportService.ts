import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { disinfectionService } from './disinfectionService';
import { auditService } from './auditService';
import { privacyService } from './privacyService';
import { UserRoleType } from '../config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface ExportFilters {
  classId?: number;
  babyId?: number;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  includeManual?: boolean;
}

interface ExportResult {
  filename: string;
  filePath: string;
  recordCount: number;
  exportTime: Date;
}

class ExportService {
  private exportDir = path.join(process.cwd(), 'exports');

  constructor() {
    this.ensureExportDir();
  }

  private ensureExportDir(): void {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  async exportToCsv(
    filters: ExportFilters,
    userId: number,
    userRole: UserRoleType,
    ipAddress?: string
  ): Promise<ExportResult> {
    const records = await disinfectionService.getRecordsForExport(filters, userRole);

    if (records.length === 0) {
      throw new Error('没有可导出的数据');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `消毒记录_${timestamp}.csv`;
    const filePath = path.join(this.exportDir, filename);

    const headers = [
      { id: 'id', title: '记录ID' },
      { id: 'babyName', title: '宝宝姓名' },
      { id: 'babyIdCard', title: '宝宝身份证' },
      { id: 'babyPhone', title: '联系电话' },
      { id: 'className', title: '班级' },
      { id: 'itemName', title: '物品名称' },
      { id: 'itemType', title: '物品类型' },
      { id: 'borrowTime', title: '借出时间' },
      { id: 'returnTime', title: '归还时间' },
      { id: 'status', title: '状态' },
      { id: 'scanResult', title: '扫码结果' },
      { id: 'isManualEntry', title: '是否手工补录' },
      { id: 'manualEntryNote', title: '补录备注' },
      { id: 'handledByName', title: '处理人' },
      { id: 'handledByRole', title: '处理人角色' },
      { id: 'anomalyType', title: '异常类型' },
      { id: 'anomalyDescription', title: '异常描述' },
      { id: 'anomalyResolution', title: '处理方案' },
      { id: 'anomalyHandledAt', title: '异常处理时间' },
      { id: 'createdAt', title: '创建时间' },
    ];

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    const rows = records.map((record) => ({
      id: record.id,
      babyName: record.baby?.name || '',
      babyIdCard: record.baby?.idCard || '',
      babyPhone: record.baby?.phone || '',
      className: record.class?.name || '',
      itemName: record.item?.name || '',
      itemType: record.item?.type || '',
      borrowTime: record.borrowTime?.toISOString() || '',
      returnTime: record.returnTime?.toISOString() || '',
      status: this.translateStatus(record.status),
      scanResult: record.scanResult || '',
      isManualEntry: record.isManualEntry ? '是' : '否',
      manualEntryNote: record.manualEntryNote || '',
      handledByName: record.handledBy?.name || '',
      handledByRole: this.translateRole(record.handledBy?.role || ''),
      anomalyType: record.anomaly?.anomalyType || '',
      anomalyDescription: record.anomaly?.description || '',
      anomalyResolution: record.anomaly?.resolution || '',
      anomalyHandledAt: record.anomaly?.handledAt?.toISOString() || '',
      createdAt: record.createdAt.toISOString(),
    }));

    await csvWriter.writeRecords(rows);

    await prisma.exportLog.create({
      data: {
        userId,
        exportType: 'CSV',
        filters: JSON.stringify(filters),
        recordCount: rows.length,
        filename,
      },
    });

    await auditService.logExport(
      userId,
      '消毒记录CSV导出',
      JSON.stringify(filters),
      rows.length,
      ipAddress
    );

    logger.info('导出成功', { filename, recordCount: rows.length, userId });

    return {
      filename,
      filePath,
      recordCount: rows.length,
      exportTime: new Date(),
    };
  }

  async exportToJson(
    filters: ExportFilters,
    userId: number,
    userRole: UserRoleType,
    ipAddress?: string
  ): Promise<ExportResult> {
    const records = await disinfectionService.getRecordsForExport(filters, userRole);

    if (records.length === 0) {
      throw new Error('没有可导出的数据');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `消毒记录_${timestamp}.json`;
    const filePath = path.join(this.exportDir, filename);

    const exportData = {
      exportTime: new Date().toISOString(),
      exportedBy: userId,
      filters,
      total: records.length,
      records: records.map((record) => ({
        ...record,
        baby: record.baby
          ? privacyService.processBabyData(
              record.baby as unknown as Record<string, unknown>,
              userRole,
              'export'
            )
          : null,
      })),
    };

    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');

    await prisma.exportLog.create({
      data: {
        userId,
        exportType: 'JSON',
        filters: JSON.stringify(filters),
        recordCount: records.length,
        filename,
      },
    });

    await auditService.logExport(
      userId,
      '消毒记录JSON导出',
      JSON.stringify(filters),
      records.length,
      ipAddress
    );

    logger.info('JSON导出成功', { filename, recordCount: records.length, userId });

    return {
      filename,
      filePath,
      recordCount: records.length,
      exportTime: new Date(),
    };
  }

  async getExportHistory(
    userId?: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ logs: any[]; total: number }> {
    const where: any = {};
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.exportLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.exportLog.count({ where }),
    ]);

    return { logs, total };
  }

  getExportFilePath(filename: string): string {
    return path.join(this.exportDir, filename);
  }

  fileExists(filename: string): boolean {
    return fs.existsSync(this.getExportFilePath(filename));
  }

  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': '待处理',
      'NORMAL': '正常',
      'ABNORMAL': '异常',
      'RESOLVED': '已解决',
      'PARTIAL_SUCCESS': '部分成功',
    };
    return statusMap[status] || status;
  }

  private translateRole(role: string): string {
    const roleMap: Record<string, string> = {
      ADMIN: '管理员',
      SUPERVISOR: '主管',
      THERAPIST: '治疗师',
      RECEPTION: '前台',
      GENERAL: '普通用户',
    };
    return roleMap[role] || role;
  }
}

export const exportService = new ExportService();
