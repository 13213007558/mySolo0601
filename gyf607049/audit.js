const db = require('./db');

const VALID_OPERATORS = {
  'nurse_zhang': '张护士',
  'nurse_li': '李护士',
  'auntie_wang': '王阿姨',
  'director_chen': '陈主管',
  'health_teacher': '保健老师'
};

function resolveOperator(raw) {
  if (!raw) {
    return { operator: null, operator_display: '未知处理人', found: 0 };
  }
  const display = VALID_OPERATORS[raw];
  if (display) {
    return { operator: raw, operator_display: display, found: 1 };
  }
  return { operator: raw, operator_display: raw + '(未注册)', found: 0 };
}

function logAudit({ authorization_id, action, field, old_value, new_value, operator, detail }) {
  const resolved = resolveOperator(operator);
  const stmt = db.prepare(`
    INSERT INTO audit_logs
    (authorization_id, action, field, old_value, new_value, operator, operator_display, operator_found, detail)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    authorization_id || null,
    action,
    field || null,
    old_value !== undefined && old_value !== null ? String(old_value) : null,
    new_value !== undefined && new_value !== null ? String(new_value) : null,
    resolved.operator,
    resolved.operator_display,
    resolved.found,
    detail || null
  );
  return info.lastInsertRowid;
}

function getAuditByAuth(authorization_id) {
  return db.prepare(`
    SELECT * FROM audit_logs
    WHERE authorization_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(authorization_id);
}

function getAllAudit() {
  return db.prepare(`
    SELECT * FROM audit_logs
    ORDER BY created_at DESC, id DESC
  `).all();
}

function getMissingOperatorAudits() {
  return db.prepare(`
    SELECT * FROM audit_logs
    WHERE operator_found = 0
    ORDER BY created_at DESC, id DESC
  `).all();
}

module.exports = {
  logAudit,
  getAuditByAuth,
  getAllAudit,
  getMissingOperatorAudits,
  resolveOperator,
  VALID_OPERATORS
};
