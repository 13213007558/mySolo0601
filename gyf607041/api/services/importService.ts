import db from '../db/database.js';
import * as XLSX from 'xlsx';
import type { ImportResult, ImportAudit, DataStatus } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';
import { logOperation } from './auditService.js';
import { addTemperature, createBaby, getBabyById } from './babyService.js';

const OPERATOR = '护理主管';

export interface ParsedRecord {
  rowNumber: number;
  name: string;
  roomNumber: string;
  temperature?: number;
  measureTime?: string;
  measuredBy?: string;
  deviceId?: string;
  remark?: string;
  gender?: 'male' | 'female';
  ageMonths?: number;
  nurseInCharge?: string;
  admissionDate?: string;
}

function validateRecord(rec: ParsedRecord): { valid: boolean; reason?: string } {
  if (!rec.name || rec.name.trim() === '') {
    return { valid: false, reason: '宝宝姓名为空' };
  }
  if (!rec.roomNumber || rec.roomNumber.trim() === '') {
    return { valid: false, reason: '房号为空' };
  }
  if (rec.temperature !== undefined) {
    const t = Number(rec.temperature);
    if (isNaN(t) || t < 34 || t > 42) {
      return { valid: false, reason: `体温值异常: ${rec.temperature}` };
    }
  }
  return { valid: true };
}

function detectStatus(rec: ParsedRecord): DataStatus {
  const hasName = !!rec.name && rec.name.trim() !== '';
  const hasRoom = !!rec.roomNumber && rec.roomNumber.trim() !== '';
  const hasTemp = rec.temperature !== undefined && !isNaN(Number(rec.temperature));

  if (!hasName && !hasRoom) {
    return 'empty';
  }
  if ((hasName || hasRoom) && !hasTemp) {
    return 'dirty';
  }
  const t = Number(rec.temperature);
  if (t < 36.0 || t > 37.3) {
    return 'pending_review';
  }
  return 'normal';
}

function parseExcel(buffer: Buffer, fileName: string): { records: ParsedRecord[]; pageCount: number } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const pageCount = workbook.SheetNames.length;
  const records: ParsedRecord[] = [];
  let rowOffset = 1;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
    json.forEach((row, idx) => {
      const name = row['姓名'] || row['宝宝姓名'] || row['name'] || row['Name'] || '';
      const roomNumber = row['房号'] || row['房间号'] || row['room'] || row['Room'] || '';
      const temperatureRaw = row['体温'] || row['温度'] || row['temperature'] || row['Temperature'];
      const measureTime = row['测量时间'] || row['时间'] || row['time'] || row['Time'] || '';
      const measuredBy = row['测量人'] || row['护士'] || row['nurse'] || '';
      const deviceId = row['设备编号'] || row['体温枪编号'] || row['device'] || row['device_id'] || '';
      const remark = row['备注'] || row['remark'] || '';
      const genderRaw = row['性别'] || row['gender'] || '';
      const ageRaw = row['月龄'] || row['年龄'] || row['age'] || '';
      const nurseInCharge = row['责任护士'] || row['护士'] || '';
      const admissionDate = row['入所日期'] || row['入院日期'] || '';

      const temperature = temperatureRaw === '' || temperatureRaw === null || temperatureRaw === undefined
        ? undefined
        : Number(temperatureRaw);

      const gender: 'male' | 'female' | undefined =
        genderRaw === '男' || genderRaw === 'male' || genderRaw === 'M' ? 'male'
        : genderRaw === '女' || genderRaw === 'female' || genderRaw === 'F' ? 'female'
        : undefined;

      const ageMonths = ageRaw === '' || ageRaw === null ? undefined : Number(ageRaw);

      records.push({
        rowNumber: rowOffset + idx,
        name: String(name),
        roomNumber: String(roomNumber),
        temperature,
        measureTime: measureTime ? String(measureTime) : undefined,
        measuredBy: measuredBy ? String(measuredBy) : undefined,
        deviceId: deviceId ? String(deviceId) : undefined,
        remark: remark ? String(remark) : undefined,
        gender,
        ageMonths: isNaN(Number(ageMonths)) ? undefined : Number(ageMonths),
        nurseInCharge: nurseInCharge ? String(nurseInCharge) : undefined,
        admissionDate: admissionDate ? String(admissionDate) : undefined,
      });
    });
    rowOffset += json.length;
  }
  return { records, pageCount };
}

export function importFromExcel(buffer: Buffer, fileName: string): ImportResult {
  const { records, pageCount } = parseExcel(buffer, fileName);
  const totalCount = records.length;
  const failedRecords: Array<{ row: number; reason: string; data: any }> = [];
  let successCount = 0;

  const transaction = db.transaction(() => {
    for (const rec of records) {
      const check = validateRecord(rec);
      if (!check.valid) {
        failedRecords.push({ row: rec.rowNumber, reason: check.reason!, data: rec });
        continue;
      }

      try {
        let babyId: string | null = null;
        const existing = db.prepare('SELECT id FROM babies WHERE name = ? AND room_number = ?')
          .get(rec.name, rec.roomNumber) as any;

        const status = detectStatus(rec);
        const defaultDate = new Date().toISOString().split('T')[0];
        const defaultTime = new Date().toISOString();

        if (!existing) {
          const newBaby = createBaby({
            name: rec.name,
            gender: rec.gender || 'male',
            ageMonths: rec.ageMonths || 1,
            roomNumber: rec.roomNumber,
            nurseInCharge: rec.nurseInCharge || '未指派',
            admissionDate: rec.admissionDate || defaultDate,
            status,
            latestTemperature: rec.temperature !== undefined ? Number(rec.temperature) : null,
            remark: rec.remark || '',
          });
          babyId = newBaby.id;
        } else {
          babyId = existing.id;
          db.prepare(`UPDATE babies SET status = ?, latest_temperature = ?, remark = ?, updated_at = ? WHERE id = ?`)
            .run(status, rec.temperature !== undefined ? Number(rec.temperature) : null, rec.remark || '', defaultTime, babyId);
        }

        if (babyId && rec.temperature !== undefined && !isNaN(Number(rec.temperature))) {
          addTemperature(babyId, {
            temperature: Number(rec.temperature),
            measureTime: rec.measureTime || defaultTime,
            measuredBy: rec.measuredBy || '',
            deviceId: rec.deviceId || '',
            source: 'gun',
            remark: rec.remark || '',
          });
        }
        successCount++;
      } catch (err: any) {
        failedRecords.push({ row: rec.rowNumber, reason: err.message || '数据库写入失败', data: rec });
      }
    }
  });

  transaction();

  const failedCount = totalCount - successCount;
  const actualRecordCount = successCount;
  const hasDiscrepancy = pageCount > 0 && actualRecordCount !== totalCount;

  const auditId = uuidv4();
  db.prepare(`
    INSERT INTO import_audits (id, file_name, imported_at, imported_by, total_count, success_count, failed_count, page_count, actual_record_count, has_discrepancy, discrepancy_note, failed_records_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    auditId,
    fileName,
    new Date().toISOString(),
    OPERATOR,
    totalCount,
    successCount,
    failedCount,
    pageCount,
    actualRecordCount,
    hasDiscrepancy ? 1 : 0,
    hasDiscrepancy ? `Excel声明${totalCount}条，实际导入${actualRecordCount}条，页面数${pageCount}` : '',
    JSON.stringify(failedRecords)
  );

  logOperation(OPERATOR, 'IMPORT', 'ImportAudit', auditId, null, {
    fileName,
    totalCount,
    successCount,
    failedCount,
    pageCount,
    hasDiscrepancy,
  });

  let message = '';
  if (successCount === totalCount) {
    message = `导入成功，共 ${successCount} 条记录`;
  } else if (successCount > 0) {
    message = `部分成功：成功 ${successCount} 条，失败 ${failedCount} 条`;
  } else {
    message = `导入失败：全部 ${failedCount} 条记录失败`;
  }

  return {
    auditId,
    success: failedCount === 0,
    partialSuccess: successCount > 0 && failedCount > 0,
    totalCount,
    successCount,
    failedCount,
    message,
    failedRecords,
    hasDiscrepancy,
  };
}

export function getImportAudits(limit = 100): ImportAudit[] {
  const rows = db.prepare('SELECT * FROM import_audits ORDER BY imported_at DESC LIMIT ?').all(limit) as any[];
  return rows.map(row => ({
    id: row.id,
    fileName: row.file_name,
    importedAt: row.imported_at,
    importedBy: row.imported_by,
    totalCount: row.total_count,
    successCount: row.success_count,
    failedCount: row.failed_count,
    pageCount: row.page_count,
    actualRecordCount: row.actual_record_count,
    hasDiscrepancy: row.has_discrepancy === 1,
    discrepancyNote: row.discrepancy_note || '',
    failedRecords: row.failed_records_json ? JSON.parse(row.failed_records_json) : [],
  }));
}

export function seedDemoData(): void {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM babies').get() as any;
  if (count?.cnt > 0) return;

  const demoBabies = [
    {
      name: '张小明', gender: 'male' as const, ageMonths: 2, roomNumber: '301',
      nurseInCharge: '李护士', admissionDate: '2026-06-01',
      temperatures: [
        { temperature: 36.5, time: '2026-06-08 07:30' },
        { temperature: 36.8, time: '2026-06-08 09:15' },
      ],
      remark: '早高峰备注：精神可，奶量正常',
    },
    {
      name: '李妞妞', gender: 'female' as const, ageMonths: 3, roomNumber: '302',
      nurseInCharge: '王护士', admissionDate: '2026-06-03',
      temperatures: [
        { temperature: 37.8, time: '2026-06-08 08:00' },
        { temperature: 37.5, time: '2026-06-08 10:00' },
      ],
      remark: '体温偏高，需复核，早高峰未登记完整',
    },
    {
      name: '王小宝', gender: 'male' as const, ageMonths: 1, roomNumber: '303',
      nurseInCharge: '赵护士', admissionDate: '2026-06-05',
      temperatures: [],
      remark: '脏数据：体温记录缺失，仅有房号',
    },
    {
      name: '陈乐乐', gender: 'female' as const, ageMonths: 4, roomNumber: '305',
      nurseInCharge: '刘护士', admissionDate: '2026-05-28',
      temperatures: [
        { temperature: 36.6, time: '2026-06-08 07:45' },
      ],
      remark: '请假条材料缺页，仅见第1页',
    },
  ];

  for (const demo of demoBabies) {
    const status: DataStatus =
      demo.temperatures.length === 0 ? 'dirty'
      : demo.temperatures.some(t => t.temperature > 37.3) ? 'pending_review'
      : 'normal';

    const baby = createBaby({
      name: demo.name,
      gender: demo.gender,
      ageMonths: demo.ageMonths,
      roomNumber: demo.roomNumber,
      nurseInCharge: demo.nurseInCharge,
      admissionDate: demo.admissionDate,
      status,
      latestTemperature: demo.temperatures.length > 0 ? demo.temperatures[demo.temperatures.length - 1].temperature : null,
      remark: demo.remark,
    });

    for (const t of demo.temperatures) {
      addTemperature(baby.id, {
        temperature: t.temperature,
        measureTime: t.time,
        measuredBy: demo.nurseInCharge,
        deviceId: 'TG-001',
        source: 'gun',
        remark: '',
      });
    }

    if (demo.name === '陈乐乐') {
      db.prepare(`
        INSERT INTO rectification_records (id, baby_id, problem_description, rectification_measure, rectified_by, rectified_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        baby.id,
        '请假条照片仅见第1页，第2页缺失',
        '联系家属补发第2页，已电话沟通，下午重新上传',
        '护理主管',
        new Date().toISOString(),
        'in_progress'
      );
    }
  }
}
