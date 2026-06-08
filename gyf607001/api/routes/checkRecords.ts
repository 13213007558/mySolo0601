import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import { Readable } from 'stream';
import type { Baby, DailyCheckRecord, AuditLog, ImportResult, CheckStatus, DirtyRowDetail, TemperatureRecord } from '../../shared/types';
import {
  mockBabies,
  mockRecords,
  mockAuditLogs,
  generateDirtyImportSample,
  generateEmptyImportSample,
} from '../../shared/mockData';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

let records: DailyCheckRecord[] = [...mockRecords];
let babies: Baby[] = [...mockBabies];
let auditLogs: AuditLog[] = [...mockAuditLogs];

const genId = () => Math.random().toString(36).slice(2, 11);
const formatDateTime = (d: Date) => d.toISOString();

type RawRow = Record<string, any>;

interface ParseResult {
  successRows: number;
  dirtyRows: number;
  emptyRows: number;
  totalRows: number;
  dirtyRowDetails: DirtyRowDetail[];
  importedRecords: DailyCheckRecord[];
  partialSuccess: boolean;
  dateOutOfOrderWarning: boolean;
}

function normalizeKeys(row: RawRow): RawRow {
  const normalized: RawRow = {};
  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase().trim();
    const value = typeof row[key] === 'string' ? row[key].trim() : row[key];
    if (lowerKey.includes('姓名') || lowerKey.includes('name') || lowerKey.includes('宝宝')) {
      normalized.name = value;
    } else if (lowerKey.includes('班级') || lowerKey.includes('class')) {
      normalized.className = value;
    } else if (lowerKey.includes('体温') || lowerKey.includes('temperature') || lowerKey.includes('temp')) {
      normalized.temperature = value;
    } else if (lowerKey.includes('时间') || lowerKey.includes('日期') || lowerKey.includes('date') || lowerKey.includes('time')) {
      normalized.measureTime = value;
    } else if (lowerKey.includes('备注') || lowerKey.includes('note') || lowerKey.includes('remark')) {
      normalized.note = value;
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

function isEmptyRow(row: RawRow): boolean {
  const values = Object.values(row).filter(v => v !== null && v !== undefined);
  return values.length === 0 || values.every(v => String(v).trim() === '');
}

function determineStatus(temp: number): CheckStatus {
  if (temp >= 37.5) return 'abnormal';
  if (temp >= 37.2) return 'pending';
  return 'normal';
}

function parseDateFromTime(timeStr: string): string | null {
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    const todayMatch = timeStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (todayMatch) {
      return `${todayMatch[1]}-${todayMatch[2].padStart(2, '0')}-${todayMatch[3].padStart(2, '0')}`;
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function parseMeasureTime(timeStr: string, rowDate: string): string {
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return formatDateTime(d);
    }
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const d2 = new Date(rowDate + 'T00:00:00');
      d2.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
      return formatDateTime(d2);
    }
    return formatDateTime(new Date());
  } catch {
    return formatDateTime(new Date());
  }
}

async function parseCSV(buffer: Buffer): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const rows: RawRow[] = [];
    const stream = Readable.from(buffer.toString('utf-8'));
    stream
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function parseExcel(buffer: Buffer): RawRow[] {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet, { defval: '' });
}

async function parseFile(file: Express.Multer.File): Promise<ParseResult> {
  const fileExt = file.originalname.toLowerCase().split('.').pop();
  let rawRows: RawRow[] = [];

  try {
    if (fileExt === 'csv') {
      rawRows = await parseCSV(file.buffer);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      rawRows = parseExcel(file.buffer);
    } else {
      throw new Error('不支持的文件格式');
    }
  } catch (err) {
    return {
      successRows: 0,
      dirtyRows: 1,
      emptyRows: 0,
      totalRows: 1,
      dirtyRowDetails: [{
        rowNumber: 1,
        rowData: { fileName: file.originalname },
        errorType: 'format_error',
        errorMessage: `文件解析失败：${(err as Error).message}`,
      }],
      importedRecords: [],
      partialSuccess: false,
      dateOutOfOrderWarning: false,
    };
  }

  const dirtyRowDetails: DirtyRowDetail[] = [];
  const importedRecords: DailyCheckRecord[] = [];
  let successRows = 0;
  let emptyRows = 0;
  let dirtyRows = 0;
  const processedDates: string[] = [];
  let dateOutOfOrderWarning = false;

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 2;
    const originalRow = rawRows[i];
    const row = normalizeKeys(originalRow);

    try {
      if (isEmptyRow(row)) {
        emptyRows++;
        dirtyRowDetails.push({
          rowNumber,
          rowData: {},
          errorType: 'empty',
          errorMessage: '空数据行，所有字段为空',
        });
        continue;
      }

      if (!row.name) {
        dirtyRows++;
        dirtyRowDetails.push({
          rowNumber,
          rowData: originalRow,
          errorType: 'format_error',
          errorMessage: '缺少宝宝姓名字段',
        });
        continue;
      }

      const baby = babies.find(b => b.name === row.name);
      if (!baby) {
        dirtyRows++;
        dirtyRowDetails.push({
          rowNumber,
          rowData: originalRow,
          errorType: 'missing_baby',
          errorMessage: `宝宝 "${row.name}" 在系统中未找到对应记录`,
        });
        continue;
      }

      if (row.temperature === undefined || row.temperature === null || row.temperature === '') {
        dirtyRows++;
        dirtyRowDetails.push({
          rowNumber,
          rowData: originalRow,
          errorType: 'invalid_temperature',
          errorMessage: '体温字段为空',
        });
        continue;
      }

      const tempStr = String(row.temperature).trim();
      if (!/^-?\d+(\.\d+)?$/.test(tempStr)) {
        dirtyRows++;
        dirtyRowDetails.push({
          rowNumber,
          rowData: originalRow,
          errorType: 'invalid_temperature',
          errorMessage: `体温值 "${tempStr}" 不是有效数字，应填写纯数字（如 36.5）`,
        });
        continue;
      }
      const temp = parseFloat(tempStr);
      if (isNaN(temp) || temp < 34 || temp > 43) {
        dirtyRows++;
        dirtyRowDetails.push({
          rowNumber,
          rowData: originalRow,
          errorType: 'invalid_temperature',
          errorMessage: `体温值 "${tempStr}" 超出有效范围，应在 34-43℃ 范围内`,
        });
        continue;
      }

      const rowDate = parseDateFromTime(String(row.measureTime || new Date().toISOString())) || new Date().toISOString().split('T')[0];

      if (processedDates.length > 0) {
        const lastDate = processedDates[processedDates.length - 1];
        if (rowDate > lastDate) {
          dateOutOfOrderWarning = true;
        }
      }
      if (!processedDates.includes(rowDate)) {
        processedDates.push(rowDate);
      }

      const measureTime = parseMeasureTime(String(row.measureTime || ''), rowDate);
      const status = determineStatus(temp);
      const hour = new Date(measureTime).getHours();

      const tempRecord: TemperatureRecord = {
        id: genId(),
        babyId: baby.id,
        temperature: temp,
        measureTime,
        measurePerson: hour < 8 ? '夜班王老师' : '白班李老师',
        deviceId: 'TH-001',
        rawNote: row.note ? String(row.note) : undefined,
      };

      const existingRecord = records.find(r => r.babyId === baby.id && r.date === rowDate);

      if (existingRecord) {
        existingRecord.temperatures.push(tempRecord);
        const maxTemp = Math.max(...existingRecord.temperatures.map(t => t.temperature));
        existingRecord.status = determineStatus(maxTemp);
        if (status === 'abnormal' && !existingRecord.initialReason.includes('体温')) {
          existingRecord.initialReason = `体温 ${maxTemp}℃`;
        }
        successRows++;
        importedRecords.push(existingRecord);
      } else {
        const newRecord: DailyCheckRecord = {
          id: genId(),
          babyId: baby.id,
          date: rowDate,
          temperatures: [tempRecord],
          status,
          initialReason: status === 'abnormal' ? `体温 ${temp}℃` : (status === 'pending' ? '临界体温，需复核' : '体温正常'),
          leaveAttachments: [],
          reviewStatus: 'unreviewed',
        };
        records.push(newRecord);
        successRows++;
        importedRecords.push(newRecord);
      }

    } catch (err) {
      dirtyRows++;
      dirtyRowDetails.push({
        rowNumber,
        rowData: originalRow,
        errorType: 'unknown',
        errorMessage: `解析异常：${(err as Error).message}`,
      });
    }
  }

  const totalRows = rawRows.length;
  const partialSuccess = successRows > 0 && (dirtyRows > 0 || emptyRows > 0) || dateOutOfOrderWarning;

  const uniqueRecords = importedRecords.filter((v, i, a) =>
    a.findIndex(t => t.id === v.id) === i
  );

  records = records.filter(r =>
    !uniqueRecords.some(ur => ur.babyId === r.babyId && ur.date === r.date && ur.id !== r.id)
  );

  return {
    successRows,
    dirtyRows,
    emptyRows,
    totalRows,
    dirtyRowDetails,
    importedRecords: uniqueRecords,
    partialSuccess,
    dateOutOfOrderWarning,
  };
}

router.post('/import/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未接收到文件' });
    }

    const parseResult = await parseFile(req.file);
    const result: ImportResult = {
      totalRows: parseResult.totalRows,
      successRows: parseResult.successRows,
      dirtyRows: parseResult.dirtyRows,
      emptyRows: parseResult.emptyRows,
      partialSuccess: parseResult.partialSuccess,
      dirtyRowDetails: parseResult.dirtyRowDetails,
      importedRecords: parseResult.importedRecords,
    };

    if (parseResult.dateOutOfOrderWarning && parseResult.dirtyRowDetails.every(d => d.errorMessage.indexOf('日期') === -1)) {
      result.dirtyRowDetails.unshift({
        rowNumber: 0,
        rowData: { warning: '日期倒序' },
        errorType: 'format_error',
        errorMessage: '检测到日期未按倒序排列，部分日期数据可能顺序错乱，已继续解析所有有效数据',
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: '文件处理失败',
      message: (err as Error).message,
    });
  }
});

router.post('/import', (_req, res) => {
  const scenario = (_req.body as { scenario?: string })?.scenario;
  let result: ImportResult;
  if (scenario === 'empty') {
    result = generateEmptyImportSample();
  } else if (scenario === 'dirty') {
    result = generateDirtyImportSample();
    records = [...result.importedRecords, ...records.filter(r => !result.importedRecords.some(nr => nr.babyId === r.babyId && nr.date === r.date))];
  } else {
    const todayRecords = records.filter(r => r.date === new Date().toISOString().split('T')[0]);
    result = {
      totalRows: todayRecords.length,
      successRows: todayRecords.length,
      dirtyRows: 0,
      emptyRows: 0,
      partialSuccess: false,
      dirtyRowDetails: [],
      importedRecords: todayRecords,
    };
  }
  res.json(result);
});

router.get('/records', (req, res) => {
  const { date, className, status, babyId } = req.query as Record<string, string>;
  let filtered = [...records];
  if (date) filtered = filtered.filter(r => r.date === date);
  if (className) {
    const babyIdsInClass = babies.filter(b => b.className === className).map(b => b.id);
    filtered = filtered.filter(r => babyIdsInClass.includes(r.babyId));
  }
  if (status) filtered = filtered.filter(r => r.status === status);
  if (babyId) filtered = filtered.filter(r => r.babyId === babyId);
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  res.json(filtered);
});

router.get('/records/:id', (req, res) => {
  const record = records.find(r => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });
  const relatedAudit = auditLogs.filter(a => a.recordId === record.id || a.babyId === record.babyId);
  res.json({ ...record, auditLogs: relatedAudit });
});

router.get('/babies', (_req, res) => {
  res.json(babies);
});

router.get('/babies/:id', (req, res) => {
  const baby = babies.find(b => b.id === req.params.id);
  if (!baby) return res.status(404).json({ error: '宝宝不存在' });
  const babyRecords = records.filter(r => r.babyId === baby.id).sort((a, b) => b.date.localeCompare(a.date));
  res.json({ baby, records: babyRecords });
});

router.post('/records/:id/review', (req, res) => {
  const record = records.find(r => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });

  const { newStatus, newReason, operatorName } = req.body as {
    newStatus: CheckStatus;
    newReason: string;
    operatorName: string;
  };

  const auditLog: AuditLog = {
    id: Math.random().toString(36).slice(2, 11),
    recordId: record.id,
    babyId: record.babyId,
    operatorId: 'op_current',
    operatorName: operatorName || '保健老师',
    oldStatus: record.status,
    newStatus,
    oldReason: record.initialReason,
    newReason,
    operatedAt: new Date().toISOString(),
  };

  auditLogs = [auditLog, ...auditLogs];
  record.status = newStatus;
  record.initialReason = newReason;
  record.reviewStatus = 'reviewed';
  record.auditLogs = [...(record.auditLogs || []), auditLog];

  res.json({ success: true, record, auditLog });
});

router.get('/audit', (_req, res) => {
  const enriched = auditLogs.map(log => ({
    ...log,
    babyName: babies.find(b => b.id === log.babyId)?.name || '未知',
    className: babies.find(b => b.id === log.babyId)?.className || '未知',
  }));
  res.json(enriched.sort((a, b) => b.operatedAt.localeCompare(a.operatedAt)));
});

router.post('/audit/:id/confirm', (req, res) => {
  const log = auditLogs.find(a => a.id === req.params.id);
  if (!log) return res.status(404).json({ error: '审计记录不存在' });
  log.reviewedBy = (req.body as { reviewedBy?: string })?.reviewedBy || '主管王主任';
  log.reviewedAt = new Date().toISOString();
  res.json({ success: true, auditLog: log });
});

export default router;
