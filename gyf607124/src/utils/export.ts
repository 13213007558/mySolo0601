import * as XLSX from 'xlsx';
import type { ValveRecord, Contract } from '@/types';
import { STATUS_LABELS } from '@/types';

export interface ExportOptions {
  includeContracts?: boolean;
  dateRange?: [string, string];
}

export function exportToExcel(
  records: ValveRecord[],
  contracts: Contract[],
  options: ExportOptions = {}
): void {
  const { includeContracts = false } = options;

  const recordData = records.map(r => ({
    '记录日期': r.recordDate,
    '阀门编号': r.valveNo,
    '开度(%)': r.opening,
    '温度(°C)': r.temperature,
    '压力(MPa)': r.pressure,
    '状态': STATUS_LABELS[r.status],
    '操作人': r.operator,
    '关联合同': r.contractId || '-',
    '备注': r.remarks || '-',
    '创建时间': r.createdAt,
    '更新时间': r.updatedAt,
  }));

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(recordData);
  XLSX.utils.book_append_sheet(wb, ws1, '阀门记录');

  if (includeContracts) {
    const contractData = contracts.map(c => ({
      '合同编号': c.contractNo,
      '合同日期': c.contractDate,
      '文件名': c.fileName,
      '上传人': c.uploader,
      '上传时间': c.uploadedAt,
    }));
    const ws2 = XLSX.utils.json_to_sheet(contractData);
    XLSX.utils.book_append_sheet(wb, ws2, '合同扫描件');
  }

  const fileName = `锅炉余热巡检记录_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export interface ImportResult {
  success: boolean;
  records: Partial<ValveRecord>[];
  errors: string[];
}

export function importFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

        const records: Partial<ValveRecord>[] = [];
        const errors: string[] = [];

        jsonData.forEach((row, index) => {
          if (!row['阀门编号']) {
            errors.push(`第 ${index + 2} 行：缺少阀门编号`);
            return;
          }

          const record: Partial<ValveRecord> = {
            recordDate: row['记录日期'] || new Date().toISOString().split('T')[0],
            valveNo: row['阀门编号'],
            opening: Number(row['开度(%)']) || 0,
            temperature: Number(row['温度(°C)']) || 0,
            pressure: Number(row['压力(MPa)']) || 0,
            status: row['状态'] === '异常' ? 'abnormal' : row['状态'] === '手工补录' ? 'manual' : 'normal',
            operator: row['操作人'] || '导入',
            remarks: row['备注'] === '-' ? undefined : row['备注'],
            isDeleted: false,
          };

          records.push(record);
        });

        resolve({
          success: errors.length === 0,
          records,
          errors,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
