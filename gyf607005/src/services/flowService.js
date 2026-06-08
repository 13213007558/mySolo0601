const { getDb } = require('../db');

function importFlowRecords(records, batchNo) {
  const db = getDb();
  const result = {
    valid: 0,
    duplicateVoid: 0,
    error: 0,
    details: []
  };

  const insertStmt = db.prepare(`
    INSERT INTO flow_records 
    (ls_no, baby_id, package_name, package_type, total_hours, total_amount, 
     purchase_date, valid_until, data_source, batch_no, record_status, 
     is_abnormal, abnormal_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const checkExistingStmt = db.prepare(`
    SELECT id, batch_no FROM flow_records 
    WHERE ls_no = ? AND record_status = '有效'
  `);

  const transaction = db.transaction((records) => {
    for (const record of records) {
      try {
        const {
          lsNo,
          babyId,
          packageName,
          packageType,
          totalHours,
          totalAmount,
          purchaseDate,
          validUntil,
          dataSource
        } = record;

        if (!lsNo) {
          result.error++;
          result.details.push({ lsNo, status: 'error', reason: '流水号不能为空' });
          continue;
        }

        const existing = checkExistingStmt.get(lsNo);
        let recordStatus = '有效';
        let isAbnormal = 0;
        let abnormalReason = null;

        if (existing) {
          recordStatus = '重复作废';
          abnormalReason = `同流水号${lsNo}已在${existing.batch_no}存在，本批次自动标记作废`;
          result.duplicateVoid++;
        } else {
          result.valid++;
        }

        insertStmt.run(
          lsNo,
          babyId || null,
          packageName || null,
          packageType || null,
          totalHours || 0,
          totalAmount || 0,
          purchaseDate || null,
          validUntil || null,
          dataSource || '手动录入',
          batchNo,
          recordStatus,
          isAbnormal,
          abnormalReason
        );

        result.details.push({
          lsNo,
          status: recordStatus,
          reason: abnormalReason
        });
      } catch (err) {
        result.error++;
        result.details.push({
          lsNo: record.lsNo || '未知',
          status: 'error',
          reason: err.message
        });
      }
    }
  });

  transaction(records);
  return result;
}

function getFlowStats(flowId) {
  const db = getDb();

  const flowStmt = db.prepare(`
    SELECT total_hours, total_amount, record_status 
    FROM flow_records 
    WHERE id = ?
  `);

  const statsStmt = db.prepare(`
    SELECT 
      COALESCE(SUM(hx_hours), 0) as used_hours,
      COALESCE(SUM(hx_amount), 0) as used_amount
    FROM hx_records 
    WHERE flow_id = ? AND row_status != '异常隔离'
  `);

  const flow = flowStmt.get(flowId);
  if (!flow) {
    return null;
  }

  const stats = statsStmt.get(flowId);
  const totalHours = flow.total_hours || 0;
  const totalAmount = flow.total_amount || 0;
  const usedHours = stats.used_hours || 0;
  const usedAmount = stats.used_amount || 0;

  return {
    flowId,
    recordStatus: flow.record_status,
    totalHours,
    totalAmount,
    usedHours,
    usedAmount,
    remainingHours: Math.max(0, totalHours - usedHours),
    remainingAmount: Math.max(0, totalAmount - usedAmount)
  };
}

function isValidFlow(flowId) {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT record_status, is_abnormal 
    FROM flow_records 
    WHERE id = ?
  `);

  const flow = stmt.get(flowId);
  if (!flow) {
    return false;
  }

  return flow.record_status === '有效' && flow.is_abnormal === 0;
}

module.exports = {
  importFlowRecords,
  getFlowStats,
  isValidFlow
};
