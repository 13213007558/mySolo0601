import { db } from '../db/init';
import { SupplyRecord, StatusChange, RecordStatus, HandleExceptionRequest, PartialSuccessResponse, CreateManualRecordRequest, ItemType } from '../../shared/types';
import { generateId, recordAuditLog } from '../middleware/audit';

function mapStatusChange(row: any): StatusChange {
  return {
    id: row.id,
    recordId: row.record_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    reason: row.reason,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    createdAt: row.created_at
  };
}

function mapSupplyRecord(row: any, statusChanges: StatusChange[] = []): SupplyRecord {
  return {
    id: row.id,
    babyId: row.baby_id,
    babyName: row.baby_name,
    classId: row.class_id,
    className: row.class_name,
    itemName: row.item_name,
    itemType: row.item_type,
    sterilized: row.sterilized === 1,
    status: row.status,
    statusHistory: statusChanges,
    isManual: row.is_manual === 1,
    remark: row.remark,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getStatusChangesByRecordId(recordId: string): StatusChange[] {
  const sql = `
    SELECT sc.*, u.name as operator_name
    FROM status_changes sc
    LEFT JOIN users u ON sc.operator_id = u.id
    WHERE sc.record_id = ?
    ORDER BY sc.created_at
  `;
  const rows = db.prepare(sql).all(recordId);
  return rows.map(mapStatusChange);
}

export function getSupplyRecords(params: {
  classId?: string;
  babyId?: string;
  status?: RecordStatus;
  includeManual?: boolean;
} = {}): SupplyRecord[] {
  let sql = `
    SELECT sr.*, b.name as baby_name, c.name as class_name
    FROM supply_records sr
    LEFT JOIN babies b ON sr.baby_id = b.id
    LEFT JOIN classes c ON sr.class_id = c.id
    WHERE 1=1
  `;
  const queryParams: any[] = [];

  if (params.classId) {
    sql += ' AND sr.class_id = ?';
    queryParams.push(params.classId);
  }
  if (params.babyId) {
    sql += ' AND sr.baby_id = ?';
    queryParams.push(params.babyId);
  }
  if (params.status) {
    sql += ' AND sr.status = ?';
    queryParams.push(params.status);
  }
  if (params.includeManual === false) {
    sql += ' AND sr.is_manual = 0';
  }

  sql += ' ORDER BY sr.created_at DESC';

  const rows = db.prepare(sql).all(...queryParams);
  return rows.map((row: any) => {
    const statusChanges = getStatusChangesByRecordId(row.id);
    return mapSupplyRecord(row, statusChanges);
  });
}

export function getSupplyRecordById(id: string): SupplyRecord | null {
  const sql = `
    SELECT sr.*, b.name as baby_name, c.name as class_name
    FROM supply_records sr
    LEFT JOIN babies b ON sr.baby_id = b.id
    LEFT JOIN classes c ON sr.class_id = c.id
    WHERE sr.id = ?
  `;
  const row = db.prepare(sql).get(id);
  if (!row) return null;
  
  const statusChanges = getStatusChangesByRecordId(id);
  return mapSupplyRecord(row, statusChanges);
}

export function handleException(
  request: HandleExceptionRequest,
  operatorId?: string,
  operatorRole?: string,
  ipAddress: string = 'unknown'
): PartialSuccessResponse {
  const { recordId, action, reason, items } = request;
  
  const record = getSupplyRecordById(recordId);
  if (!record) {
    return {
      success: false,
      partialSuccess: false,
      successItems: [],
      failedItems: [{ itemId: recordId, error: '记录不存在' }],
      message: '记录不存在'
    };
  }

  const successItems: string[] = [];
  const failedItems: { itemId: string; error: string }[] = [];

  const statusMap: Record<string, RecordStatus> = {
    approve: 'approved',
    reject: 'rejected',
    reissue: 'reissued',
    close: 'closed'
  };

  const newStatus = statusMap[action];
  if (!newStatus) {
    return {
      success: false,
      partialSuccess: false,
      successItems: [],
      failedItems: [{ itemId: recordId, error: '无效的操作类型' }],
      message: '无效的操作类型'
    };
  }

  if (items && items.length > 0) {
    const tx = db.transaction(() => {
      for (const item of items) {
        try {
          if (item.action === action) {
            const updateRecord = db.prepare(`
              UPDATE supply_records 
              SET status = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `);
            updateRecord.run(newStatus, item.itemId);

            const insertChange = db.prepare(`
              INSERT INTO status_changes (id, record_id, from_status, to_status, reason, operator_id)
              VALUES (?, ?, ?, ?, ?, ?)
            `);
            insertChange.run(
              generateId(),
              item.itemId,
              record.status,
              newStatus,
              reason,
              operatorId || null
            );

            successItems.push(item.itemId);
          }
        } catch (error: any) {
          failedItems.push({ itemId: item.itemId, error: error.message });
        }
      }
    });

    try {
      tx();
    } catch (error: any) {
      console.error('Transaction error:', error);
    }
  } else {
    try {
      const updateRecord = db.prepare(`
        UPDATE supply_records 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateRecord.run(newStatus, recordId);

      const insertChange = db.prepare(`
        INSERT INTO status_changes (id, record_id, from_status, to_status, reason, operator_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertChange.run(
        generateId(),
        recordId,
        record.status,
        newStatus,
        reason,
        operatorId || null
      );

      successItems.push(recordId);
    } catch (error: any) {
      failedItems.push({ itemId: recordId, error: error.message });
    }
  }

  const updatedRecord = getSupplyRecordById(recordId);
  
  const response: PartialSuccessResponse = {
    success: failedItems.length === 0,
    partialSuccess: successItems.length > 0 && failedItems.length > 0,
    successItems,
    failedItems,
    message: successItems.length > 0 
      ? (failedItems.length > 0 ? '部分操作成功' : '操作成功')
      : '操作失败',
    data: updatedRecord || undefined
  };

  recordAuditLog(
    'update',
    'supply_record',
    recordId,
    operatorId,
    operatorRole as any,
    ipAddress,
    request,
    response,
    successItems.length > 0,
    failedItems.length > 0 ? failedItems.map(f => f.error).join('; ') : undefined
  );

  return response;
}

export function createManualRecord(
  request: CreateManualRecordRequest,
  operatorId?: string,
  operatorRole?: string,
  ipAddress: string = 'unknown'
): { success: boolean; data?: SupplyRecord; message: string } {
  const { babyId, itemName, itemType, remark } = request;

  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(babyId);
  if (!baby) {
    return { success: false, message: '宝宝不存在' };
  }

  try {
    const recordId = generateId();
    const newRecord = db.prepare(`
      INSERT INTO supply_records (id, baby_id, class_id, item_name, item_type, sterilized, status, is_manual, remark)
      VALUES (?, ?, ?, ?, ?, 1, 'manual', 1, ?)
    `);
    newRecord.run(recordId, babyId, (baby as any).class_id, itemName, itemType, remark);

    const insertChange = db.prepare(`
      INSERT INTO status_changes (id, record_id, from_status, to_status, reason, operator_id)
      VALUES (?, ?, 'pending', 'manual', ?, ?)
    `);
    insertChange.run(generateId(), recordId, remark || '手工补录记录', operatorId || null);

    const createdRecord = getSupplyRecordById(recordId);

    recordAuditLog(
      'create',
      'supply_record',
      recordId,
      operatorId,
      operatorRole as any,
      ipAddress,
      request,
      { success: true, data: createdRecord },
      true
    );

    return { success: true, data: createdRecord, message: '手工补录成功' };
  } catch (error: any) {
    recordAuditLog(
      'create',
      'supply_record',
      'unknown',
      operatorId,
      operatorRole as any,
      ipAddress,
      request,
      { success: false, error: error.message },
      false,
      error.message
    );

    return { success: false, message: error.message };
  }
}

export function getPendingRecords(): SupplyRecord[] {
  return getSupplyRecords({ status: 'pending' });
}

export function getExceptionRecords(): SupplyRecord[] {
  return getSupplyRecords({})
    .filter(r => r.status === 'pending' || r.status === 'rejected');
}
