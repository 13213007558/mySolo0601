import Papa from 'papaparse';
import type { AcceptanceRecord } from '@/types';
import { ACCEPTANCE_STATUS_LABELS } from '@/types';
import { formatDateChinese } from './date';

export interface ExportRecord {
  编号: string;
  项目名称: string;
  轴线: string;
  部位: string;
  工序类型: string;
  验收日期: string;
  封模日期: string;
  状态: string;
  退回原因: string;
  证据数量: number;
  验收单: string;
  现场照片: string;
  补签说明: string;
  描述: string;
  创建人: string;
  创建时间: string;
  更新时间: string;
}

export function exportToCSV(records: AcceptanceRecord[]): string {
  const exportData: ExportRecord[] = records.map((record) => ({
    编号: record.id,
    项目名称: record.projectName,
    轴线: record.axis,
    部位: record.location,
    工序类型: record.workType,
    验收日期: formatDateChinese(record.acceptanceDate),
    封模日期: formatDateChinese(record.formworkDate),
    状态: ACCEPTANCE_STATUS_LABELS[record.status],
    退回原因: record.rejectReason || '',
    证据数量: record.evidence.length,
    验收单: record.evidence.filter((e) => e.type === 'ACCEPTANCE_FORM').length > 0 ? '有' : '无',
    现场照片: record.evidence.filter((e) => e.type === 'SITE_PHOTO').length > 0 ? '有' : '无',
    补签说明: record.evidence.filter((e) => e.type === 'SUPPLEMENT_NOTE').length > 0 ? '有' : '无',
    描述: record.description,
    创建人: record.createdBy,
    创建时间: record.createdAt,
    更新时间: record.updatedAt
  }));

  return Papa.unparse(exportData, {
    header: true
  });
}

export function downloadCSV(records: AcceptanceRecord[], filename?: string): void {
  const csv = exportToCSV(records);
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `隐蔽工程验收记录_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importFromCSV(file: File): Promise<AcceptanceRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          const records: AcceptanceRecord[] = results.data
            .filter((row: any) => row.编号)
            .map((row: any) => ({
              id: row.编号,
              projectName: row.项目名称 || '',
              axis: row.轴线 || '',
              location: row.部位 || '',
              workType: row.工序类型 || '',
              acceptanceDate: row.验收日期 || '',
              formworkDate: row.封模日期 || '',
              description: row.描述 || '',
              status: 'DRAFT' as const,
              evidence: [],
              createdBy: row.创建人 || '导入',
              createdAt: row.创建时间 || new Date().toISOString(),
              updatedAt: row.更新时间 || new Date().toISOString()
            }));
          resolve(records);
        } catch (e) {
          reject(e);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
