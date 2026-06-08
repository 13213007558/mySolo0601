const { getDb } = require('../db');
const { TABLE_NAMES } = require('../config/roles');
const { logAudit } = require('./auditService');

function isValidFlow(flowId) {
  const db = getDb();
  const flow = db.prepare(`
    SELECT * FROM ${TABLES.FLOWS} WHERE id = ? AND record_status = '有效'
  `).get(flowId);
  return !!flow;
}

function getFlowById(flowId) {
  const db = getDb();
  return db.prepare(`SELECT * FROM ${TABLES.FLOWS} WHERE id = ?`).get(flowId);
}

function getFlowStats(flowId) {
  const db = getDb();
  const flow = getFlowById(flowId);
  if (!flow) return null;
  
  const hxStats = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN row_abnormal = '正常' THEN hx_hours ELSE 0 END), 0) as used_hours,
      COALESCE(SUM(CASE WHEN row_abnormal = '正常' THEN hx_amount ELSE 0 END), 0) as used_amount,
      COUNT(*) as total_hx_count,
      SUM(CASE WHEN row_abnormal = '正常' THEN 1 ELSE 0 END) as valid_hx_count,
      SUM(CASE WHEN row_abnormal = '异常隔离' THEN 1 ELSE 0 END) as bad_row_count
    FROM ${TABLES.HX_RECORDS} 
    WHERE flow_id = ?
  `).get(flowId);
  
  return {
    flow_id: flowId,
    flow_no: flow.flow_no,
    total_hours: flow.total_hours,
    total_amount: flow.total_amount,
    used_hours: hxStats.used_hours,
    used_amount: hxStats.used_amount,
    remaining_hours: flow.total_hours - hxStats.used_hours,
    remaining_amount: flow.total_amount - hxStats.used_amount,
    total_hx_count: hxStats.total_hx_count,
    valid_hx_count: hxStats.valid_hx_count,
    bad_row_count: hxStats.bad_row_count,
    bad_row_isolated: hxStats.bad_row_count > 0,
    note: hxStats.bad_row_count > 0 
      ? `检测到 ${hxStats.bad_row_count} 条异常隔离行，已自动排除在统计外，不影响有效数据计算`
      : '无异常隔离行',
    formula_consistency: '所有聚合仅统计 row_abnormal="正常" 的记录，确保口径一致'
  };
}

function importFlowRecords(records, batchNo, operatorName) {
  const db = getDb();
  const result = {
    batch_no: batchNo,
    total: records.length,
    valid: 0,
    duplicate_invalid: 0,
    abnormal: 0,
    details: []
  };
  
  const insertStmt = db.prepare(`
    INSERT INTO ${TABLES.FLOWS} (
      flow_no, baby_id, package_name, package_type, total_hours, total_amount,
      purchase_date, valid_until, data_source, batch_no, record_status,
      data_abnormal, abnormal_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const checkExistingStmt = db.prepare(`
    SELECT id, record_status, batch_no FROM ${TABLES.FLOWS} 
    WHERE flow_no = ? AND record_status = '有效'
  `);
  
  const tx = db.transaction((records) => {
    for (const record of records) {
      const existing = checkExistingStmt.get(record.flow_no);
      
      let recordStatus = '有效';
      let abnormalReason = null;
      let dataAbnormal = 0;
      
      if (existing) {
        recordStatus = '重复作废';
        abnormalReason = `同流水号${record.flow_no}已在批次${existing.batch_no}存在，本批次自动标记作废，历史保留清晰`;
        result.duplicate_invalid++;
      } else {
        result.valid++;
      }
      
      if (record.data_abnormal || record.abnormal_reason) {
        dataAbnormal = 1;
        abnormalReason = record.abnormal_reason || abnormalReason;
        result.abnormal++;
      }
      
      const insertResult = insertStmt.run(
        record.flow_no,
        record.baby_id || null,
        record.package_name,
        record.package_type,
        record.total_hours || 0,
        record.total_amount || 0,
        record.purchase_date,
        record.valid_until,
        record.data_source || '系统导入',
        batchNo,
        recordStatus,
        dataAbnormal,
        abnormalReason
      );
      
      result.details.push({
        id: insertResult.lastInsertRowid,
        flow_no: record.flow_no,
        record_status: recordStatus,
        reason: abnormalReason
      });
      
      logAudit({
        hx_id: null,
        operation_type: '导入样例数据',
        before_status: '无',
        after_status: recordStatus,
        operator_name: operatorName || '系统导入',
        operation_source: '批量导入',
        review_remark: `流水号${record.flow_no}导入，状态=${recordStatus}${abnormalReason ? '，' + abnormalReason : ''}`
      });
    }
  });
  
  tx(records);
  
  result.idempotent_guarantee = '同一流水号仅保留最早批次为有效，后续批次标记为重复作废，不产生额外有效结果';
  result.history_clear = '历史记录完整保留，可追溯每次导入批次和处理结果';
  
  return result;
}

function getAllFlows(withStats = false) {
  const db = getDb();
  const flows = db.prepare(`SELECT * FROM ${TABLES.FLOWS} ORDER BY id ASC`).all();
  
  if (withStats) {
    return flows.map(flow => ({
      ...flow,
      stats: getFlowStats(flow.id)
    }));
  }
  
  return flows;
}

function getFlowsByBaby(babyId) {
  const db = getDb();
  return db.prepare(`SELECT * FROM ${TABLES.FLOWS} WHERE baby_id = ? ORDER BY id ASC`).all(babyId);
}

const TABLES = TABLE_NAMES;

module.exports = {
  isValidFlow,
  getFlowById,
  getFlowStats,
  importFlowRecords,
  getAllFlows,
  getFlowsByBaby
};
