const { getDb } = require('../db');
const { TABLE_NAMES } = require('../config/roles');

function logAudit(data) {
  const db = getDb();
  
  const {
    audit_no,
    hx_id,
    operation_type,
    before_status,
    after_status,
    operator_id,
    operator_name,
    operation_time,
    operation_source = '人工操作',
    need_review = 0,
    review_remark
  } = data;
  
  if (!operator_name) {
    throw new Error('审计日志必须包含处理人姓名冗余(operator_name)，确保账号注销后审计不丢失');
  }
  
  const stmt = db.prepare(`
    INSERT INTO ${TABLE_NAMES.AUDIT_LOGS} (
      audit_no, hx_id, operation_type, before_status, after_status,
      operator_id, operator_name, operation_time, operation_source,
      need_review, review_remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    audit_no,
    hx_id || null,
    operation_type,
    before_status || '无',
    after_status || '无',
    operator_id || null,
    operator_name,
    operation_time || new Date().toISOString(),
    operation_source,
    need_review ? 1 : 0,
    review_remark || null
  );
  
  return {
    id: result.lastInsertRowid,
    audit_no,
    operator_name,
    operator_id_preserved: !!operator_id,
    audit_retained: true,
    message: operator_id 
      ? '审计记录已保存，处理人ID和姓名双冗余' 
      : '审计记录已保存，处理人ID为空但姓名冗余已保留，账号注销后仍可追溯'
  };
}

function getAuditsForHx(hxId) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM ${TABLE_NAMES.AUDIT_LOGS} 
    WHERE hx_id = ? 
    ORDER BY operation_time DESC
  `).all(hxId);
}

function getAuditsNeedReview() {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM ${TABLE_NAMES.AUDIT_LOGS} 
    WHERE need_review = 1 AND review_status = '未复查'
    ORDER BY operation_time DESC
  `).all();
}

function getAuditById(auditId) {
  const db = getDb();
  return db.prepare(`SELECT * FROM ${TABLE_NAMES.AUDIT_LOGS} WHERE id = ?`).get(auditId);
}

function updateReviewStatus(auditId, status, reviewer, remark) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE ${TABLE_NAMES.AUDIT_LOGS} 
    SET review_status = ?, reviewer = ?, review_remark = ?, need_review = 0
    WHERE id = ?
  `);
  stmt.run(status, reviewer, remark, auditId);
  return getAuditById(auditId);
}

function getAllAudits() {
  const db = getDb();
  return db.prepare(`SELECT * FROM ${TABLE_NAMES.AUDIT_LOGS} ORDER BY operation_time DESC`).all();
}

function getAuditStats() {
  const db = getDb();
  return {
    total: db.prepare(`SELECT COUNT(*) as count FROM ${TABLE_NAMES.AUDIT_LOGS}`).get().count,
    need_review: db.prepare(`SELECT COUNT(*) as count FROM ${TABLE_NAMES.AUDIT_LOGS} WHERE need_review = 1`).get().count,
    reviewed: db.prepare(`SELECT COUNT(*) as count FROM ${TABLE_NAMES.AUDIT_LOGS} WHERE review_status != '