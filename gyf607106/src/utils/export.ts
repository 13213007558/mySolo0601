import type { OilTempRecord, SupplementRecord } from '@/types';

interface ExportData {
  version: string;
  exportedAt: number;
  records: OilTempRecord[];
  supplementRecords: SupplementRecord[];
}

export function exportToJSON(
  records: OilTempRecord[],
  supplementRecords: SupplementRecord[]
): string {
  const data: ExportData = {
    version: '1.0.0',
    exportedAt: Date.now(),
    records,
    supplementRecords,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCSV(records: OilTempRecord[], filename: string): void {
  const headers = ['设备名称', '测点', '时间', '油温(℃)', '状态', '备注', '修改人', '修改时间'];
  const rows = records.map(r => [
    r.deviceName,
    r.measurePoint,
    r.timestamp,
    r.temperature,
    getStatusLabel(r.status),
    r.remark || '',
    r.modifiedBy || '',
    new Date(r.modifiedAt).toLocaleString('zh-CN'),
  ]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    normal: '正常',
    abnormal: '异常',
    pending: '待复核',
    unmarked: '未标记',
  };
  return map[status] || status;
}

export function parseImportData(jsonString: string): ExportData | null {
  try {
    const data = JSON.parse(jsonString) as ExportData;
    if (!data.records || !Array.isArray(data.records)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function validateRecord(record: Partial<OilTempRecord>): boolean {
  return !!(
    record.id &&
    record.deviceName &&
    record.measurePoint &&
    record.timestamp &&
    typeof record.temperature === 'number' &&
    record.status
  );
}
