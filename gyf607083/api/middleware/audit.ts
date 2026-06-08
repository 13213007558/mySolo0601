import { Request, Response, NextFunction } from 'express';
import { db } from '../db/init';
import { OperationType, UserRole } from '../../shared/types';
import { filterLogPrivacy } from './privacyFilter';

let insertAuditLog: any = null;

function getInsertAuditLog() {
  if (!insertAuditLog) {
    insertAuditLog = db.prepare(`
      INSERT INTO audit_logs 
      (id, operation_type, entity_type, entity_id, operator_id, operator_role, ip_address, request_params, response_data, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  }
  return insertAuditLog;
}

export function generateId(): string {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function auditMiddleware(
  operationType: OperationType,
  entityType: string,
  getEntityId?: (req: Request, res: Response) => string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const operatorId = req.headers['x-user-id'] as string | undefined;
    const operatorRole = req.headers['x-user-role'] as UserRole | undefined;
    const ipAddress = getClientIp(req);

    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    let responseSent = false;
    let responseBody: any = null;

    const sendAuditLog = (success: boolean, errorMessage?: string) => {
      if (responseSent) return;
      responseSent = true;

      try {
        const entityId = getEntityId ? getEntityId(req, res) : req.params.id || req.body?.id || 'unknown';
        
        const requestParams = JSON.stringify({
          body: req.body,
          params: req.params,
          query: req.query
        });

        const responseData = responseBody ? JSON.stringify(responseBody) : '{}';
        
        const filteredRequestParams = filterLogPrivacy(requestParams, operatorRole);
        const filteredResponseData = filterLogPrivacy(responseData, operatorRole);

        setImmediate(() => {
          try {
            getInsertAuditLog().run(
              generateId(),
              operationType,
              entityType,
              entityId,
              operatorId || null,
              operatorRole || null,
              ipAddress,
              filteredRequestParams,
              filteredResponseData,
              success ? 1 : 0,
              errorMessage || null
            );
          } catch (dbError) {
            console.error('Failed to insert audit log:', dbError);
          }
        });
      } catch (error) {
        console.error('Audit log preparation failed:', error);
      }
    };

    res.json = function(data: any) {
      responseBody = data;
      const result = originalJson(data);
      sendAuditLog(res.statusCode < 400);
      return result;
    };

    res.send = function(data: any) {
      if (typeof data === 'object' && data !== null) {
        responseBody = data;
      }
      const result = originalSend(data);
      sendAuditLog(res.statusCode < 400);
      return result;
    };

    res.on('finish', () => {
      if (!responseSent) {
        sendAuditLog(res.statusCode < 400);
      }
    });

    res.on('close', () => {
      if (!responseSent) {
        sendAuditLog(false, 'Connection closed');
      }
    });

    next();
  };
}

export function recordAuditLog(
  operationType: OperationType,
  entityType: string,
  entityId: string,
  operatorId: string | null | undefined,
  operatorRole: UserRole | null | undefined,
  ipAddress: string,
  requestParams: any,
  responseData: any,
  success: boolean,
  errorMessage?: string
) {
  try {
    const reqParams = typeof requestParams === 'string' ? requestParams : JSON.stringify(requestParams);
    const resData = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
    
    const filteredReq = filterLogPrivacy(reqParams, operatorRole);
    const filteredRes = filterLogPrivacy(resData, operatorRole);

    getInsertAuditLog().run(
      generateId(),
      operationType,
      entityType,
      entityId,
      operatorId || null,
      operatorRole || null,
      ipAddress,
      filteredReq,
      filteredRes,
      success ? 1 : 0,
      errorMessage || null
    );
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}
