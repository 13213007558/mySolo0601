import * as XLSX from 'xlsx';
import type { PumpRecord, ImportResult, ImportError, PumpStatus, StartStopLog } from '../types';
import { normalizePumpCode, generateId } from '../data/sampleData';

const THRESHOLDS = {
  temperature: { warning: 28, abnormal: 35 },
  pressure: { warning: 0.28, abnormal: 0.22 },
  vibration: { warning: 4.0, abnormal: 7.0 },
  flowRate: { warning: 100, abnormal: 80 },
};

export const determineStatus = (record: Partial<PumpRecord>): PumpStatus => {
  const { temperature, pressure, vibration, flowRate } = record;

  if (
    (temperature !== null && temperature !== undefined && temperature >= THRESHOLDS.temperature.abnormal) ||
    (pressure !== null && pressure !== undefined && pressure <= THRESHOLDS.pressure.abnormal) ||
    (vibration !== null && vibration !== undefined && vibration >= THRESHOLDS.vibration.abnormal) ||
    (flowRate !== null && flowRate !== undefined && flowRate <= THRESHOLDS.flowRate.abnormal)
  ) {
    return 'abnormal';
  }

  if (
    (temperature !== null && temperature !== undefined && temperature >= THRESHOLDS.temperature.warning) ||
    (pressure !== null && pressure !== undefined && pressure <= THRESHOLDS.pressure.warning) ||
    (vibration !== null && vibration !== undefined && vibration >= THRESHOLDS.vibration.warning) ||
    (flowRate !== null && flowRate !== undefined && flowRate <= THRESHOLDS.flowRate.warning)
  ) {
    return 'warning';
  }

  if (
    temperature === null || temperature === undefined ||
    pressure === null || pressure === undefined ||
    vibration === null || vibration === undefined ||
    flowRate === null || flowRate === undefined
  ) {
    return 'empty';
  }

  return 'normal';
};

const requiredFields = ['pumpCode', 'pumpName', 'location', 'inspectionTime'];
const numericFields = ['temperature', 'pressure', 'flowRate', 'vibration', 'runningHours'];

export const processImportData = (
  data: Record<string, unknown>[],
  existingRecords: PumpRecord[]
): ImportResult => {
  const result: ImportResult = {
    success: 0,
    skipped: 0,
    errors: [],
    totalProcessed: data.length,
  };

  const existingCodes = new Set(existingRecords.map((r) => normalizePumpCode(r.pumpCode)));

  data.forEach((row, index) => {
    const rowNum = index + 1;
    const errors: ImportError[] = [];

    requiredFields.forEach((field) => {
      const value = row[field];
      if (value === undefined || value === null || value === '') {
        errors.push({
          row: rowNum,
          field,
          message: `必填字段"${field}"为空，将使用默认值或跳过`,
          originalValue: value,
        });
      }
    });

    const normalizedCode = row.pumpCode ? normalizePumpCode(String(row.pumpCode)) : '';

    if (normalizedCode && existingCodes.has(normalizedCode)) {
      result.skipped++;
      result.errors.push({
        row: rowNum,
        field: 'pumpCode',
        message: `编号"${row.pumpCode}"已存在，已跳过重复记录`,
        originalValue: row.pumpCode,
      });
      return;
    }

    numericFields.forEach((field) => {
      const value = row[field];
      if (value !== undefined && value !== null && value !== '') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push({
            row: rowNum,
            field,
            message: `"${field}"字段值"${value}"不是有效数字，将设为空`,
            originalValue: value,
          });
        }
      }
    });

    const parsedRecord: Partial<PumpRecord> = {
      id: generateId(),
      pumpCode: String(row.pumpCode || `CP-${String(result.success + result.skipped + 1).padStart(3, '0')}`),
      pumpName: String(row.pumpName || '未命名冷却泵'),
      location: String(row.location || '未知位置'),
      temperature: row.temperature !== undefined && row.temperature !== null && row.temperature !== ''
        ? Number(row.temperature)
        : null,
      pressure: row.pressure !== undefined && row.pressure !== null && row.pressure !== ''
        ? Number(row.pressure)
        : null,
      flowRate: row.flowRate !== undefined && row.flowRate !== null && row.flowRate !== ''
        ? Number(row.flowRate)
        : null,
      vibration: row.vibration !== undefined && row.vibration !== null && row.vibration !== ''
        ? Number(row.vibration)
        : null,
      runningHours: row.runningHours !== undefined && row.runningHours !== null && row.runningHours !== ''
        ? Number(row.runningHours)
        : null,
      lastMaintenance: row.lastMaintenance ? String(row.lastMaintenance) : null,
      inspector: row.inspector ? String(row.inspector) : null,
      inspectionTime: row.inspectionTime ? String(row.inspectionTime) : new Date().toISOString(),
      remarks: row.remarks ? String(row.remarks) : null,
      source: 'import',
    };

    parsedRecord.status = determineStatus(parsedRecord);

    if (parsedRecord.pumpCode) {
      existingCodes.add(normalizePumpCode(parsedRecord.pumpCode));
    }

    result.success++;
    result.errors.push(...errors);
  });

  return result;
};

export const parseExcelFile = (file: File): Promise<Record<string, unknown>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Excel文件解析失败，请检查文件格式'));
      }
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
};

export const exportToExcel = (records: PumpRecord[], filename: string): void => {
  const exportData = records.map((record) => ({
    '泵编号': record.pumpCode,
    '泵名称': record.pumpName,
    '位置': record.location,
    '状态': getStatusText(record.status),
    '温度(°C)': record.temperature ?? '',
    '压力(MPa)': record.pressure ?? '',
    '流量(m³/h)': record.flowRate ?? '',
    '振动(mm/s)': record.vibration ?? '',
    '运行小时': record.runningHours ?? '',
    '上次维护': record.lastMaintenance ?? '',
    '巡检人员': record.inspector ?? '',
    '巡检时间': record.inspectionTime,
    '备注': record.remarks ?? '',
    '数据来源': record.source === 'manual' ? '手工补录' : record.source === 'import' ? '导入' : '系统',
    '张工手工补录': record.manualEntry ? '是' : '否',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '冷却液泵巡检记录');

  if (records.some((r) => r.startStopLogs && r.startStopLogs.length > 0)) {
    const startStopData: Record<string, unknown>[] = [];
    records.forEach((record) => {
      if (record.startStopLogs) {
        record.startStopLogs.forEach((log) => {
          startStopData.push({
            '泵编号': record.pumpCode,
            '泵名称': record.pumpName,
            '时间': log.timestamp,
            '操作': log.action === 'start' ? '启动' : '停机',
            '操作人员': log.operator,
            '原因': log.reason ?? '',
          });
        });
      }
    });
    if (startStopData.length > 0) {
      const startStopSheet = XLSX.utils.json_to_sheet(startStopData);
      XLSX.utils.book_append_sheet(workbook, startStopSheet, '启停记录');
    }
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const getStatusText = (status: PumpStatus): string => {
  switch (status) {
    case 'normal': return '正常';
    case 'warning': return '预警';
    case 'abnormal': return '异常';
    case 'empty': return '数据缺失';
    default: return '未知';
  }
};

export const getStatusColor = (status: PumpStatus): string => {
  switch (status) {
    case 'normal': return 'bg-status-normal';
    case 'warning': return 'bg-status-warning';
    case 'abnormal': return 'bg-status-abnormal';
    case 'empty': return 'bg-status-empty';
    default: return 'bg-gray-400';
  }
};

export const getStatusTextColor = (status: PumpStatus): string => {
  switch (status) {
    case 'normal': return 'text-status-normal';
    case 'warning': return 'text-status-warning';
    case 'abnormal': return 'text-status-abnormal';
    case 'empty': return 'text-status-empty';
    default: return 'text-gray-400';
  }
};

export const createManualRecord = (data: Partial<PumpRecord>): PumpRecord => {
  const now = new Date();
  const record: PumpRecord = {
    id: generateId(),
    pumpCode: data.pumpCode || 'CP-005',
    pumpName: data.pumpName || '5号应急冷却泵',
    location: data.location || 'C区备用电站',
    temperature: data.temperature ?? 24.2,
    pressure: data.pressure ?? 0.32,
    flowRate: data.flowRate ?? 110.5,
    vibration: data.vibration ?? 2.0,
    runningHours: data.runningHours ?? 1250,
    lastMaintenance: data.lastMaintenance || '2026-05-25',
    inspector: data.inspector || '张工',
    inspectionTime: data.inspectionTime || now.toISOString(),
    remarks: data.remarks || '张工手工补录：应急泵月度测试完成',
    source: 'manual',
    manualEntry: true,
    status: 'normal',
    startStopLogs: data.startStopLogs || [
      {
        timestamp: now.toISOString(),
        action: 'start',
        operator: '张工',
        reason: '手工补录：启停测试',
      },
    ],
  };

  record.status = determineStatus(record);
  return record;
};

export const addStartStopLog = (
  record: PumpRecord,
  log: Omit<StartStopLog, 'timestamp'>
): PumpRecord => {
  const newLog: StartStopLog = {
    ...log,
    timestamp: new Date().toISOString(),
  };

  return {
    ...record,
    startStopLogs: [...(record.startStopLogs || []), newLog],
  };
};

export const validatePumpCode = (code: string, existingRecords: PumpRecord[], excludeId?: string): boolean => {
  const normalized = normalizePumpCode(code);
  return !existingRecords.some(
    (r) => r.id !== excludeId && normalizePumpCode(r.pumpCode) === normalized
  );
};
