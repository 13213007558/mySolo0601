import Papa from 'papaparse';
import * as authRepo from '../repositories/authRepository.js';
import * as auditRepo from '../repositories/auditRepository.js';
import * as exportRepo from '../repositories/exportRepository.js';
import type { Authorization } from '../../shared/types.js';

export interface ExportRequest {
  ids: string[];
  format: 'csv' | 'markdown';
  operator: string;
  filterCriteria: Record<string, any>;
  pageCount: number;
  allowPartial: boolean;
}

export interface ExportResult {
  status: 'success' | 'partial' | 'failed' | 'rejected';
  content?: string;
  filename: string;
  pageCount: number;
  exportCount: number;
  diffCount: number;
  missingIds: string[];
  exportRecordId: string;
  remark?: string;
}

function hasMissingMaterials(auth: Authorization): boolean {
  return auth.materials.some(m => m.status === 'missing');
}

export function validateExportConsistency(
  auths: Authorization[],
  pageCount: number
): { ok: boolean; missing: Authorization[]; extra: Authorization[] } {
  const missing: Authorization[] = [];
  auths.forEach(a => {
    if (hasMissingMaterials(a)) missing.push(a);
  });
  const ok = auths.length === pageCount && missing.length === 0;
  return { ok, missing, extra: [] };
}

export function toCSV(auths: Authorization[]): string {
  const rows = auths.map(a => ({
    '授权编号': a.id,
    '婴幼儿姓名': a.babyName,
    '出生日期': a.babyBirth ?? '',
    '家长姓名': a.parentName,
    '家长手机号': a.parentPhone,
    '所属门店': a.storeName,
    '授权类型': authTypeLabel(a.authType),
    '授权状态': authStatusLabel(a.authStatus),
    '接送人数量': a.pickups.length,
    '接送人详情': a.pickups.map(p => `${p.name}(${p.relation}${p.isPhoneAuth ? '，电话授权' : ''})`).join('；'),
    '材料状态': a.materials.length === 0 ? '未上传' : a.materials.map(m => `${m.name}:${materialStatusLabel(m.status)}`).join('；'),
    '创建时间': a.createdAt,
    '最后更新': a.updatedAt,
    '最后操作人': a.lastOperator,
  }));
  return Papa.unparse(rows, { header: true });
}

export function toMarkdown(auths: Authorization[], summary: { pageCount: number; exportCount: number; diffCount: number }): string {
  const lines: string[] = [];
  lines.push('# 婴幼儿接送授权清洗报告');
  lines.push('');
  lines.push(`- 生成时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push(`- 页面记录数：${summary.pageCount}`);
  lines.push(`- 实际导出数：${summary.exportCount}`);
  lines.push(`- 差异数：${summary.diffCount}`);
  lines.push('');
  lines.push('## 授权记录明细');
  lines.push('');
  auths.forEach((a, idx) => {
    lines.push(`### ${idx + 1}. ${a.babyName}（${a.id}）`);
    lines.push('');
    lines.push(`| 字段 | 内容 |`);
    lines.push(`|------|------|`);
    lines.push(`| 家长姓名 | ${a.parentName} |`);
    lines.push(`| 家长手机号 | ${a.parentPhone} |`);
    lines.push(`| 所属门店 | ${a.storeName} |`);
    lines.push(`| 授权类型 | ${authTypeLabel(a.authType)} |`);
    lines.push(`| 授权状态 | ${authStatusLabel(a.authStatus)} |`);
    lines.push(`| 接送人 | ${a.pickups.map(p => `${p.name}（${p.relation}${p.isPhoneAuth ? '，电话授权' : ''}，${p.phone}）`).join('；')} |`);
    lines.push(`| 材料 | ${a.materials.length === 0 ? '无' : a.materials.map(m => `- ${m.name}：${materialStatusLabel(m.status)}`).join('，')} |`);
    lines.push(`| 最后操作 | ${a.lastOperator} @ ${a.updatedAt} |`);
    lines.push('');
    if (a.materials.some(m => m.status === 'missing')) {
      lines.push('> ⚠️ 本记录存在材料缺页，属于部分成功导出。');
      lines.push('');
    }
  });
  return lines.join('\n');
}

export function authTypeLabel(t: string): string {
  switch (t) {
    case 'primary': return '常规授权';
    case 'temporary': return '临时授权';
    case 'phone': return '电话授权';
    default: return t;
  }
}

export function authStatusLabel(s: string): string {
  switch (s) {
    case 'active': return '有效';
    case 'revoked': return '已撤销';
    case 'expired': return '已过期';
    case 'pending': return '待审核';
    case 'failed': return '授权失败';
    case 'corrected': return '已人工更正';
    default: return s;
  }
}

export function materialStatusLabel(s: string): string {
  switch (s) {
    case 'ok': return '完整';
    case 'missing': return '缺页';
    case 'damaged': return '损坏';
    default: return s;
  }
}

export function performExport(req: ExportRequest): ExportResult {
  const auths = authRepo.findAuthorizationsByIds(req.ids);
  const consistency = validateExportConsistency(auths, req.pageCount);

  const missingIds = consistency.missing.map(a => a.id);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  if (!consistency.ok && !req.allowPartial && missingIds.length > 0) {
    const remark = `导出数量与页面不一致：页面${req.pageCount}条，可导出${auths.length - missingIds.length}条，差异${missingIds.length}条（含材料缺页）。已拒绝导出，请主管复查。`;
    const record = exportRepo.createExportRecord(
      req.operator, req.format, req.filterCriteria,
      req.pageCount, auths.length - missingIds.length, missingIds.length,
      'rejected', missingIds, remark,
    );
    auths.forEach(a => {
      auditRepo.createAudit(a.id, req.operator, 'store_manager', 'export', {
        reason: '导出一致性校验未通过，已拒绝',
      });
    });
    return {
      status: 'rejected',
      filename: '',
      pageCount: req.pageCount,
      exportCount: auths.length - missingIds.length,
      diffCount: missingIds.length,
      missingIds,
      exportRecordId: record.id,
      remark,
    };
  }

  if (consistency.ok) {
    const content = req.format === 'csv' ? toCSV(auths) : toMarkdown(auths, { pageCount: req.pageCount, exportCount: auths.length, diffCount: 0 });
    const filename = req.format === 'csv'
      ? `婴幼儿接送授权_${dateStr}.csv`
      : `婴幼儿接送授权_${dateStr}.md`;
    const record = exportRepo.createExportRecord(
      req.operator, req.format, req.filterCriteria,
      req.pageCount, auths.length, 0, 'success', [],
    );
    auths.forEach(a => {
      auditRepo.createAudit(a.id, req.operator, 'store_manager', 'export', { reason: '成功导出' });
    });
    return {
      status: 'success',
      content,
      filename,
      pageCount: req.pageCount,
      exportCount: auths.length,
      diffCount: 0,
      missingIds: [],
      exportRecordId: record.id,
    };
  }

  const exportedAuths = auths.filter(a => !missingIds.includes(a.id));
  const content = req.format === 'csv'
    ? toCSV(exportedAuths)
    : toMarkdown(exportedAuths, { pageCount: req.pageCount, exportCount: exportedAuths.length, diffCount: missingIds.length });
  const filename = req.format === 'csv'
    ? `婴幼儿接送授权_部分成功_${dateStr}.csv`
    : `婴幼儿接送授权_部分成功_${dateStr}.md`;
  const remark = `部分成功导出：共${req.pageCount}条，成功导出${exportedAuths.length}条，${missingIds.length}条因材料缺页未导出，已标记缺页状态。`;
  const record = exportRepo.createExportRecord(
    req.operator, req.format, req.filterCriteria,
    req.pageCount, exportedAuths.length, missingIds.length, 'partial', missingIds, remark,
  );
  auths.forEach(a => {
    auditRepo.createAudit(a.id, req.operator, 'store_manager', 'export', {
      reason: missingIds.includes(a.id) ? '因材料缺页未导出' : '成功导出',
    });
  });
  return {
    status: 'partial',
    content,
    filename,
    pageCount: req.pageCount,
    exportCount: exportedAuths.length,
    diffCount: missingIds.length,
    missingIds,
    exportRecordId: record.id,
    remark,
  };
}
