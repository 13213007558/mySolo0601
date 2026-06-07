import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db } from '@/db';
import { RescheduleRecord, User, ImportDryRunResult } from '@/types';
import { ValidationService } from '@/services/ValidationService';
import { RecordService } from '@/services/RecordService';
import { AuthService } from '@/services/AuthService';
import { AuditService } from '@/services/AuditService';

const FIELD_MAPPING: Record<string, keyof RescheduleRecord> = {
  宝宝姓名: 'babyName',
  姓名: 'babyName',
  babyName: 'babyName',
  宝宝ID: 'babyId',
  婴儿ID: 'babyId',
  babyId: 'babyId',
  原班次: 'originalShift',
  originalShift: 'originalShift',
  原日期: 'originalDate',
  originalDate: 'originalDate',
  目标班次: 'targetShift',
  targetShift: 'targetShift',
  目标日期: 'targetDate',
  targetDate: 'targetDate',
  换班原因: 'reason',
  原因: 'reason',
  reason: 'reason',
  负责人ID: 'handlerId',
  handlerId: 'handlerId',
  负责人: 'handlerName',
  handlerName: 'handlerName',
};

export const ImportService = {
  async parseFile(
    file: File
  ): Promise<Array<Record<string, unknown>>> {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          encoding: 'UTF-8',
          complete: (results) => {
            resolve(results.data as Array<Record<string, unknown>>);
          },
          error: (err) => reject(err),
        });
      });
    }

    if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, {
        defval: '',
        raw: false,
      });
      return data as Array<Record<string, unknown>>;
    }

    throw new Error('不支持的文件格式，仅支持 .csv, .xlsx, .xls');
  },

  mapToRecords(
    rawData: Array<Record<string, unknown>>,
    sourceFileName: string
  ): Array<{ data: Partial<RescheduleRecord>; raw: Record<string, unknown> }> {
    const now = new Date().toISOString();
    return rawData.map((row) => {
      const mapped: Partial<RescheduleRecord> = {
        sourceFileName,
        sourceUploadedAt: now,
      };

      for (const [key, value] of Object.entries(row)) {
        const mappedKey = FIELD_MAPPING[key.trim()];
        if (mappedKey) {
          (mapped as Record<string, unknown>)[mappedKey] =
            typeof value === 'string' ? value.trim() : value;
        }
      }

      return { data: mapped, raw: row };
    });
  },

  async dryRun(file: File): Promise<ImportDryRunResult> {
    const rawData = await ImportService.parseFile(file);
    const mapped = ImportService.mapToRecords(rawData, file.name);
    const existingRecords = await db.reschedule_records.toArray();

    const validRows: RescheduleRecord[] = [];
    const badRows: ImportDryRunResult['badRows'] = [];
    const tempAll = [...existingRecords];
    const now = new Date().toISOString();

    mapped.forEach(({ data, raw }, idx) => {
      const { valid, errors, anomaly } = ValidationService.validateRecord(
        data,
        tempAll
      );

      if (!valid) {
        badRows.push({
          rowIndex: idx + 2,
          rawData: raw,
          errors,
        });
        return;
      }

      const record: RescheduleRecord = {
        id: `preview-${idx}`,
        babyName: data.babyName || '',
        babyId: data.babyId || '',
        originalShift: data.originalShift || '',
        originalDate: data.originalDate || '',
        targetShift: data.targetShift || '',
        targetDate: data.targetDate || '',
        reason: data.reason || '',
        sourceFileName: file.name,
        sourceUploadedAt: now,
        handlerId: data.handlerId || '',
        handlerName: data.handlerName || '',
        status: anomaly ? 'cross_shift' : 'pending',
        anomaly: anomaly || { type: 'none', message: '无异常' },
        isIsolated: false,
        createdAt: now,
        updatedAt: now,
      };
      validRows.push(record);
      tempAll.push(record);
    });

    return {
      totalRows: mapped.length,
      validRows,
      badRows,
      sourceFileName: file.name,
    };
  },

  async commitImport(
    result: ImportDryRunResult,
    operator: User
  ): Promise<{ success: RescheduleRecord[]; failedCount: number }> {
    if (!AuthService.canImport(operator)) {
      throw new Error('当前用户无权导入数据');
    }

    const recordsToCreate = result.validRows.map((r) => ({
      babyName: r.babyName,
      babyId: r.babyId,
      originalShift: r.originalShift,
      originalDate: r.originalDate,
      targetShift: r.targetShift,
      targetDate: r.targetDate,
      reason: r.reason,
      sourceFileName: r.sourceFileName,
      sourceUploadedAt: r.sourceUploadedAt,
      handlerId: r.handlerId || operator.id,
      handlerName: r.handlerName || operator.name,
    }));

    const batchResult = await RecordService.batchCreate(recordsToCreate, operator);

    if (batchResult.success.length > 0) {
      await Promise.all(
        batchResult.success.map((rec) =>
          AuditService.logAction({
            recordId: rec.id,
            action: 'import',
            operatorId: operator.id,
            operatorName: operator.name,
            note: `从 ${result.sourceFileName} 导入`,
          })
        )
      );
    }

    return {
      success: batchResult.success,
      failedCount: result.badRows.length + batchResult.failed.length,
    };
  },
};
