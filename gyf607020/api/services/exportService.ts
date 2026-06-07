import type { MilkRecord, ListFilters, ExportRow } from '../../shared/types';
import { recordRepo } from '../repositories/recordRepository';
import { formatStatus, maskPhone, maskIdCard } from '../utils/validation';

function toExportRow(r: MilkRecord, index: number): ExportRow {
  return {
    序号: index + 1,
    婴儿姓名: r.babyName,
    家长手机号: maskPhone(r.parentPhone),
    奶量数量: r.milkUnit === 'bottle' ? `${r.milkQuantity} 瓶` : `${r.milkQuantity} ml`,
    状态: formatStatus(r.status),
    原因: r.reviewReason || '',
    处理人: r.handlerName || '',
  };
}

function csvEscape(value: string | number): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export interface ExportResult {
  csv: string;
  count: number;
  filters: ListFilters;
}

export function buildExport(filters: ListFilters): ExportResult {
  const records = recordRepo.list(filters).filter((r) => !r.isBadData);
  const rows = records.map(toExportRow);

  if (rows.length === 0) {
    return { csv: '暂无数据\n', count: 0, filters };
  }

  const headers = Object.keys(rows[0]) as (keyof ExportRow)[];
  const headerLine = headers.map(csvEscape).join(',');
  const bodyLines = rows.map((row) => headers.map((h) => csvEscape(row[h])).join(','));

  const csv = [headerLine, ...bodyLines].join('\n') + '\n';
  return { csv, count: rows.length, filters };
}

export function verifyCount(filters: ListFilters, expectedCount: number): boolean {
  const records = recordRepo.list(filters).filter((r) => !r.isBadData);
  return records.length === expectedCount;
}
