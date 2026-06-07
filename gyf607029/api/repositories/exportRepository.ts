import { db } from '../data/db.js';
import type { ExportRecord, ExportDiffItem, CorrectionRecord } from '../../shared/types.js';
import { findAuthorizationsByIds } from './authRepository.js';

function rowToExport(row: any): ExportRecord {
  return {
    id: row.id,
    operator: row.operator,
    format: row.format,
    filterCriteria: row.filter_criteria ?? '',
    pageCount: row.page_count,
    exportCount: row.export_count,
    diffCount: row.diff_count,
    status: row.status,
    missingIds: row.missing_ids ?? '[]',
    createdAt: row.created_at,
    remark: row.remark ?? undefined,
  };
}

export function createExportRecord(
  operator: string,
  format: 'csv' | 'markdown',
  filterCriteria: Record<string, any>,
  pageCount: number,
  exportCount: number,
  diffCount: number,
  status: ExportRecord['status'],
  missingIds: string[],
  remark?: string
): ExportRecord {
  const id = 'E' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  db.prepare(`
    INSERT INTO export_records (id, operator, format, filter_criteria, page_count, export_count, diff_count, status, missing_ids, created_at, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, operator, format,
    JSON.stringify(filterCriteria),
    pageCount, exportCount, diffCount, status,
    JSON.stringify(missingIds),
    new Date().toISOString(),
    remark ?? null,
  );
  return findExportById(id)!;
}

export function findAllExports(): ExportRecord[] {
  const rows = db.prepare('SELECT * FROM export_records ORDER BY created_at DESC').all() as any[];
  return rows.map(rowToExport);
}

export function findExportById(id: string): ExportRecord | null {
  const row = db.prepare('SELECT * FROM export_records WHERE id = ?').get(id) as any;
  return row ? rowToExport(row) : null;
}

export async function getExportDiff(exportId: string): Promise<ExportDiffItem[]> {
  const exp = findExportById(exportId);
  if (!exp) return [];
  let ids: string[] = [];
  try {
    ids = JSON.parse(exp.missingIds || '[]');
  } catch {
    ids = [];
  }
  if (ids.length === 0) return [];
  const auths = findAuthorizationsByIds(ids);
  const reasons: Record<string, string> = {};
  if (exp.status === 'partial') {
    auths.forEach(a => { reasons[a.id] = a.materials.some(m => m.status === 'missing') ? '材料缺页（缺失授权书或身份证件）' : '数据校验不通过'; });
  } else if (exp.status === 'rejected') {
    auths.forEach(a => { reasons[a.id] = '导出数量与页面数量不一致，需主管复查'; });
  }
  return auths.map(a => ({
    authId: a.id,
    babyName: a.babyName,
    parentPhone: a.parentPhone,
    reason: reasons[a.id] ?? '未知原因',
  }));
}

function rowToCorrection(row: any): CorrectionRecord {
  return {
    id: row.id,
    authId: row.auth_id,
    beforeData: row.before_data,
    afterData: row.after_data,
    reason: row.reason,
    operator: row.operator,
    reviewedBy: row.reviewed_by ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function findCorrectionsByStatus(status?: string): CorrectionRecord[] {
  if (status) {
    const rows = db.prepare('SELECT * FROM corrections WHERE status = ? ORDER BY created_at DESC').all(status) as any[];
    return rows.map(rowToCorrection);
  }
  const rows = db.prepare('SELECT * FROM corrections ORDER BY created_at DESC').all() as any[];
  return rows.map(rowToCorrection);
}

export function createCorrection(
  authId: string,
  beforeData: Record<string, any>,
  afterData: Record<string, any>,
  reason: string,
  operator: string
): CorrectionRecord {
  const id = 'C' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  db.prepare(`
    INSERT INTO corrections (id, auth_id, before_data, after_data, reason, operator, reviewed_by, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, authId,
    JSON.stringify(beforeData),
    JSON.stringify(afterData),
    reason, operator,
    null, 'pending',
    new Date().toISOString(),
  );
  const row = db.prepare('SELECT * FROM corrections WHERE id = ?').get(id) as any;
  return rowToCorrection(row);
}

export function findAllCorrections(): CorrectionRecord[] {
  const rows = db.prepare('SELECT * FROM corrections ORDER BY created_at DESC').all() as any[];
  return rows.map(rowToCorrection);
}
