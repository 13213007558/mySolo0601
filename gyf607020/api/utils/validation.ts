import type { DataIssue, MilkRecord } from '../../shared/types';

export function validatePhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-]/g, '');
  return /^1[3-9]\d{9}$/.test(clean);
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-]/g, '');
}

export function maskPhone(phone: string): string {
  const clean = normalizePhone(phone);
  if (clean.length < 7) return clean;
  return clean.slice(0, 3) + '****' + clean.slice(-4);
}

export function maskIdCard(id?: string): string {
  if (!id) return '';
  if (id.length < 8) return id;
  return id.slice(0, 4) + '**********' + id.slice(-4);
}

export function detectDataIssues(record: {
  parentPhone: string;
  parentIdCard?: string;
}): DataIssue[] {
  const issues: DataIssue[] = [];

  if (!validatePhone(record.parentPhone)) {
    issues.push({
      type: 'phone_format',
      field: 'parentPhone',
      reason: '手机号格式不符合中国大陆 11 位标准',
      originalValue: record.parentPhone,
      expectedFormat: '1 开头的 11 位纯数字，如 13812345678',
    });
  }

  if (record.parentIdCard && record.parentIdCard.length >= 15) {
    const id = record.parentIdCard;
    const sensitivePatterns = [/\d{17}[\dXx]/, /\d{15}/];
    if (sensitivePatterns.some((p) => p.test(id))) {
      issues.push({
        type: 'privacy_leak',
        field: 'parentIdCard',
        reason: '身份证号为敏感隐私字段，导出时会脱敏但录入时建议使用其他标识',
        originalValue: id.slice(0, 6) + '********' + id.slice(-4),
        expectedFormat: '建议使用授权编号替代完整身份证号存储',
      });
    }
  }

  return issues;
}

export function formatStatus(status: MilkRecord['status']): string {
  const map: Record<MilkRecord['status'], string> = {
    pending: '待复核',
    approved: '已通过',
    rejected: '已拒绝',
    bad_data: '坏数据',
  };
  return map[status];
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
