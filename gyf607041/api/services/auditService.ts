import db from '../db/database.js';
import type { OperationLog } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

export function logOperation(
  operator: string,
  action: string,
  targetType: string,
  targetId: string,
  beforeChange: any = null,
  afterChange: any = null
): void {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (id, operator, action, target_type, target_id, before_change_json, after_change_json, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    uuidv4(),
    operator,
    action,
    targetType,
    targetId,
    beforeChange ? JSON.stringify(beforeChange) : null,
    afterChange ? JSON.stringify(afterChange) : null,
    new Date().toISOString()
  );
}

export function getOperationLogs(targetType?: string, targetId?: string, limit = 200): OperationLog[] {
  let query = 'SELECT * FROM operation_logs';
  const params: any[] = [];
  const conditions: string[] = [];

  if (targetType) {
    conditions.push('target_type = ?');
    params.push(targetType);
  }
  if (targetId) {
    conditions.push('target_id = ?');
    params.push(targetId);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(row => ({
    id: row.id,
    operator: row.operator,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    beforeChange: row.before_change_json ? JSON.parse(row.before_change_json) : null,
    afterChange: row.after_change_json ? JSON.parse(row.after_change_json) : null,
    timestamp: row.timestamp,
  }));
}
