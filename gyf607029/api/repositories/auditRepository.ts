import { db } from '../data/db.js';
import type { AuditLog } from '../../shared/types.js';

function rowToAudit(row: any): AuditLog {
  return {
    id: row.id,
    authId: row.auth_id,
    operator: row.operator,
    operatorRole: row.operator_role,
    action: row.action,
    field: row.field ?? undefined,
    oldValue: row.old_value ?? undefined,
    newValue: row.new_value ?? undefined,
    reason: row.reason ?? undefined,
    timestamp: row.timestamp,
    ip: row.ip ?? undefined,
  };
}

export function findAuditsByAuthId(authId: string): AuditLog[] {
  const rows = db.prepare('SELECT * FROM audit_logs WHERE auth_id = ? ORDER BY timestamp DESC').all(authId) as any[];
  return rows.map(rowToAudit);
}

export function findAllAudits(filter: { action?: string; operator?: string; limit?: number } = {}): AuditLog[] {
  const conditions: string[] = [];
  const params: any[] = [];
  if (filter.action) {
    conditions.push('action = ?');
    params.push(filter.action);
  }
  if (filter.operator) {
    conditions.push('operator LIKE ?');
    params.push(`%${filter.operator}%`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filter.limit ?? 200;
  const rows = db.prepare(`SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC LIMIT ?`).all(...params, limit) as any[];
  return rows.map(rowToAudit);
}

export function createAudit(
  authId: string,
  operator: string,
  operatorRole: string,
  action: string,
  opts: { field?: string; oldValue?: string; newValue?: string; reason?: string; ip?: string } = {}
) {
  const id = 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  db.prepare(`
    INSERT INTO audit_logs (id, auth_id, operator, operator_role, action, field, old_value, new_value, reason, timestamp, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, authId, operator, operatorRole, action,
    opts.field ?? null,
    opts.oldValue ?? null,
    opts.newValue ?? null,
    opts.reason ?? null,
    new Date().toISOString(),
    opts.ip ?? null,
  );
  return id;
}
