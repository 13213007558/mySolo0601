import type { ExportResult } from '@/types';

export function toCSV<T extends Record<string, unknown>>(data: T[], headers?: string[]): string {
  if (data.length === 0) return headers ? headers.join(',') : '';

  const keys = headers ?? (Object.keys(data[0]) as string[]);

  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [keys.join(',')];
  for (const row of data) {
    rows.push(keys.map((k) => escape(row[k])).join(','));
  }

  return '\uFEFF' + rows.join('\n');
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: string[]
): ExportResult {
  try {
    const csv = toCSV(data, headers);
    const dataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    downloadDataUrl(dataUrl, filename);

    return {
      success: true,
      totalCount: data.length,
      successCount: data.length,
      failedCount: 0,
      failedItems: [],
      dataUrl,
      data,
      format: 'csv',
    };
  } catch (err) {
    return {
      success: false,
      totalCount: data.length,
      successCount: 0,
      failedCount: data.length,
      failedItems: data.map((_, i) => ({ rowIndex: i, reason: err instanceof Error ? err.message : '导出失败' })),
      format: 'csv',
    };
  }
}

export function downloadJSON<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): ExportResult {
  try {
    const json = JSON.stringify(data, null, 2);
    const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
    downloadDataUrl(dataUrl, filename);

    return {
      success: true,
      totalCount: data.length,
      successCount: data.length,
      failedCount: 0,
      failedItems: [],
      dataUrl,
      data,
      format: 'json',
    };
  } catch (err) {
    return {
      success: false,
      totalCount: data.length,
      successCount: 0,
      failedCount: data.length,
      failedItems: data.map((_, i) => ({ rowIndex: i, reason: err instanceof Error ? err.message : '导出失败' })),
      format: 'json',
    };
  }
}
