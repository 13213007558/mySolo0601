import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { nanoid } from 'nanoid';
import {
  MeterRecord,
  ProblemRecord,
  ParseResult,
  ParsedRecord,
  OperatorName,
  RecordSource,
} from '@/types';
import { validateRecord, sanitizeValue } from './validation';

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

function normalizeRow(
  row: Record<string, unknown>,
  index: number
): ParsedRecord {
  const getValue = (keys: string[]): unknown => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return row[key];
      }
    }
    return '';
  };

  return {
    meterNo: String(sanitizeValue(getValue(['meterNo', '电表编号', '编号', 'meter_no'])) || ''),
    reading: parseNumber(getValue(['reading', '读数', '电表读数', 'current_reading'])),
    readingTime: String(sanitizeValue(getValue(['readingTime', '抄表时间', '时间', '日期', 'reading_time'])) || ''),
    multiplier: parseNumber(getValue(['multiplier', '倍率', '变比', 'ct_ratio'])),
    ...row,
  };
}

function createMeterRecord(
  parsed: ParsedRecord,
  source: RecordSource,
  operator: OperatorName,
  rowIndex: number
): MeterRecord {
  const readingTime = new Date(parsed.readingTime);
  const multiplier = parsed.multiplier || 1;
  const calculatedValue = parsed.reading * multiplier;

  return {
    id: nanoid(12),
    meterNo: parsed.meterNo,
    reading: parsed.reading,
    readingTime,
    multiplier,
    calculatedValue,
    source,
    importedAt: new Date(),
    operator,
    rowIndex,
  };
}

function createProblemRecord(
  parsed: ParsedRecord,
  source: RecordSource,
  operator: OperatorName,
  errorType: ProblemRecord['errorType'],
  errorMessage: string,
  rowIndex: number
): ProblemRecord {
  const readingTime = parsed.readingTime ? new Date(parsed.readingTime) : new Date();
  const multiplier = parsed.multiplier || 0;

  return {
    id: nanoid(12),
    meterNo: parsed.meterNo || `未知-${rowIndex}`,
    reading: parsed.reading || 0,
    readingTime,
    multiplier,
    calculatedValue: (parsed.reading || 0) * multiplier,
    source,
    importedAt: new Date(),
    operator,
    rowIndex,
    errorType,
    errorMessage,
    status: 'pending',
    originalData: { ...parsed },
  };
}

export async function parseCSVFile(
  file: File,
  operator: OperatorName
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const normalRecords: MeterRecord[] = [];
    const problemRecords: ProblemRecord[] = [];

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        results.data.forEach((row, index) => {
          if (!row || Object.keys(row).length === 0) return;

          const parsed = normalizeRow(row, index + 1);
          const validation = validateRecord(parsed);

          if (validation.isValid) {
            normalRecords.push(
              createMeterRecord(parsed, 'csv', operator, index + 1)
            );
          } else {
            problemRecords.push(
              createProblemRecord(
                parsed,
                'csv',
                operator,
                validation.errorType!,
                validation.errorMessage!,
                index + 1
              )
            );
          }
        });

        resolve({
          normalRecords,
          problemRecords,
          totalCount: normalRecords.length + problemRecords.length,
          normalCount: normalRecords.length,
          problemCount: problemRecords.length,
        });
      },
      error: (error) => {
        reject(new Error(`CSV解析失败: ${error.message}`));
      },
    });
  });
}

export async function parseExcelFile(
  file: File,
  operator: OperatorName
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          firstSheet,
          { defval: '' }
        );

        const normalRecords: MeterRecord[] = [];
        const problemRecords: ProblemRecord[] = [];

        jsonData.forEach((row, index) => {
          if (!row || Object.keys(row).length === 0) return;

          const parsed = normalizeRow(row, index + 1);
          const validation = validateRecord(parsed);

          if (validation.isValid) {
            normalRecords.push(
              createMeterRecord(parsed, 'excel', operator, index + 1)
            );
          } else {
            problemRecords.push(
              createProblemRecord(
                parsed,
                'excel',
                operator,
                validation.errorType!,
                validation.errorMessage!,
                index + 1
              )
            );
          }
        });

        resolve({
          normalRecords,
          problemRecords,
          totalCount: normalRecords.length + problemRecords.length,
          normalCount: normalRecords.length,
          problemCount: problemRecords.length,
        });
      } catch (error) {
        reject(new Error(`Excel解析失败: ${(error as Error).message}`));
      }
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(
  file: File,
  operator: OperatorName
): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSVFile(file, operator);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcelFile(file, operator);
  } else {
    throw new Error(`不支持的文件格式: .${extension}`);
  }
}

export function revalidateRecord(
  record: ProblemRecord,
  updates: Partial<MeterRecord>
): { isValid: boolean; errorMessage?: string } {
  const updated: ParsedRecord = {
    meterNo: updates.meterNo || record.meterNo,
    reading: updates.reading ?? record.reading,
    readingTime: (updates.readingTime || record.readingTime).toISOString(),
    multiplier: updates.multiplier ?? record.multiplier,
  };

  const result = validateRecord(updated);
  return {
    isValid: result.isValid,
    errorMessage: result.errorMessage,
  };
}
