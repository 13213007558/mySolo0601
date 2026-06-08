import { db } from '../db/init';
import { AuditLog, UserRole } from '../../shared/types';
import { filterPrivacyFields } from '../middleware/privacyFilter';

function mapAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    operationType: row.operation_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    operatorId: row.operator_id,
    operatorRole: row.operator_role,
    operatorName: row.operator_name,
    ipAddress: row.ip_address,
    requestParams: row.request_params,
    responseData: row.response_data,
    success: row.success === 1,
    errorMessage: row.error_message,
    timestamp: row.timestamp
  };
}

export function getAuditLogs(params: {
  entityType?: string;
  entityId?: string;
  operatorId?: string;
  startTime?: string;
  endTime?: string;
  userRole?: UserRole;
} = {}): AuditLog[] {
  let sql = `
    SELECT al.*, u.name as operator_name
    FROM audit_logs al
    LEFT JOIN users u ON al.operator_id = u.id
    WHERE 1=1
  `;
  const queryParams: any[] = [];

  if (params.entityType) {
    sql += ' AND al.entity_type = ?';
    queryParams.push(params.entityType);
  }
  if (params.entityId) {
    sql += ' AND al.entity_id = ?';
    queryParams.push(params.entityId);
  }
  if (params.operatorId) {
    sql += ' AND al.operator_id = ?';
    queryParams.push(params.operatorId);
  }
  if (params.startTime) {
    sql += ' AND al.timestamp >= ?';
    queryParams.push(params.startTime);
  }
  if (params.endTime) {
    sql += ' AND al.timestamp <= ?';
    queryParams.push(params.endTime);
  }

  sql += ' ORDER BY al.timestamp DESC LIMIT 200';

  const rows = db.prepare(sql).all(...queryParams);
  return rows.map((row: any) => {
    const log = mapAuditLog(row);
    return log;
  });
}

export function getAuditLogById(id: string, userRole?: UserRole): AuditLog | null {
  const sql = `
    SELECT al.*, u.name as operator_name
    FROM audit_logs al
    LEFT JOIN users u ON al.operator_id = u.id
    WHERE al.id = ?
  `;
  const row = db.prepare(sql).get(id);
  if (!row) return null;
  
  const log = mapAuditLog(row);
  return log;
}

export function getAuditLogsByEntity(entityType: string, entityId: string, userRole?: UserRole): AuditLog[] {
  return getAuditLogs({ entityType, entityId, userRole });
}
