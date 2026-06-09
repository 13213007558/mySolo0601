import * as XLSX from 'xlsx';
import type { HotSpotRecord, UserRole, ExportOptions } from '@/types';
import { desensitizeRecords } from './desensitize';
import { ROLE_CONFIGS } from '@/config/roles';

function prepareExportData(records: HotSpotRecord[], options: ExportOptions): Record<string, unknown>[] {
  const config = ROLE_CONFIGS[options.role];
  let exportRecords = [...records];
  
  if (!config.canViewSensitiveData) {
    exportRecords = desensitizeRecords(exportRecords, options.role);
  }
  
  return exportRecords.map(record => ({
    '记录ID': record.id,
    '组件编号': record.componentId,
    '电站名称': record.stationName,
    '位置': record.location,
    '热斑等级': record.hotSpotLevel,
    '状态': record.status,
    '检测日期': record.detectedDate,
    '处理日期': record.processedDate || '',
    '处理人': record.processedBy,
    '供应商报价版本': record.supplierQuoteVersion,
    '当前撤回原因': record.currentWithdrawReason,
    '原始撤回原因': record.originalWithdrawReason,
    '内部字段编码': record.internalFieldCode,
    '是否补录': record.isManuallySupplemented ? '是' : '否',
    '补录人': record.supplementedBy || '',
    '补录时间': record.supplementedAt || '',
    '组件成本(元)': record.sensitiveData.componentCost,
    '维修成本(元)': record.sensitiveData.repairCost,
    '供应商联系人': record.sensitiveData.supplierContact,
    '内部备注': record.sensitiveData.internalComments,
    '复测图片数量': record.recheckImages.length,
    '版本数量': record.versionHistory.length,
    '一致性校验ID': record._consistencyCheckId,
  }));
}

export function exportToExcel(records: HotSpotRecord[], options: ExportOptions): void {
  const exportData = prepareExportData(records, options);
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 10 },
    { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
    { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
    { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 },
    { wch: 12 }, { wch: 10 }, { wch: 25 },
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, '热斑巡检记录');
  
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const roleStr = ROLE_CONFIGS[options.role].roleName;
  const fileName = `热斑巡检记录_${roleStr}_${dateStr}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
}

export function exportToCSV(records: HotSpotRecord[], options: ExportOptions): void {
  const exportData = prepareExportData(records, options);
  
  if (exportData.length === 0) return;
  
  const headers = Object.keys(exportData[0]);
  const csvContent = [
    headers.join(','),
    ...exportData.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const roleStr = ROLE_CONFIGS[options.role].roleName;
  const fileName = `热斑巡检记录_${roleStr}_${dateStr}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readImportedFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json as Record<string, unknown>[]);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

export function exportSingleRecord(record: HotSpotRecord, options: ExportOptions): void {
  exportToExcel([record], options);
}
