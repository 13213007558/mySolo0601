const { getDb } = require('../db');
const { TABLE_NAMES } = require('../config/roles');

function logAudit(data) {
  const db = getDb();
  
  if (!data.operator_name) {
    throw new Error('审计日志必须提供处理人姓名冗余(operator_name)，确保账号注销后审计仍保留');
  }
  
  const stmt = db.prepare(`
    INSERT INTO ${TABLES.AUDIT_LOGS} (
      audit_no, hx_id, operation_type, before_status, after_status,
      operator_id, operator_name, operation_time, operation_source,
      need_review, review_status, review_remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const auditNo = data.audit_no || `SJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const result = stmt.run(
    auditNo,
    data.hx_id || null,
    data.operation_type,
    data.before_status || '无',
    data.after_status || '无',
    data.operator_id || null,
    data.operator_name,
    data.operation_time || new Date().toISOString(),
    data.operation_source || '人工操作',
    data.need_review ? 1 : 0,
    data.review_status || '未复查',
    data.review_remark || null
  );
  
  return {
    id: result.lastInsertRowid,
    audit_no: auditNo,
    preserved: true,
    note: '审计记录已永久保留，即使处理人账号注销，处理人姓名冗余字段仍可追溯'
  };
}

function getAuditsForHx(hxId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM ${TABLES.AUDIT_LOGS} 
    WHERE hx_id = ? 
    ORDER BY operation_time ASC
  `);
  const audits = stmt.all(hxId);
  
  return audits.map(audit => ({
    ...audit,
    operator_preserved: !!audit.operator_name,
    operator_status: audit.operator_id 
      ? '账号存在' 
      : '账号可能已注销，但姓名冗余已保留'
  }));
}

function getAuditsNeedReview() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM ${TABLES.AUDIT_LOGS} 
    WHERE need_review = 1 AND review_status = '未复查'
    ORDER BY operation_time DESC
  `);
  return stmt.all();
}

function getAllAudits() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM ${TABLES.AUDIT_LOGS} 
    ORDER BY operation_time DESC
  `);
  return stmt.all();
}

function updateReviewStatus(auditId, status, reviewer, remark) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE ${TABLES.AUDIT_LOGS} 
    SET review_status = ?, reviewer = ?, review_remark = ?
    WHERE id = ?
  `);
  return stmt.run(status, reviewer, remark, auditId);
}

function getAuditStats() {
  const db = getDb();
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM ${TABLES.AUDIT_LOGS}`).get().count;
  const needReview = db.prepare(`SELECT COUNT(*) as count FROM ${TABLES.AUDIT_LOGS} WHERE need_review = 1`).get().count;
  const reviewed = db.prepare(`SELECT COUNT(*) as count FROM ${TABLES.AUDIT_LOGS} WHERE review_status != '未复查'`).get().count;
  const operatorNull = db.prepare(`SELECT COUNT(*) as count FROM ${TABLES.AUDIT_LOGS} WHERE operator_id IS NULL AND operator_name IS NOT NULL`).get().count;
  
  return {
    total,
    needReview,
    reviewed,
    operatorNamePreserved: operatorNull,
    note: `${operatorNull} 条审计记录处理人ID为空，但姓名冗余已保留，审计不丢失`
  };
}

const TABLES = TABLE_NAMES;

module.exports = {
  logAudit,
  getAuditsForHx,
  getAuditsNeedReview,
  getAllAudits,
  updateReviewStatus,
  getAuditStats
};
