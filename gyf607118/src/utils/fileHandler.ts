import Papa from 'papaparse';
import type { BatteryRecord, SupplementRecord, DiffItem } from '../types';
import { detectBatteryNoFormat, checkAnomaly, generateId, formatDateTime } from './validation';

const CSV_HEADERS = [
  'batteryNo',
  'exchangeDate',
  'location',
  'operator',
  'voltage',
  'temperature',
  'remark',
];

const CSV_HEADER_NAMES: Record<string, string> = {
  batteryNo: '电池编号',
  exchangeDate: '换电日期',
  location: '换电地点',
  operator: '操作人员',
  voltage: '电压(V)',
  temperature: '温度(°C)',
  remark: '备注',
};

export interface ImportResult {
  success: boolean;
  records: Omit<BatteryRecord, 'id' | 'originalBatteryNo' | 'originalStatus' | 'createdAt' | 'updatedAt'>[];
  errors: string[];
  warnings: string[];
}

export const parseCSVFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const records: ImportResult['records'] = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        
        if (data.length === 0) {
          resolve({ success: false, records: [], errors: ['CSV文件为空'], warnings: [] });
          return;
        }

        const headerMap = createHeaderMapping(results.meta.fields || []);
        
        data.forEach((row, index) => {
          try {
            const record = parseRow(row, headerMap, index);
            records.push(record);
            
            const formatIssue = detectBatteryNoFormat(record.batteryNo);
            if (formatIssue.hasIssue) {
              warnings.push(`第${index + 2}行: ${formatIssue.message}`);
            }
          } catch (error) {
            errors.push(`第${index + 2}行: ${(error as Error).message}`);
          }
        });

        resolve({
          success: errors.length === 0,
          records,
          errors,
          warnings,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          records: [],
          errors: [`解析CSV失败: ${error.message}`],
          warnings: [],
        });
      },
    });
  });
};

const createHeaderMapping = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  
  headers.forEach(header => {
    const trimmed = header.trim();
    for (const [key, name] of Object.entries(CSV_HEADER_NAMES)) {
      if (trimmed === name || trimmed === key) {
        mapping[key] = header;
        break;
      }
    }
  });
  
  CSV_HEADERS.forEach(key => {
    if (!mapping[key] && headers.includes(key)) {
      mapping[key] = key;
    }
  });
  
  return mapping;
};

const parseRow = (
  row: Record<string, string>,
  headerMap: Record<string, string>,
  rowIndex: number
): ImportResult['records'][0] => {
  const getValue = (key: string): string => {
    const actualKey = headerMap[key] || key;
    return (row[actualKey] || '').trim();
  };

  const batteryNo = getValue('batteryNo');
  if (!batteryNo) {
    throw new Error('电池编号不能为空');
  }

  const exchangeDate = getValue('exchangeDate');
  if (!exchangeDate) {
    throw new Error('换电日期不能为空');
  }

  const voltage = parseFloat(getValue('voltage'));
  if (isNaN(voltage)) {
    throw new Error('电压必须是数字');
  }

  const temperature = parseFloat(getValue('temperature'));
  if (isNaN(temperature)) {
    throw new Error('温度必须是数字');
  }

  const formatIssue = detectBatteryNoFormat(batteryNo);
  
  const tempRecord = {
    batteryNo,
    voltage,
    temperature,
    exchangeDate,
  };
  
  const anomalyCheck = checkAnomaly(tempRecord, []);

  return {
    batteryNo,
    status: 'pending',
    exchangeDate,
    location: getValue('location') || '未知',
    operator: getValue('operator') || '未知',
    voltage,
    temperature,
    remark: getValue('remark') || '',
    formatIssue: formatIssue.hasIssue ? formatIssue.message : null,
    isAnomaly: anomalyCheck.isAnomaly,
    anomalyReason: anomalyCheck.isAnomaly ? anomalyCheck.reasons.join('；') : null,
    reviewedBy: null,
    reviewedAt: null,
  };
};

export const exportToCSV = (records: BatteryRecord[], type: 'normal' | 'all' | 'full'): string => {
  let filteredRecords = records;
  
  if (type === 'normal') {
    filteredRecords = records.filter(r => r.status === 'normal');
  }

  const exportData = filteredRecords.map(record => {
    const baseData = {
      [CSV_HEADER_NAMES.batteryNo]: record.batteryNo,
      [CSV_HEADER_NAMES.exchangeDate]: record.exchangeDate,
      [CSV_HEADER_NAMES.location]: record.location,
      [CSV_HEADER_NAMES.operator]: record.operator,
      [CSV_HEADER_NAMES.voltage]: record.voltage,
      [CSV_HEADER_NAMES.temperature]: record.temperature,
      [CSV_HEADER_NAMES.remark]: record.remark,
    };

    if (type === 'full') {
      return {
        ...baseData,
        '原始编号': record.originalBatteryNo,
        '状态': record.status,
        '是否异常': record.isAnomaly ? '是' : '否',
        '异常原因': record.anomalyReason || '',
        '格式问题': record.formatIssue || '',
        '复核人': record.reviewedBy || '',
        '复核时间': record.reviewedAt || '',
        '创建时间': record.createdAt,
        '更新时间': record.updatedAt,
      };
    }

    return baseData;
  });

  return Papa.unparse(exportData);
};

export const exportToJSON = (
  records: BatteryRecord[],
  supplementRecords: SupplementRecord[],
  operationLogs: any[]
): string => {
  return JSON.stringify(
    {
      exportTime: formatDateTime(new Date()),
      version: '1.0.0',
      records,
      supplementRecords,
      operationLogs,
    },
    null,
    2
  );
};

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const compareRecords = (
  before: Partial<BatteryRecord | SupplementRecord> | null,
  after: Partial<BatteryRecord | SupplementRecord> | null
): DiffItem[] => {
  if (!before || !after) return [];

  const fields = Object.keys({ ...before, ...after });
  
  return fields.map(field => {
    const beforeVal = before[field as keyof typeof before] ?? null;
    const afterVal = after[field as keyof typeof after] ?? null;
    
    return {
      field,
      before: beforeVal as string | number | null,
      after: afterVal as string | number | null,
      isDifferent: String(beforeVal) !== String(afterVal),
    };
  });
};

export const generateCSVTemplate = (): string => {
  const headers = Object.values(CSV_HEADER_NAMES).join(',');
  const sampleRow = [
    'B-202406-0001',
    '2024-06-15',
    'A区换电站',
    '张师傅',
    '3.8',
    '25',
    '正常换电',
  ].join(',');
  
  return `${headers}\n${sampleRow}`;
};

export const supplementExportToCSV = (records: SupplementRecord[]): string => {
  const headers = [
    '电池编号',
    '电池箱编号',
    '流转日期',
    '转出地点',
    '转入地点',
    '操作人',
    '是否手工补录',
    '备注',
    '创建时间',
  ];

  const rows = records.map(r => [
    r.batteryNo,
    r.boxNo,
    r.transferDate,
    r.fromLocation,
    r.toLocation,
    r.operator,
    r.isManual ? '是' : '否',
    r.remark,
    r.createdAt,
  ]);

  return Papa.unparse({ fields: headers, data: rows });
};

export const parseSupplementCSV = (file: File): Promise<SupplementRecord[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        const records: SupplementRecord[] = [];

        data.forEach((row, index) => {
          try {
            const get = (key: string) => (row[key] || '').trim();
            
            const record: SupplementRecord = {
              id: generateId(),
              batteryNo: get('电池编号') || get('batteryNo'),
              boxNo: get('电池箱编号') || get('boxNo'),
              transferDate: get('流转日期') || get('transferDate'),
              fromLocation: get('转出地点') || get('fromLocation'),
              toLocation: get('转入地点') || get('toLocation'),
              operator: get('操作人') || get('operator') || '小廖',
              remark: get('备注') || get('remark') || '',
              isManual: (get('是否手工补录') || get('isManual')) === '是' || false,
              beforeData: null,
              afterData: null,
              createdAt: new Date().toISOString(),
            };

            if (!record.batteryNo) {
              throw new Error(`第${index + 2}行: 电池编号不能为空`);
            }

            records.push(record);
          } catch (error) {
            console.warn(`跳过第${index + 2}行: ${(error as Error).message}`);
          }
        });

        resolve(records);
      },
      error: reject,
    });
  });
};
