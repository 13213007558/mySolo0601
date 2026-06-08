const { getDb } = require('../db');
const { TABLE_NAMES } = require('../config/roles');
const { getFlowStats, isValidFlow } = require('./flowService');
const { logAudit, getAuditsForHx } = require('./auditService');

function createHxRecord(data, operatorName) {
  const db = getDb();
  
  if (!isValidFlow(data.flow_id)) {
    throw new Error('关联的课包流水无效或已作废，无法创建核销记录');
  }
  
  const stmt = db.prepare(`
    INSERT INTO ${TABLES.HX_RECORDS} (
      hx_no, flow_id, baby_id, hx_date, hx_hours, hx_amount,
      process_status, process_result, operator, process_time,
      is_closed, allow_partial_success, row_abnormal, abnormal_reason,
      is_manual, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const hxNo = data.hx_no || `HX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const result = stmt.run(
    hxNo,
    data.flow_id,
    data.baby_id || null,
    data.hx_date,
    data.hx_hours || 0,
    data.hx_amount || 0,
    data.process_status || '待处理',
    data.process_result || null,
    data.operator || null,
    data.process_time || null,
    data.is_closed ? 1 : 0,
    data.allow_partial_success ? 1 : 0,
    data.row_abnormal || '正常',
    data.abnormal_reason || null,
    data.is_manual ? 1 : 0,
    data.remark || null
  );
  
  const hxId = result.lastInsertRowid;
  
  logAudit({
    hx_id: hxId,
    operation_type: data.is_manual ? '手工补录' : '创建核销记录',
    before_status: '无',
    after_status: data.process_status || '待处理',
    operator_id: data.operator || null,
    operator_name: operatorName,
    operation_source: '人工操作',
    review_remark: data.is_manual ? '手工补录核销记录，请主管复核' : null
  });
  
  return {
    id: hxId,
    hx_no: hxNo,
    flow_id: data.flow_id,
    is_manual: !!data.is_manual,
    audit_logged: true
  };
}

function updateHxStatus(hxId, status, operator, operatorName, result) {
  const db = getDb();
  
  const oldHx = db.prepare(`SELECT * FROM ${TABLES.HX_RECORDS} WHERE id = ?`).get(hxId);
  if (!oldHx) throw new Error('核销记录不存在');
  
  const stmt = db.prepare(`
    UPDATE ${TABLES.HX_RECORDS} 
    SET process_status = ?, process_result = ?, operator = ?, process_time = ?
    WHERE id = ?
  `);
  
  stmt.run(
    status,
    result || oldHx.process_result,
    operator || oldHx.operator,
    new Date().toISOString(),
    hxId
  );
  
  logAudit({
    hx_id: hxId,
    operation_type: '更新核销状态',
    before_status: oldHx.process_status,
    after_status: status,
    operator_id: operator,
    operator_name: operatorName,
    operation_source: '人工操作',
    review_remark: result
  });
  
  return {
    hx_id: hxId,
    status_updated: true,
    from: oldHx.process_status,
    to: status
  };
}

function closeHxRecord(hxId, operator, operatorName) {
  const db = getDb();
  
  const oldHx = db.prepare(`SELECT * FROM ${TABLES.HX_RECORDS} WHERE id = ?`).get(hxId);
  if (!oldHx) throw new Error('核销记录不存在');
  
  const stmt = db.prepare(`
    UPDATE ${TABLES.HX_RECORDS} 
    SET is_closed = 1, process_status = '已关闭', process_time = ?
    WHERE id = ?
  `);
  
  stmt.run(new Date().toISOString(), hxId);
  
  logAudit({
    hx_id: hxId,
    operation_type: '关闭核销记录',
    before_status: oldHx.process_status,
    after_status: '已关闭',
    operator_id: operator,
    operator_name: operatorName,
    operation_source: '人工操作'
  });
  
  return {
    hx_id: hxId,
    closed: true,
    note: '核销已关闭，后续可追加补录材料并允许部分成功'
  };
}

function addBlToClosedHx(hxId, blData, operator, operatorName) {
  const db = getDb();
  
  const hx = db.prepare(`SELECT * FROM ${TABLES.HX_RECORDS} WHERE id = ?`).get(hxId);
  if (!hx) throw new Error('核销记录不存在');
  
  if (!hx.is_closed) {
    throw new Error('该核销记录未关闭，无需追加补录材料');
  }
  
  const updateStmt = db.prepare(`
    UPDATE ${TABLES.HX_RECORDS} 
    SET allow_partial_success = 1 
    WHERE id = ?
  `);
  updateStmt.run(hxId);
  
  const blStmt = db.prepare(`
    INSERT INTO ${TABLES.BL_RECORDS} (
      bl_no, hx_id, baby_id, material_type, material_desc,
      submit_time, submitter, process_status, process_result,
      operator, process_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const blNo = blData.bl_no || `BL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const blResult = blStmt.run(
    blNo,
    hxId,
    hx.baby_id,
    blData.material_type,
    blData.material_desc,
    blData.submit_time || new Date().toISOString(),
    blData.submitter || null,
    blData.process_status || '待处理',
    blData.process_result || null,
    operator || null,
    new Date().toISOString()
  );
  
  const blId = blResult.lastInsertRowid;
  
  const blIds = JSON.parse(hx.bl_ids || '[]');
  blIds.push(blId);
  db.prepare(`UPDATE ${TABLES.HX_RECORDS} SET bl_ids = ? WHERE id = ?`)
    .run(JSON.stringify(blIds), hxId);
  
  logAudit({
    hx_id: hxId,
    operation_type: '追加补录材料',
    before_status: '已关闭',
    after_status: blData.process_status || '待处理',
    operator_id: operator,
    operator_name: operatorName,
    operation_source: '人工操作',
    need_review: blData.process_status === '部分成功',
    review_remark: `已关闭核销${hx.hx_no}追加补录材料${blNo}，自动勾选允许部分成功，状态=${blData.process_status || '待处理'}`
  });
  
  return {
    bl_id: blId,
    bl_no: blNo,
    hx_id: hxId,
    allow_partial_success: true,
    partial_success_enabled: '已自动勾选允许部分成功',
    note: '已关闭后追加补录材料成功，允许部分成功'
  };
}

function markBadRow(hxId, reason, operatorName) {
  const db = getDb();
  
  const oldHx = db.prepare(`SELECT * FROM ${TABLES.HX_RECORDS} WHERE id = ?`).get(hxId);
  if (!oldHx) throw new Error('核销记录不存在');
  
  if (oldHx.row_abnormal === '异常隔离') {
    return { hx_id: hxId, already_isolated: true };
  }
  
  const stmt = db.prepare(`
    UPDATE ${TABLES.HX_RECORDS} 
    SET row_abnormal = '异常隔离', abnormal_reason = ?, process_status = '异常'
    WHERE id = ?
  `);
  
  stmt.run(reason, hxId);
  
  logAudit({
    hx_id: hxId,
    operation_type: '数据异常标记',
    before_status: oldHx.process_status,
    after_status: '异常隔离',
    operator_id: null,
    operator_name: operatorName,
    operation_source: '系统自动',
    need_review: 1,
    review_remark: `${reason}，系统自动标记异常隔离。重要：该行已独立隔离，不会影响同宝宝其他正常记录的统计计算。`
  });
  
  return {
    hx_id: hxId,
    bad_row_isolated: true,
    row_level_isolation: '该行异常仅影响自身，不污染其他记录',
    other_records_safe: '同宝宝的其他正常核销记录不会受影响',
    formula_excluded: '所有公式计算已自动排除该行，口径保持一致'
  };
}

function getCompleteTrace(hxId) {
  const db = getDb();
  
  const hx = db.prepare(`SELECT * FROM ${TABLES.HX_RECORDS} WHERE id = ?`).get(hxId);
  if (!hx) return null;
  
  const flow = hx.flow_id ? db.prepare(`SELECT * FROM ${TABLES.FLOWS} WHERE id = ?`).get(hx.flow_id) : null;
  const baby = hx.baby_id ? db.prepare(`SELECT * FROM ${TABLES.BABIES} WHERE id = ?`).get(hx.baby_id) : null;
  const flowStats = hx.flow_id ? getFlowStats(hx.flow_id) : null;
  const blRecords = JSON.parse(hx.bl_ids || '[]').length > 0 
    ? db.prepare(`SELECT * FROM ${TABLES.BL_RECORDS} WHERE hx_id = ? ORDER BY id ASC`).all(hxId)
    : [];
  const audits = getAuditsForHx(hxId);
  
  const trace = {
    baby: baby ? { id: baby.id, name: baby.baby_name, code: baby.baby_code } : null,
    flow: flow ? {
      id: flow.id,
      flow_no: flow.flow_no,
      package_name: flow.package_name,
      total_hours: flow.total_hours,
      total_amount: flow.total_amount,
      stats: flowStats
    } : null,
    hx: {
      id: hx.id,
      hx_no: hx.hx_no,
      hx_date: hx.hx_date,
      hx_hours: hx.hx_hours,
      hx_amount: hx.hx_amount,
      process_status: hx.process_status,
      process_result: hx.process_result,
      is_closed: !!hx.is_closed,
      allow_partial_success: !!hx.allow_partial_success,
      row_abnormal: hx.row_abnormal,
      is_manual: !!hx.is_manual,
      remark: hx.remark
    },
    bl_records: blRecords.map(bl => ({
      id: bl.id,
      bl_no: bl.bl_no,
      material_type: bl.material_type,
      material_desc: bl.material_desc,
      process_status: bl.process_status,
      process_result: bl.process_result
    })),
    audit_logs: audits,
    bl_count: blRecords.length,
    audit_count: audits.length,
    complete_trace_text: `课包流水:${flow?.package_name || '无'} → 核销状态:${hx.process_status} → 处理结果:${hx.process_result || '待处理'} → 补录材料数:${blRecords.length}条 → 审计记录数:${audits.length}条`
  };
  
  return trace;
}

function getAllHxRecords() {
  const db = getDb();
  return db.prepare(`SELECT * FROM ${TABLES.HX_RECORDS} ORDER BY id ASC`).all();
}

function getHxRecordsByBaby(babyId) {
  const db = getDb();
  return db.prepare(`SELECT * FROM ${TABLES.HX_RECORDS} WHERE baby_id = ? ORDER BY id ASC`).all(babyId);
}

const TABLES = TABLE_NAMES;

module.exports = {
  createHxRecord,
  updateHxStatus,
  closeHxRecord,
  addBlToClosedHx,
  markBadRow,
  getCompleteTrace,
  getAllHxRecords,
  getHxRecordsByBaby
};
