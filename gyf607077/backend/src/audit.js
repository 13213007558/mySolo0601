const db = require('./db');

function writeAudit({ observationId, userId, action, oldValue, newValue, ip, userAgent }) {
  const stmt = db.prepare(`
    INSERT INTO audits (observation_id, user_id, action, old_value, new_value, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    observationId || null,
    userId,
    action,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    ip || null,
    userAgent || null
  );
}

function writeTimeline({ observationId, action, actorId, fromStatus, toStatus, comment, fieldsChanged, metadata }) {
  const stmt = db.prepare(`
    INSERT INTO timelines (observation_id, action, actor_id, from_status, to_status, comment, fields_changed, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    observationId,
    action,
    actorId,
    fromStatus || null,
    toStatus || null,
    comment || null,
    fieldsChanged ? JSON.stringify(fieldsChanged) : null,
    metadata ? JSON.stringify(metadata) : null
  );
}

function getTimeline(observationId) {
  const rows = db.prepare(`
    SELECT t.*, u.display_name AS actor_name, u.role AS actor_role
    FROM timelines t
    LEFT JOIN users u ON u.id = t.actor_id
    WHERE t.observation_id = ?
    ORDER BY t.created_at DESC, t.id DESC
  `).all(observationId);
  return rows.map(r => ({
    ...r,
    fields_changed: r.fields_changed ? JSON.parse(r.fields_changed) : null,
    metadata: r.metadata ? JSON.parse(r.metadata) : null
  }));
}

function getAudits(observationId) {
  const rows = db.prepare(`
    SELECT a.*, u.display_name AS user_name, u.role AS user_role
    FROM audits a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.observation_id = ?
    ORDER BY a.created_at DESC, a.id DESC
  `).all(observationId);
  return rows.map(r => ({
    ...r,
    old_value: r.old_value ? JSON.parse(r.old_value) : null,
    new_value: r.new_value ? JSON.parse(r.new_value) : null
  }));
}

module.exports = { writeAudit, writeTimeline, getTimeline, getAudits };
